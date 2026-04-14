"use client";

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AddTeamInlineForm } from "@/components/AddTeamInlineForm";
import { TeamRow } from "@/components/TeamRow";
import { Timer } from "@/components/Timer";
import { RoomTimerRow, TeamRow as Team, TeamStatus } from "@/lib/types";

export function RoomCard({ roomNumber, roomCount, teams, timer, now, onUpdateStatus, onMoveRoom, onNoShow, onReorderQueue, onAddTeam, onTimer }: {
  roomNumber: number;
  roomCount: number;
  teams: Team[];
  timer: RoomTimerRow;
  now: number;
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
      <Timer timer={timer} now={now} onStart={onTimer.start} onPause={onTimer.pause} onReset={onTimer.reset} onSetDuration={onTimer.setDuration} />

      {inRoom ? <section className="mt-3 space-y-2"><h4 className="text-sm text-blue-400">In Room</h4>{renderRows([inRoom])}</section> : null}
      {hallway.length ? <section className="mt-3 space-y-2"><h4 className="text-sm text-amber-400">Hallway</h4>{renderRows(hallway)}</section> : null}
      {stage.length ? <section className="mt-3 space-y-2"><h4 className="text-sm text-purple-400">Stage</h4>{renderRows(stage)}</section> : null}

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
    </article>
  );
}
