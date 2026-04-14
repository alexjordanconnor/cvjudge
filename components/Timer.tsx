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

  const color = useMemo(() => {
    if (remaining <= 0) return "text-red-500";
    if (remaining <= 60) return "text-amber-500";
    return "text-white";
  }, [remaining]);

  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-md border border-zinc-800 bg-black/30 p-3">
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
          className="w-28 rounded bg-zinc-900 px-2 py-1"
          placeholder="MM:SS"
        />
      ) : (
        <button onClick={() => { setInput(formatted); setEditing(true); }} className={`text-2xl font-semibold ${color}`}>
          {formatted}
        </button>
      )}
      <div className="mt-2 flex gap-2">
        {timer.is_running ? (
          <button onClick={() => onPause(remaining)} className="rounded bg-zinc-800 px-2 py-1 text-sm"><Pause className="inline h-4 w-4" /> Pause</button>
        ) : (
          <button onClick={onStart} className="rounded bg-indigo-500 px-2 py-1 text-sm text-white"><Play className="inline h-4 w-4" /> Start</button>
        )}
        <button onClick={onReset} className="rounded bg-zinc-800 px-2 py-1 text-sm"><RotateCcw className="inline h-4 w-4" /> Reset</button>
      </div>
    </div>
  );
}
