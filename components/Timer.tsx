"use client";

import { useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { RoomTimerRow } from "@/lib/types";

const parseInputSeconds = (value: string) => {
  const v = value.trim();
  if (!v) return null;
  if (v.includes(":")) {
    const [m, s] = v.split(":").map((n) => Number.parseInt(n, 10));
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }
  const raw = Number.parseInt(v, 10);
  return Number.isNaN(raw) ? null : raw;
};

export function Timer({
  timer,
  now,
  onStart,
  onPause,
  onReset,
  onSetDuration,
}: {
  timer: RoomTimerRow;
  now: number;
  onStart: () => Promise<void>;
  onPause: (remaining: number) => Promise<void>;
  onReset: () => Promise<void>;
  onSetDuration: (seconds: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const elapsed = timer.is_running && timer.started_at ? Math.floor((now - new Date(timer.started_at).getTime()) / 1000) : 0;
  const remaining = Math.max(0, timer.duration_seconds - elapsed);
  const ratioLeft = Math.max(0, Math.min(1, remaining / Math.max(timer.duration_seconds, 1)));

  const color = useMemo(() => {
    if (remaining <= 0) return "text-red-500";
    if (remaining <= 60) return "text-amber-500";
    return "text-white";
  }, [remaining]);

  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const background = remaining <= 0 ? "rgba(220, 38, 38, 0.28)" : remaining <= 60 ? "rgba(245, 158, 11, 0.20)" : "rgba(99, 102, 241, 0.14)";

  return (
    <div className="relative overflow-hidden rounded-md border border-zinc-800 bg-black/30 p-3">
      <div className="pointer-events-none absolute inset-0 transition-all duration-500" style={{ background }} />
      <div className="pointer-events-none absolute bottom-0 left-0 h-1 bg-indigo-500/70 transition-all duration-500" style={{ width: `${ratioLeft * 100}%` }} />
      <div className="relative flex flex-col items-center justify-center">
        <div className="mb-2 flex items-center gap-2">
          <button onClick={() => onSetDuration(Math.max(0, remaining - 60))} className="rounded bg-zinc-800 px-2 py-1 text-xs">-1 min</button>
          {editing ? (
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={async () => {
                const parsed = parseInputSeconds(input);
                if (parsed !== null) await onSetDuration(parsed);
                setEditing(false);
              }}
              className="w-28 rounded bg-zinc-900 px-2 py-1 text-center"
              placeholder="MM:SS"
            />
          ) : (
            <button onClick={() => { setInput(formatted); setEditing(true); }} className={`text-3xl font-semibold ${color}`}>
              {formatted}
            </button>
          )}
          <button onClick={() => onSetDuration(remaining + 60)} className="rounded bg-zinc-800 px-2 py-1 text-xs">+1 min</button>
        </div>
        <div className="mt-1 flex gap-2">
          {timer.is_running ? (
            <button onClick={() => onPause(remaining)} className="rounded bg-zinc-800 px-2 py-1 text-sm"><Pause className="inline h-4 w-4" /> Pause</button>
          ) : (
            <button onClick={onStart} className="rounded bg-indigo-500 px-2 py-1 text-sm text-white"><Play className="inline h-4 w-4" /> Start</button>
          )}
          <button onClick={onReset} className="rounded bg-zinc-800 px-2 py-1 text-sm"><RotateCcw className="inline h-4 w-4" /> Reset</button>
        </div>
      </div>
    </div>
  );
}
