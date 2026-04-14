"use client";

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AddTeamInlineForm } from "@/components/AddTeamInlineForm";
import { TeamRow } from "@/components/TeamRow";
import { Timer } from "@/components/Timer";
import { RoomTimerRow, TeamRow as Team, TeamStatus } from "@/lib/types";

type RoomViewMode = "all" | "in_room" | "stage" | "hallway" | "queue" | "judged";

export function RoomCard({ roomNumber, roomCount, teams, timer, now, viewMode, onUpdateStatus, onMoveRoom, onNoShow, onReorderQueue, onAddTeam, onTimer }: {
  roomNumber: number;
  roomCount: number;
  teams: Team[];
  timer: RoomTimerRow;
  now: number;
  viewMode: RoomViewMode;
  onUpdateStatus: (teamId: string, status: TeamStatus) => void;
  onMoveRoom: (team: Team, room: number) => void;
  onNoShow: (team: Team) => void;
  onReorderQueue: (ids: string[]) => void;
  onAddTeam: (payload: Record<string, string>) => Promise<void>;
  onTimer: {
    start: () => Promise<void>;
    pause: (remaining: number) => Promise<void>;
    reset: () => Promise<void>;
    setDuration: (seconds: number) => Promise<void>;
  };
}) {
  const inRoom = teams.find((t) => t.status === "in_room");
  const hallway = teams.filter((t) => t.status === "hallway");
  const stage = teams.filter((t) => t.status === "stage");
  const queue = teams.filter((t) => t.status === "queue").sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
  const judged = teams.filter((t) => t.status === "finished");
  const nonJudgedCount = teams.filter((t) => t.status !== "finished").length;

  const elapsed = timer.is_running && timer.started_at ? Math.floor((now - new Date(timer.started_at).getTime()) / 1000) : 0;
  const secondsLeftCurrent = Math.max(0, timer.duration_seconds - elapsed);
  const baseMinutes = nonJudgedCount * 5;
  const withChangeoverMinutes = nonJudgedCount * 6;
  const finishBase = new Date(now + (secondsLeftCurrent + Math.max(0, nonJudgedCount - 1) * 5 * 60) * 1000);
  const finishWithChangeover = new Date(now + (secondsLeftCurrent + Math.max(0, nonJudgedCount - 1) * 6 * 60) * 1000);

  const formatClock = (d: Date) => d.toTimeString().slice(0, 5);

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = queue.findIndex((q) => q.id === active.id);
    const newIndex = queue.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(queue, oldIndex, newIndex);
    onReorderQueue(reordered.map((t) => t.id));
  };

  const renderRows = (rows: Team[]) => rows.map((team) => (
    <TeamRow
      key={team.id}
      team={team}
      roomCount={roomCount}
      onStatus={(status) => onUpdateStatus(team.id, status)}
      onMoveRoom={(room) => onMoveRoom(team, room)}
      onNoShow={() => onNoShow(team)}
    />
  ));

  return (
    <article className="card rounded-xl p-4">
      <h2 className="mb-3 text-lg font-semibold">Room {roomNumber}</h2>
      <div className="mb-3 grid gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-300 sm:grid-cols-2">
        <div>
          <p className="text-zinc-400">Predicted time left</p>
          <p className="font-semibold text-zinc-100">{baseMinutes} min</p>
          <p className="text-zinc-500">Finish: {formatClock(finishBase)}</p>
        </div>
        <div>
          <p className="text-zinc-400">Predicted + changeover</p>
          <p className="font-semibold text-zinc-100">{withChangeoverMinutes} min</p>
          <p className="text-zinc-500">Finish: {formatClock(finishWithChangeover)}</p>
        </div>
      </div>
      <div className="space-y-3 rounded-md border border-zinc-800 bg-black/30 p-3">
        <Timer timer={timer} now={now} onStart={onTimer.start} onPause={onTimer.pause} onReset={onTimer.reset} onSetDuration={onTimer.setDuration} />
        {(viewMode === "all" || viewMode === "in_room") && inRoom ? (
          <section className="space-y-2">
            <h4 className="text-sm text-blue-400">In Room</h4>
            {renderRows([inRoom])}
          </section>
        ) : null}
      </div>

      {(viewMode === "all" || viewMode === "hallway") && hallway.length ? <section className="mt-3 space-y-2"><h4 className="text-sm text-amber-400">Hallway</h4>{renderRows(hallway)}</section> : null}
      {(viewMode === "all" || viewMode === "stage") && stage.length ? <section className="mt-3 space-y-2"><h4 className="text-sm text-purple-400">Stage</h4>{renderRows(stage)}</section> : null}

      {(viewMode === "all" || viewMode === "queue") ? (
        <section className="mt-3 space-y-2">
          <h4 className="text-sm text-zinc-400">Queue</h4>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={queue.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              {queue.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  roomCount={roomCount}
                  onStatus={(status) => onUpdateStatus(team.id, status)}
                  onMoveRoom={(room) => onMoveRoom(team, room)}
                  onNoShow={() => onNoShow(team)}
                  showDrag
                />
              ))}
            </SortableContext>
          </DndContext>
          <AddTeamInlineForm onSubmit={onAddTeam} />
        </section>
      ) : null}

      {(viewMode === "all" || viewMode === "judged") && judged.length ? (
        <section className="mt-3 space-y-2">
          <h4 className="text-sm text-green-500">Judged</h4>
          {renderRows(judged)}
        </section>
      ) : null}
    </article>
  );
}
