"use client";

import { TeamRow } from "@/lib/types";

export function NoShowDrawer({ open, teams, onReturn, onDismiss }: { open: boolean; teams: TeamRow[]; onReturn: (team: TeamRow) => void; onDismiss: (team: TeamRow) => void }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform ${open ? "translate-y-0" : "translate-y-full"}`}>
      <div className="card max-h-[55vh] overflow-auto rounded-t-2xl p-4">
        <h3 className="mb-3 text-lg font-semibold">No Shows</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400"><tr><th>Team #</th><th>Name</th><th>Members</th><th>Project</th><th>GitHub</th><th>Demo</th><th></th></tr></thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-t border-zinc-800 align-top">
                <td className="py-2 font-mono">{t.team_number || "-"}</td>
                <td>{t.team_name}</td><td>{t.team_members}</td><td>{t.project_description}</td>
                <td>{t.github_url ? <a className="text-indigo-400" href={t.github_url} target="_blank">link</a> : "-"}</td>
                <td>{t.demo_video ? <a className="text-indigo-400" href={t.demo_video} target="_blank">link</a> : "-"}</td>
                <td className="space-x-2 py-2">
                  <button onClick={() => onReturn(t)} className="rounded bg-zinc-800 px-2 py-1 text-xs">Return to Queue</button>
                  <button onClick={() => onDismiss(t)} className="rounded bg-green-700 px-2 py-1 text-xs">Dismiss</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
