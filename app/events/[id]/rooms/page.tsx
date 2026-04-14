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
  const [viewMode, setViewMode] = useState<"all" | "in_room" | "stage" | "hallway" | "queue" | "judged">("all");
  const [roomCountDraft, setRoomCountDraft] = useState(0);

  const [operator, setOperator] = useState("Unknown");

  const load = useCallback(async () => {
    const [{ data: eventData }, { data: teamData }, { data: timerData }] = await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).single(),
      supabase.from("teams").select("*").eq("event_id", eventId),
      supabase.from("room_timers").select("*").eq("event_id", eventId).order("room_number"),
    ]);
    setEvent(eventData);
    setRoomCountDraft(eventData?.room_count || 0);
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

  const updateRoomCount = async () => {
    if (!event || roomCountDraft < 1 || roomCountDraft > 10 || roomCountDraft === roomCount) return;

    await supabase.from("events").update({ room_count: roomCountDraft }).eq("id", event.id);

    if (roomCountDraft > roomCount) {
      const newTimers = Array.from({ length: roomCountDraft - roomCount }).map((_, i) => ({
        event_id: event.id,
        room_number: roomCount + i + 1,
        duration_seconds: 300,
        is_running: false,
      }));
      if (newTimers.length) await supabase.from("room_timers").insert(newTimers);
    } else {
      const roomsToRemove = Array.from({ length: roomCount - roomCountDraft }).map((_, i) => roomCountDraft + i + 1);
      if (roomsToRemove.length) {
        const overflowTeams = teams
          .filter((t) => (t.room_id || 0) > roomCountDraft && t.status !== "no_show")
          .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));

        if (overflowTeams.length) {
          const queueByRoom = Array.from({ length: roomCountDraft }).map((_, idx) =>
            teams.filter((t) => t.room_id === idx + 1 && t.status === "queue").length,
          );

          const updates = overflowTeams.map((team, idx) => {
            const targetRoom = (idx % roomCountDraft) + 1;
            const nextPos = queueByRoom[targetRoom - 1];
            queueByRoom[targetRoom - 1] += 1;
            return {
              id: team.id,
              room_id: targetRoom,
              status: "queue",
              queue_position: nextPos,
            };
          });
          await supabase.from("teams").upsert(updates);
        }

        await supabase.from("room_timers").delete().eq("event_id", event.id).in("room_number", roomsToRemove);
      }
    }

    await load();
  };

  return (
    <main className="mx-auto max-w-7xl p-4">
      <nav className="mb-6 flex items-center justify-between gap-3">
        <Link href="/events" className="text-xl font-semibold">Judge.run</Link>
        <div className="text-lg">{event?.name || "Event"}</div>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as typeof viewMode)} className="rounded bg-zinc-900 px-2 py-1">
            <option value="all">View Rooms</option>
            <option value="in_room">View Room</option>
            <option value="stage">View Stage</option>
            <option value="hallway">View Hall</option>
            <option value="queue">View Queue</option>
            <option value="judged">View Judged</option>
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={10}
              value={roomCountDraft || ""}
              onChange={(e) => setRoomCountDraft(Number(e.target.value))}
              className="w-16 rounded bg-zinc-900 px-2 py-1"
            />
            <button onClick={() => void updateRoomCount()} className="rounded bg-zinc-800 px-2 py-1">Update Rooms</button>
          </div>
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
              viewMode={viewMode}
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
