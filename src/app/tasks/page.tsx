"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase, Task } from "@/lib/supabase";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  MoreHorizontal,
  AlertCircle,
  GripVertical,
  X,
  Tag,
  User,
  FileText,
  Edit3,
  Check,
} from "lucide-react";

const priorityColors = {
  low: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  high: "text-red-400 border-red-400/30 bg-red-400/10",
};

const columns = [
  { id: "todo", title: "To Do", icon: Circle, color: "text-muted-foreground" },
  { id: "in_progress", title: "In Progress", icon: Clock, color: "text-primary" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "text-accent" },
];

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function formatDueDate(date: string | null): string {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 0) return "Overdue";
    if (diff < 7) return `${diff} days`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-secondary/60 rounded-lg border border-border/50 hover:border-border transition-all cursor-pointer group ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-0.5 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <p
              className={`font-medium text-sm ${
                task.column_id === "done"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {task.title}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs ${
                priorityColors[task.priority as keyof typeof priorityColors] ||
                priorityColors.medium
              }`}
            >
              {task.priority}
            </Badge>
            {task.due_date && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  formatDueDate(task.due_date) === "Overdue"
                    ? "text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {formatDueDate(task.due_date)}
              </span>
            )}
            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-1">
                {task.labels.slice(0, 2).map((label, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs text-muted-foreground border-border"
                  >
                    {label}
                  </Badge>
                ))}
                {task.labels.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground border-border"
                  >
                    +{task.labels.length - 2}
                  </Badge>
                )}
              </div>
            )}
            {task.assignees && task.assignees.length > 0 && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <User className="w-3 h-3" />
                {task.assignees.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="p-3 bg-card rounded-lg border border-primary/30 shadow-xl cursor-grabbing">
      <p className="font-medium text-sm">{task.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge
          variant="outline"
          className={`text-xs ${
            priorityColors[task.priority as keyof typeof priorityColors] ||
            priorityColors.medium
          }`}
        >
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}

// Task Detail Modal Component
function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
}: {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!task || !editedTask) return null;

  async function saveChanges() {
    if (!editedTask) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editedTask.title,
          description: editedTask.description,
          notes: editedTask.notes,
          priority: editedTask.priority,
          column_id: editedTask.column_id,
          due_date: editedTask.due_date,
          labels: editedTask.labels,
          assignees: editedTask.assignees,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedTask.id);

      if (error) throw error;
      onUpdate(editedTask);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setSaving(false);
    }
  }

  function addLabel() {
    if (!newLabel.trim() || !editedTask) return;
    const labels = editedTask.labels || [];
    if (!labels.includes(newLabel.trim())) {
      setEditedTask({ ...editedTask, labels: [...labels, newLabel.trim()] });
    }
    setNewLabel("");
  }

  function removeLabel(label: string) {
    if (!editedTask) return;
    setEditedTask({
      ...editedTask,
      labels: (editedTask.labels || []).filter((l) => l !== label),
    });
  }

  function addAssignee() {
    if (!newAssignee.trim() || !editedTask) return;
    const assignees = editedTask.assignees || [];
    if (!assignees.includes(newAssignee.trim())) {
      setEditedTask({
        ...editedTask,
        assignees: [...assignees, newAssignee.trim()],
      });
    }
    setNewAssignee("");
  }

  function removeAssignee(assignee: string) {
    if (!editedTask) return;
    setEditedTask({
      ...editedTask,
      assignees: (editedTask.assignees || []).filter((a) => a !== assignee),
    });
  }

  const hasChanges = JSON.stringify(task) !== JSON.stringify(editedTask);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="space-y-1">
          <div className="flex items-start justify-between">
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className="text-xl font-bold bg-secondary border-border"
                autoFocus
              />
            ) : (
              <DialogTitle
                className={`text-xl cursor-pointer hover:text-primary transition-colors ${
                  editedTask.column_id === "done"
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
                onClick={() => setIsEditing(true)}
              >
                {editedTask.title}
                <Edit3 className="w-4 h-4 inline ml-2 opacity-50" />
              </DialogTitle>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Created{" "}
              {format(new Date(editedTask.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
            {editedTask.updated_at !== editedTask.created_at && (
              <span>
                · Updated{" "}
                {format(new Date(editedTask.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Status
              </label>
              <Select
                value={editedTask.column_id}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    column_id: value as Task["column_id"],
                  })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" />
                      To Do
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="done">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      Done
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Priority
              </label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    priority: value as Task["priority"],
                  })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge
                      variant="outline"
                      className={priorityColors.low}
                    >
                      Low
                    </Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge
                      variant="outline"
                      className={priorityColors.medium}
                    >
                      Medium
                    </Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge
                      variant="outline"
                      className={priorityColors.high}
                    >
                      High
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Due Date
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-secondary border-border"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedTask.due_date
                    ? format(new Date(editedTask.due_date), "PPP")
                    : "Select a date"}
                  {editedTask.due_date && (
                    <X
                      className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditedTask({ ...editedTask, due_date: null });
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    editedTask.due_date
                      ? new Date(editedTask.due_date)
                      : undefined
                  }
                  onSelect={(date) => {
                    setEditedTask({
                      ...editedTask,
                      due_date: date ? date.toISOString() : null,
                    });
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <Textarea
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              placeholder="Add a description..."
              className="min-h-[100px] bg-secondary border-border"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Notes
            </label>
            <Textarea
              value={editedTask.notes || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, notes: e.target.value })
              }
              placeholder="Add notes, updates, or comments..."
              className="min-h-[80px] bg-secondary border-border"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(editedTask.labels || []).map((label, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-sm bg-primary/10 border-primary/30 text-primary"
                >
                  {label}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-400"
                    onClick={() => removeLabel(label)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add a label..."
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && addLabel()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addLabel}
                className="border-border"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Assignees
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(editedTask.assignees || []).map((assignee, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-sm bg-accent/10 border-accent/30 text-accent"
                >
                  {assignee}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-400"
                    onClick={() => removeAssignee(assignee)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="Add an assignee..."
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && addAssignee()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addAssignee}
                className="border-border"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-24 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-48 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-96 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask,
          category: "general",
          column_id: "todo",
          priority: "medium",
          labels: [],
          assignees: [],
        })
        .select()
        .single();

      if (error) throw error;
      setTasks([data, ...tasks]);
      setNewTask("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setAdding(false);
    }
  }

  async function moveTask(taskId: string, newColumnId: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, column_id: newColumnId as Task["column_id"] }
          : t
      )
    );

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ column_id: newColumnId, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      fetchTasks();
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if we're over a column
    const overId = over.id as string;
    const isOverColumn = columns.some((col) => col.id === overId);

    if (isOverColumn && activeTask.column_id !== overId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTask.id
            ? { ...t, column_id: overId as Task["column_id"] }
            : t
        )
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Determine the target column
    let targetColumnId: string | null = null;

    // Check if dropped on a column
    if (columns.some((col) => col.id === over.id)) {
      targetColumnId = over.id as string;
    } else {
      // Dropped on another task - find that task's column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetColumnId = overTask.column_id;
      }
    }

    if (targetColumnId && targetColumnId !== activeTask.column_id) {
      moveTask(activeTask.id, targetColumnId);
    }
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  function handleTaskUpdate(updatedTask: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  const taskCounts = {
    todo: tasks.filter((t) => t.column_id === "todo").length,
    in_progress: tasks.filter((t) => t.column_id === "in_progress").length,
    done: tasks.filter((t) => t.column_id === "done").length,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Drag tasks between columns to update status
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 md:w-64 bg-secondary border-border h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            disabled={adding}
          />
          <Button
            onClick={addTask}
            className="btn-primary-glow h-9 text-sm"
            disabled={adding}
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4 md:mr-2" />
            )}
            <span className="hidden md:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column, colIndex) => {
            const columnTasks = tasks.filter(
              (task) => task.column_id === column.id
            );
            return (
              <Card
                key={column.id}
                className="bg-card border-border card-glow animate-fade-in opacity-0"
                style={{ animationDelay: `${colIndex * 0.1}s` }}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <column.icon className={`w-4 h-4 ${column.color}`} />
                    {column.title}
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs bg-secondary border-border"
                    >
                      {taskCounts[column.id as keyof typeof taskCounts]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto activity-stream">
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                    id={column.id}
                  >
                    {columnTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 && (
                    <div
                      className="empty-state py-8 border-2 border-dashed border-border/50 rounded-lg"
                      data-column={column.id}
                    >
                      <column.icon className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                      <p className="empty-state-text text-xs text-center">
                        Drop tasks here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}
