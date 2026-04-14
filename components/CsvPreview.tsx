"use client";

import { ParsedCsvTeam } from "@/lib/csv";

export function CsvPreview({ rows }: { rows: ParsedCsvTeam[] }) {
  if (!rows.length) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
      <p className="mb-2 text-sm text-zinc-300">CSV preview (first 5 rows)</p>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="px-2 py-1">Team Number</th>
              <th className="px-2 py-1">Team Name</th>
              <th className="px-2 py-1">Team Members</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, i) => (
              <tr key={`${row.team_name}-${i}`} className="border-t border-zinc-900">
                <td className="px-2 py-1 font-mono">{row.team_number || "-"}</td>
                <td className="px-2 py-1">{row.team_name}</td>
                <td className="px-2 py-1 text-zinc-400">{row.team_members || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
