"use client";

import { useState } from "react";
import { X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StartCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StartCallModal({ isOpen, onClose, onSuccess }: StartCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_number: phoneNumber,
          to_name: name || null,
          purpose: purpose || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start call");
      }

      setSuccess(true);
      setTimeout(() => {
        setPhoneNumber("");
        setName("");
        setPurpose("");
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Start Call</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-400">Call Initiated!</h3>
            <p className="text-zinc-500 text-sm mt-1">Lex is dialing now...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Phone Number *</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-lg"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Contact Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who are we calling?"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Purpose</label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What should Lex discuss?"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 min-h-[80px]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-zinc-700 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || phoneNumber.replace(/\D/g, "").length < 10}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
              >
                {loading ? "Dialing..." : "Start Call"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
