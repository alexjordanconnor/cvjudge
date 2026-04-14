"use client";

import { useState } from "react";

export function AddTeamModal({ roomCount, open, onClose, onSubmit }: {
  roomCount: number;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, string>) => Promise<void>;
}) {
  const [form, setForm] = useState({ team_name: "", team_number: "", team_members: "", project_description: "", github_url: "", demo_video: "", room_id: "1" });
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="card w-full max-w-lg rounded-xl p-4">
        <h3 className="mb-3 text-lg font-semibold">Add Team</h3>
        <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!form.team_name.trim()) return; await onSubmit(form); onClose(); }}>
          {Object.entries(form).map(([k, v]) => k !== "room_id" ? (
            <input key={k} value={v} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className="w-full rounded bg-zinc-900 px-2 py-1" placeholder={k.replaceAll("_", " ")} required={k === "team_name"} />
          ) : (
            <select key={k} value={v} onChange={(e) => setForm((p) => ({ ...p, room_id: e.target.value }))} className="w-full rounded bg-zinc-900 px-2 py-1">
              {Array.from({ length: roomCount }).map((_, idx) => <option key={idx} value={idx + 1}>Room {idx + 1}</option>)}
            </select>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded bg-zinc-800 px-3 py-1">Cancel</button>
            <button className="rounded bg-indigo-500 px-3 py-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
