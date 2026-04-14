import Papa from "papaparse";

export type ParsedCsvTeam = {
  team_name: string;
  team_number?: string;
  team_members?: string;
  project_description?: string;
  github_url?: string;
  demo_video?: string;
  partner_technologies?: string;
  time_submitted?: string;
};

const mapRow = (row: Record<string, string | undefined>): ParsedCsvTeam => ({
  team_name: row["Team Name"]?.trim() || "",
  team_number: row["Team Number"]?.trim(),
  team_members: row["Team Members"]?.trim(),
  project_description: row["Project Description"]?.trim(),
  github_url: row["Public GitHub Repository"]?.trim(),
  demo_video: row["Demo Video"]?.trim(),
  partner_technologies: row["Partner Technologies Used"]?.trim(),
  time_submitted: row["Time Submitted"]?.trim(),
});

export function parseTeamsCsv(file: File): Promise<ParsedCsvTeam[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const firstRow = result.data[0] ?? {};
        const singleKey = Object.keys(firstRow)[0];

        if (singleKey === "PROJECTS TABLE") {
          Papa.parse<string[]>(file, {
            header: false,
            skipEmptyLines: true,
            complete: (fallback) => {
              const rows = fallback.data.slice(1);
              const mapped = rows
                .map((cols) => ({
                  team_name: (cols[0] || "").trim(),
                  team_number: cols[1]?.trim(),
                  team_members: cols[2]?.trim(),
                  project_description: cols[3]?.trim(),
                  github_url: cols[4]?.trim(),
                  demo_video: cols[5]?.trim(),
                  partner_technologies: cols[6]?.trim(),
                  time_submitted: cols[7]?.trim(),
                }))
                .filter((row) => row.team_name && row.team_name !== "Team Name");
              resolve(mapped);
            },
            error: reject,
          });
          return;
        }

        let mapped = result.data.map(mapRow);
        if (mapped[0]?.team_name === "Team Name") {
          mapped = mapped.slice(1);
        }
        resolve(mapped.filter((row) => row.team_name));
      },
      error: reject,
    });
  });
}
