"use client";

import { useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { StartCallModal } from "@/components/modals/start-call-modal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [showStartCall, setShowStartCall] = useState(false);

  // Register keyboard shortcuts (n for new task, etc.)
  useKeyboardShortcuts({
    onNewTask: () => setShowNewTask(true),
    onStartCall: () => setShowStartCall(true),
    // onSearch is handled by CommandPalette directly
  });

  return (
    <>
      {children}
      
      {/* Command Palette - triggered by ⌘K */}
      <CommandPalette
        onNewTask={() => setShowNewTask(true)}
        onStartCall={() => setShowStartCall(true)}
      />

      {/* Modals */}
      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
      />
      <StartCallModal
        isOpen={showStartCall}
        onClose={() => setShowStartCall(false)}
      />
    </>
  );
}
