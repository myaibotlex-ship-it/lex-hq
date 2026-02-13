"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcuts {
  onNewTask?: () => void;
  onStartCall?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Clear pending timeout
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }

      // Handle 'g' prefix commands
      if (pendingKey.current === "g") {
        pendingKey.current = null;
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            router.push("/agents");
            break;
          case "l":
            e.preventDefault();
            router.push("/logs");
            break;
          case "t":
            e.preventDefault();
            router.push("/tasks");
            break;
          case "p":
            e.preventDefault();
            router.push("/projects");
            break;
          case "c":
            e.preventDefault();
            router.push("/calls");
            break;
          case "h":
            e.preventDefault();
            router.push("/");
            break;
          case "s":
            e.preventDefault();
            router.push("/settings");
            break;
        }
        return;
      }

      // Single key shortcuts
      switch (e.key.toLowerCase()) {
        case "n":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            shortcuts.onNewTask?.();
          }
          break;
        case "k":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            shortcuts.onSearch?.();
          }
          break;
        case "/":
          e.preventDefault();
          shortcuts.onSearch?.();
          break;
        case "g":
          // Start 'g' prefix mode
          pendingKey.current = "g";
          pendingTimeout.current = setTimeout(() => {
            pendingKey.current = null;
          }, 500);
          break;
        case "escape":
          // Can be used to close modals
          break;
      }
    },
    [router, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, [handleKeyDown]);
}

// Toast for showing shortcut hints
export function showShortcutToast(message: string) {
  // Simple implementation - could be enhanced with a proper toast library
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 z-50 animate-fade-in";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
