"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AddTeamModal } from "@/components/AddTeamModal";
import { NoShowDrawer } from "@/components/NoShowDrawer";
import { RoomCard } from "@/components/RoomCard";
import { supabase } from "@/lib/supabase";
import { EventRow, RoomTimerRow, TeamRow, TeamStatus } from "@/lib/types";

export default function RoomsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const [event, setEvent] = useState<EventRow | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [timers, setTimers] = useState<RoomTimerRow[]>([]);
  const [now, setNow] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [operator, setOperator] = useState("Unknown");

  const load = useCallback(async () => {
    const [{ data: eventData }, { data: teamData }, { data: timerData }] = await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).single(),
      supabase.from("teams").select("*").eq("event_id", eventId),
      supabase.from("room_timers").select("*").eq("event_id", eventId).order("room_number"),
    ]);
    setEvent(eventData);
    setTeams((teamData as TeamRow[]) || []);
    setTimers((timerData as RoomTimerRow[]) || []);
  }, [eventId]);

  useEffect(() => {
    const operatorTimeout = window.setTimeout(() => {
      const nextOperator = JSON.parse(localStorage.getItem("judge_operator") || "{}")?.name || "Unknown";
      setOperator(nextOperator);
    }, 0);
    const loadTimeout = window.setTimeout(() => {
      void load();
    }, 0);
    const ticker = setInterval(() => setNow(Date.now()), 1000);

    const ch = supabase
      .channel(`event-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams", filter: `event_id=eq.${eventId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_timers", filter: `event_id=eq.${eventId}` }, () => void load())
      .subscribe();

    return () => {
      window.clearTimeout(operatorTimeout);
      window.clearTimeout(loadTimeout);
      clearInterval(ticker);
      supabase.removeChannel(ch);
    };
  }, [eventId, load]);

  const noShows = teams.filter((t) => t.status === "no_show");

  const updateStatus = async (teamId: string, status: TeamStatus) => {
    await supabase.from("teams").update({ status }).eq("id", teamId);
  };

  const roomCount = event?.room_count || 0;

  return (
    <main className="mx-auto max-w-7xl p-4">
      <nav className="mb-6 flex items-center justify-between gap-3">
        <Link href="/events" className="text-xl font-semibold">Judge.run</Link>
        <div className="text-lg">{event?.name || "Event"}</div>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span>Operating as: {operator}</span>
          <button onClick={() => setDrawerOpen((v) => !v)} className="rounded bg-zinc-800 px-2 py-1">No Shows ({noShows.length})</button>
          <button onClick={() => setModalOpen(true)} className="rounded bg-indigo-500 px-2 py-1">+ Add Team</button>
          <Link href="/events" className="text-zinc-400">← Events</Link>
        </div>
      </nav>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: roomCount }).map((_, idx) => {
          const roomNumber = idx + 1;
          const roomTeams = teams.filter((t) => t.room_id === roomNumber && t.status !== "no_show");
          const timer = timers.find((t) => t.room_number === roomNumber);
          if (!timer) return null;

          return (
            <RoomCard
              key={roomNumber}
              roomNumber={roomNumber}
              roomCount={roomCount}
              teams={roomTeams}
              timer={timer}
              now={now}
              onUpdateStatus={(teamId, status) => void updateStatus(teamId, status)}
              onMoveRoom={async (team, room) => {
                if (room === team.room_id) return;
                const max = teams.filter((t) => t.room_id === room && t.status === "queue").reduce((m, t) => Math.max(m, t.queue_position ?? 0), -1);
                await supabase.from("teams").update({ room_id: room, status: "queue", queue_position: max + 1 }).eq("id", team.id);
              }}
              onNoShow={(team) => void supabase.from("teams").update({ status: "no_show", original_room_id: team.original_room_id || team.room_id }).eq("id", team.id)}
              onReorderQueue={async (ids) => {
                const payload = ids.map((id, i) => ({ id, queue_position: i }));
                await supabase.from("teams").upsert(payload);
              }}
              onAddTeam={async (payload) => {
                const max = teams.filter((t) => t.room_id === roomNumber && t.status === "queue").reduce((m, t) => Math.max(m, t.queue_position ?? 0), -1);
                await supabase.from("teams").insert({ ...payload, event_id: eventId, room_id: roomNumber, status: "queue", queue_position: max + 1, original_room_id: roomNumber });
              }}
              onTimer={{
                start: async () => { await supabase.from("room_timers").update({ started_at: new Date().toISOString(), is_running: true }).eq("id", timer.id); },
                pause: async (remaining) => { await supabase.from("room_timers").update({ duration_seconds: remaining, is_running: false, started_at: null }).eq("id", timer.id); },
                reset: async () => { await supabase.from("room_timers").update({ duration_seconds: 300, is_running: false, started_at: null }).eq("id", timer.id); },
                setDuration: async (seconds) => { await supabase.from("room_timers").update({ duration_seconds: seconds, is_running: false, started_at: null }).eq("id", timer.id); },
              }}
            />
          );
        })}
      </section>

      <NoShowDrawer
        open={drawerOpen}
        teams={noShows}
        onReturn={async (team) => {
          const room = team.original_room_id || 1;
          const max = teams.filter((t) => t.room_id === room && t.status === "queue").reduce((m, t) => Math.max(m, t.queue_position ?? 0), -1);
          await supabase.from("teams").update({ status: "queue", room_id: room, queue_position: max + 1 }).eq("id", team.id);
        }}
        onDismiss={(team) => void supabase.from("teams").update({ status: "finished" }).eq("id", team.id)}
      />

      <AddTeamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        roomCount={roomCount}
        onSubmit={async (payload) => {
          const room = Number(payload.room_id);
          const max = teams.filter((t) => t.room_id === room && t.status === "queue").reduce((m, t) => Math.max(m, t.queue_position ?? 0), -1);
          await supabase.from("teams").insert({ ...payload, event_id: eventId, room_id: room, status: "queue", queue_position: max + 1, original_room_id: room });
        }}
      />
    </main>
  );
}
