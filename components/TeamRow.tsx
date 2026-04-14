"use client";

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TeamRow as Team, TeamStatus } from "@/lib/types";

const flow: Record<TeamStatus, { next?: TeamStatus; label?: string; badge: string }> = {
  queue: { next: "stage", label: "Call to Stage", badge: "bg-zinc-500/20 text-zinc-300" },
  stage: { next: "hallway", label: "Send to Hallway", badge: "bg-purple-500/20 text-purple-300" },
  hallway: { next: "in_room", label: "Bring In", badge: "bg-amber-500/20 text-amber-300" },
  in_room: { next: "finished", label: "Mark Finished", badge: "bg-blue-500/20 text-blue-300" },
  finished: { badge: "bg-green-600/20 text-green-300" },
  no_show: { badge: "bg-red-600/20 text-red-300" },
};

export function TeamRow({
  team,
  roomCount,
  onStatus,
  onMoveRoom,
  onNoShow,
  showDrag,
  sortableId,
}: {
  team: Team;
  roomCount: number;
  onStatus: (status: TeamStatus) => void;
  onMoveRoom: (room: number) => void;
  onNoShow: () => void;
  showDrag?: boolean;
  sortableId?: string;
}) {
  const cfg = flow[team.status];
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sortableId || team.id,
    disabled: !showDrag,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group rounded border border-zinc-800 bg-black/20 p-2 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-mono text-zinc-400">#{team.team_number || "-"}</span> - {team.team_name || "Untitled"}
        </div>
        {showDrag ? (
          <button {...attributes} {...listeners} className="opacity-0 transition group-hover:opacity-100">
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs transition-all ${cfg.badge}`}>{team.status}</span>
        {cfg.next && cfg.label ? <button onClick={() => onStatus(cfg.next!)} className="rounded bg-indigo-500 px-2 py-0.5 text-xs">{cfg.label}</button> : null}
        <select value={team.status} onChange={(e) => onStatus(e.target.value as TeamStatus)} className="rounded bg-zinc-900 px-1 py-0.5 text-xs">
          {["queue", "stage", "hallway", "in_room", "finished", "no_show"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select onChange={(e) => onMoveRoom(Number(e.target.value))} className="rounded bg-zinc-900 px-1 py-0.5 text-xs" defaultValue="">
          <option value="" disabled>Move to Room</option>
          {Array.from({ length: roomCount }).map((_, i) => <option key={i + 1} value={i + 1}>Room {i + 1}</option>)}
        </select>
        <button onClick={onNoShow} className="rounded bg-red-600 px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100">No Show</button>
      </div>
    </div>
  );
}
