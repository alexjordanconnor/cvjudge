"use client";

import { useState } from "react";

type TeamInput = {
  team_name: string;
  team_number: string;
  team_members: string;
  project_description: string;
  github_url: string;
  demo_video: string;
};

const empty: TeamInput = {
  team_name: "",
  team_number: "",
  team_members: "",
  project_description: "",
  github_url: "",
  demo_video: "",
};

export function AddTeamInlineForm({ onSubmit }: { onSubmit: (data: TeamInput) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TeamInput>(empty);

  return (
    <div>
      <button className="mt-2 text-sm text-indigo-400" onClick={() => setOpen((v) => !v)}>+ Add Team</button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <form
            className="space-y-2 rounded border border-zinc-800 p-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!form.team_name.trim()) return;
              await onSubmit(form);
              setForm(empty);
              setOpen(false);
            }}
          >
            {Object.keys(form).map((k) => (
              <input
                key={k}
                value={form[k as keyof TeamInput]}
                onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))}
                className="w-full rounded bg-zinc-900 px-2 py-1 text-sm"
                placeholder={k.replaceAll("_", " ")}
                required={k === "team_name"}
              />
            ))}
            <button className="rounded bg-indigo-500 px-2 py-1 text-sm">Add</button>
          </form>
        </div>
      </div>
    </div>
  );
}
