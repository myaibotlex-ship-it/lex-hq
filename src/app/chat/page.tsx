"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Zap, User, Terminal } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey Dan! What can I help you with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Connect to Clawdbot gateway
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I received your message! This chat will be connected to the Clawdbot gateway soon. For now, use Telegram to talk to me. 🙂",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 status-dot status-dot-active" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Chat with Lex</h1>
            <p className="text-muted-foreground text-xs">Your AI assistant is ready to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in opacity-0 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-primary to-accent"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <Zap className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[85%] ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-xl text-sm ${
                    message.role === "assistant"
                      ? "bg-secondary/80 text-left border border-border/50"
                      : "bg-primary text-left"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-terminal">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-secondary/80 p-3 rounded-xl border border-border/50">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-border">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Lex..."
              className="w-full bg-secondary border-border resize-none min-h-[44px] max-h-[200px] pr-12 text-sm"
              rows={1}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="btn-primary-glow h-8 w-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center font-terminal">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
