"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreateEventModal } from "@/components/CreateEventModal";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/lib/supabase";
import { EventRow } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<(EventRow & { team_count: number })[]>([]);
  const [open, setOpen] = useState(false);
  const [operator, setOperator] = useState("Unknown");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!hasSupabaseConfig) {
      setErrorMessage(supabaseConfigError);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    const { data: eventsData, error: eventsError } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (eventsError || !eventsData) {
      const detail = eventsError?.message?.includes("Failed to fetch")
        ? "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL, internet access, and that your Supabase project is active."
        : eventsError?.message || "Unknown error";
      setErrorMessage(`Failed to load events: ${detail}`);
      setLoading(false);
      return;
    }

    const { data: teams, error: teamsError } = await supabase.from("teams").select("event_id");
    if (teamsError) {
      setErrorMessage(`Events loaded, but team counts failed: ${teamsError.message}`);
    }

    const counts = (teams || []).reduce<Record<string, number>>((acc, row) => {
      acc[row.event_id] = (acc[row.event_id] || 0) + 1;
      return acc;
    }, {});
    setEvents((eventsData || []).map((e) => ({ ...e, team_count: counts[e.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextOperator = JSON.parse(localStorage.getItem("judge_operator") || "{}")?.name || "Unknown";
      setOperator(nextOperator);
    }, 0);
    const loadId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(loadId);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <nav className="mb-6 flex items-center justify-between">
        <Link href="/events" className="text-xl font-semibold">Judge.run</Link>
        <div className="text-sm text-zinc-400">Operating as: {operator}</div>
      </nav>

      <div className="mb-4 flex justify-end">
        <button onClick={() => setOpen(true)} className="rounded bg-indigo-500 px-3 py-2">+ New Event</button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {errorMessage ? (
          <div className="rounded border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{errorMessage}</div>
        ) : null}
        {!loading && !events.length ? (
          <div className="rounded border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-400">No events yet. Create your first event.</div>
        ) : null}
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}/rooms`} className="card rounded-xl p-4">
            <h3 className="text-lg font-semibold">{event.name}</h3>
            <p className="text-sm text-zinc-400">Created: {new Date(event.created_at).toISOString().replace("T", " ").slice(0, 16)} UTC</p>
            <p className="text-sm">Teams: {event.team_count}</p>
            <p className="text-sm">Rooms: {event.room_count}</p>
          </Link>
        ))}
      </section>

      <CreateEventModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={async ({ name, roomCount, teams }) => {
          if (!hasSupabaseConfig) {
            setErrorMessage(supabaseConfigError);
            return;
          }
          setErrorMessage("");
          const { data: event, error: createError } = await supabase
            .from("events")
            .insert({ name, room_count: roomCount })
            .select("*")
            .single();
          if (createError || !event) {
            setErrorMessage(`Failed to create event: ${createError?.message || "Unknown error"}`);
            return;
          }

          setEvents((prev) => [{ ...event, team_count: teams.length }, ...prev]);

          const payload = teams.map((team, index) => {
            const room = (index % roomCount) + 1;
            const queue = Math.floor(index / roomCount);
            return {
              event_id: event.id,
              room_id: room,
              status: "queue",
              queue_position: queue,
              original_room_id: room,
              ...team,
            };
          });

          if (payload.length) {
            const { error: teamInsertError } = await supabase.from("teams").insert(payload);
            if (teamInsertError) {
              setErrorMessage(`Event created, but team import failed: ${teamInsertError.message}`);
            }
          }

          const { error: timerInsertError } = await supabase.from("room_timers").insert(
            Array.from({ length: roomCount }).map((_, i) => ({
              event_id: event.id,
              room_number: i + 1,
              duration_seconds: 300,
              is_running: false,
            })),
          );
          if (timerInsertError) {
            setErrorMessage(`Event created, but timer setup failed: ${timerInsertError.message}`);
          }

          await load();
        }}
      />
    </main>
  );
}
