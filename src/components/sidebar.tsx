"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  MessageSquare,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Phone,
  Brain,
  Settings,
  Menu,
  X,
  Bot,
  ScrollText,
  LogOut,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Mission Control" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/logs", icon: ScrollText, label: "Activity Logs" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/calls", icon: Phone, label: "Calls" },
  { href: "/memory", icon: Brain, label: "Memory" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:static w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="/logo.svg"
                alt="The Bridge"
                width={36}
                height={36}
                className="w-9 h-9"
              />
              <span className="absolute -bottom-0.5 -right-0.5 status-dot status-dot-active" />
            </div>
            <div>
              <h1 className="font-bold text-sm">The Bridge</h1>
              <p className="text-xs text-zinc-600 font-terminal">Command Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-zinc-800 text-white border-l-2 border-amber-500 ml-0 pl-[10px]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4",
                  isActive ? "text-amber-500" : ""
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 space-y-1">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
          
          {/* Systems Status Bar */}
          <div className="mt-3 p-2 bg-zinc-800/50 rounded-lg border border-zinc-800 systems-bar">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <span className="status-dot status-dot-active" />
                    <span className="text-emerald-400 font-medium">Systems Online</span>
                  </>
                ) : (
                  <>
                    <span className="status-dot status-dot-error" />
                    <span className="text-red-400 font-medium">Offline</span>
                  </>
                )}
              </div>
              <span className="text-zinc-500 font-terminal">{currentTime}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
