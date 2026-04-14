"use client";

import { useState } from "react";
import { parseTeamsCsv, ParsedCsvTeam } from "@/lib/csv";
import { CsvPreview } from "@/components/CsvPreview";

export function CreateEventModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (payload: { name: string; roomCount: number; teams: ParsedCsvTeam[] }) => Promise<void>; }) {
  const [name, setName] = useState("");
  const [roomCount, setRoomCount] = useState(4);
  const [teams, setTeams] = useState<ParsedCsvTeam[]>([]);

  const reset = () => {
    setName("");
    setRoomCount(4);
    setTeams([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="card w-full max-w-2xl rounded-xl p-4">
        <h3 className="mb-3 text-xl font-semibold">Create Event</h3>
        <div className="space-y-3">
          <input className="w-full rounded bg-zinc-900 px-3 py-2" placeholder="Event Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" min={1} max={10} className="w-full rounded bg-zinc-900 px-3 py-2" value={roomCount} onChange={(e) => setRoomCount(Number(e.target.value))} />
          <input type="file" accept=".csv" className="w-full text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const parsed = await parseTeamsCsv(f); setTeams(parsed); }} />
          <CsvPreview rows={teams} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { reset(); onClose(); }} className="rounded bg-zinc-800 px-3 py-1">Cancel</button>
          <button
            onClick={async () => {
              if (!name.trim() || !teams.length) return;
              await onCreate({ name: name.trim(), roomCount, teams });
              reset();
              onClose();
            }}
            className="rounded bg-indigo-500 px-3 py-1"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
