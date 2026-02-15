"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Moon,
  Key,
  Info,
  Github,
  Bot,
  Keyboard,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Load saved theme preference
    const saved = localStorage.getItem("bridge-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage({ type: "error", text: "Password must be at least 4 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleThemeChange(newTheme: "dark" | "light") {
    setTheme(newTheme);
    localStorage.setItem("bridge-theme", newTheme);
    // Theme switching could be implemented here
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings className="w-7 h-7 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure The Bridge</p>
      </div>

      <div className="space-y-4">
        {/* Security */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Key className="w-4 h-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your access credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-accent/10 border border-accent/20 text-accent"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword}
                className="bg-secondary hover:bg-muted border border-border"
              >
                {passwordLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Moon className="w-4 h-4 text-purple-500" />
              Appearance
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize how The Bridge looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === "dark"
                    ? "bg-secondary border-border text-white"
                    : "bg-secondary border-border text-muted-foreground hover:border-border"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
                {theme === "dark" && <Check className="w-4 h-4 text-accent" />}
              </button>
              <button
                onClick={() => handleThemeChange("light")}
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-secondary/40 border-border text-muted-foreground cursor-not-allowed"
                title="Coming soon"
              >
                ☀️ Light
                <span className="text-xs">(soon)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Keyboard className="w-4 h-4 text-blue-500" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Navigate faster with keyboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>
                <ShortcutRow keys={["n"]} description="New task" />
                <ShortcutRow keys={["/"]} description="Focus search" />
                <ShortcutRow keys={["⌘", "k"]} description="Command palette" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</h4>
                <ShortcutRow keys={["g", "h"]} description="Go to home" />
                <ShortcutRow keys={["g", "a"]} description="Go to agents" />
                <ShortcutRow keys={["g", "l"]} description="Go to logs" />
                <ShortcutRow keys={["g", "t"]} description="Go to tasks" />
                <ShortcutRow keys={["g", "s"]} description="Go to settings" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Info className="w-4 h-4 text-cyan-500" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Bot className="w-12 h-12 text-accent" />
                <div>
                  <h3 className="font-semibold">The Bridge</h3>
                  <p className="text-sm text-muted-foreground">Command Center for Lex & Agents</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version</span>
                  <p className="font-mono">1.0.0</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Built with</span>
                  <p>Next.js, Supabase, Tailwind</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <a
                  href="https://github.com/myaibotlex-ship-it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="px-2 py-1 bg-secondary border border-border rounded text-xs font-mono">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
