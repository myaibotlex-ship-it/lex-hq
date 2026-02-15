"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface SystemStatusProps {
  className?: string;
}

export function SystemStatus({ className = "" }: SystemStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [systemHealth, setSystemHealth] = useState<"operational" | "degraded" | "down">("operational");

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Update last sync time periodically
    const syncInterval = setInterval(() => {
      setLastSync(new Date());
    }, 30000);

    // Simple health check
    checkHealth();
    const healthInterval = setInterval(checkHealth, 60000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
      clearInterval(healthInterval);
    };
  }, []);

  async function checkHealth() {
    try {
      const res = await fetch("/api/health", { method: "GET" });
      if (res.ok) {
        setSystemHealth("operational");
      } else {
        setSystemHealth("degraded");
      }
    } catch {
      setSystemHealth(isOnline ? "degraded" : "down");
    }
  }

  function formatSyncTime() {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-accent" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className={isOnline ? "text-muted-foreground" : "text-red-400"}>
          {isOnline ? "Connected" : "Offline"}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-3 bg-muted" />

      {/* System Health */}
      <div className="flex items-center gap-1.5">
        {systemHealth === "operational" ? (
          <CheckCircle className="w-3.5 h-3.5 text-accent" />
        ) : systemHealth === "degraded" ? (
          <AlertCircle className="w-3.5 h-3.5 text-primary" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        )}
        <span
          className={
            systemHealth === "operational"
              ? "text-muted-foreground"
              : systemHealth === "degraded"
              ? "text-primary"
              : "text-red-400"
          }
        >
          {systemHealth === "operational"
            ? "All Systems Operational"
            : systemHealth === "degraded"
            ? "Degraded Performance"
            : "System Down"}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-3 bg-muted" />

      {/* Last Sync */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Synced {formatSyncTime()}</span>
      </div>
    </div>
  );
}
