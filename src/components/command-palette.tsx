"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Phone,
  MessageSquare,
  Brain,
  Settings,
  Plus,
  Search,
  Bot,
  ScrollText,
  Rocket,
  TrendingUp,
} from "lucide-react";

interface CommandPaletteProps {
  onNewTask?: () => void;
  onStartCall?: () => void;
}

const navigationCommands = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    shortcut: "G H",
    keywords: ["home", "mission", "control"],
  },
  {
    href: "/agents",
    icon: Bot,
    label: "Agents",
    shortcut: "G A",
    keywords: ["bot", "ai"],
  },
  {
    href: "/logs",
    icon: ScrollText,
    label: "Activity Logs",
    shortcut: "G L",
    keywords: ["activity", "history"],
  },
  {
    href: "/tasks",
    icon: CheckSquare,
    label: "Tasks",
    shortcut: "G T",
    keywords: ["todo", "list"],
  },
  {
    href: "/projects",
    icon: FolderKanban,
    label: "Projects",
    shortcut: "G P",
    keywords: ["kanban", "board"],
  },
  {
    href: "/investing",
    icon: TrendingUp,
    label: "Investing",
    keywords: ["stocks", "portfolio", "trading"],
  },
  {
    href: "/calls",
    icon: Phone,
    label: "Calls",
    shortcut: "G C",
    keywords: ["phone", "voice"],
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Chat",
    keywords: ["message", "conversation"],
  },
  {
    href: "/memory",
    icon: Brain,
    label: "Memory",
    keywords: ["knowledge", "context"],
  },
  {
    href: "/upgrades",
    icon: Rocket,
    label: "Upgrades",
    keywords: ["roadmap", "features"],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    shortcut: "G S",
    keywords: ["preferences", "config"],
  },
];

export function CommandPalette({ onNewTask, onStartCall }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        // Don't trigger when typing in inputs
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          // Only "/" should be blocked in inputs, ⌘K should still work
          if (e.key === "/") return;
        }
        
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationCommands.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords?.join(" ") || ""}`}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            value="new task create add todo"
            onSelect={() => runCommand(() => onNewTask?.())}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Task</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="make call phone dial voice"
            onSelect={() => runCommand(() => onStartCall?.())}
          >
            <Phone className="mr-2 h-4 w-4" />
            <span>Make Call</span>
          </CommandItem>
          <CommandItem
            value="search find lookup"
            onSelect={() => runCommand(() => {
              // For now, just focus on the search functionality
              // Could be enhanced to open a dedicated search modal
              router.push("/logs");
            })}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
