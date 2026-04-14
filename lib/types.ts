export type TeamStatus = "queue" | "stage" | "hallway" | "in_room" | "finished" | "no_show";

export type EventRow = {
  id: string;
  name: string;
  room_count: number;
  created_at: string;
};

export type TeamRow = {
  id: string;
  event_id: string;
  team_name: string | null;
  team_number: string | null;
  team_members: string | null;
  project_description: string | null;
  github_url: string | null;
  demo_video: string | null;
  partner_technologies: string | null;
  time_submitted: string | null;
  room_id: number | null;
  status: TeamStatus;
  queue_position: number | null;
  original_room_id: number | null;
};

export type RoomTimerRow = {
  id: string;
  event_id: string;
  room_number: number;
  duration_seconds: number;
  started_at: string | null;
  is_running: boolean;
};
