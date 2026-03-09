import { nanoid } from "nanoid";
import type { WSContext } from "hono/ws";

export interface Participant {
  name: string;
  ws: WSContext;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  password?: string;
  maxParticipants: number;
  ttlMinutes: number;
  createdAt: number;
  participants: Map<WSContext, Participant>;
  timer: ReturnType<typeof setTimeout>;
  warningTimer?: ReturnType<typeof setTimeout>;
}

const rooms = new Map<string, Room>();

const COLORS = [
  "#06b6d4", "#f472b6", "#a78bfa", "#34d399", "#fbbf24",
  "#fb923c", "#f87171", "#38bdf8", "#818cf8", "#4ade80",
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function createRoom(opts: { name?: string; password?: string; max?: number; ttl?: number }): Room {
  const id = nanoid(8);
  const ttlMinutes = opts.ttl ?? 60;
  const room: Room = {
    id,
    name: opts.name || "Chat Room",
    password: opts.password,
    maxParticipants: opts.max ?? 50,
    ttlMinutes,
    createdAt: Date.now(),
    participants: new Map(),
    timer: setTimeout(() => expireRoom(id), ttlMinutes * 60 * 1000),
  };
  // Warning 5 min before expiry
  if (ttlMinutes > 5) {
    room.warningTimer = setTimeout(() => {
      broadcast(room, { type: "system", text: "Room expires in 5 minutes" });
    }, (ttlMinutes - 5) * 60 * 1000);
  }
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function joinRoom(room: Room, ws: WSContext, name: string): boolean {
  if (room.participants.size >= room.maxParticipants) return false;
  const participant: Participant = { name, ws, color: colorFor(name) };
  room.participants.set(ws, participant);
  broadcast(room, { type: "joined", user: name, participants: room.participants.size });
  return true;
}

export function leaveRoom(room: Room, ws: WSContext) {
  const p = room.participants.get(ws);
  if (!p) return;
  room.participants.delete(ws);
  broadcast(room, { type: "left", user: p.name, participants: room.participants.size });
}

export function broadcastMessage(room: Room, ws: WSContext, text: string) {
  const p = room.participants.get(ws);
  if (!p) return;
  broadcast(room, { type: "message", user: p.name, text, ts: Date.now(), color: p.color });
}

export function broadcastTyping(room: Room, ws: WSContext) {
  const p = room.participants.get(ws);
  if (!p) return;
  for (const [client, _] of room.participants) {
    if (client !== ws) {
      try { client.send(JSON.stringify({ type: "typing", user: p.name })); } catch {}
    }
  }
}

function broadcast(room: Room, msg: object) {
  const data = JSON.stringify(msg);
  for (const [ws] of room.participants) {
    try { ws.send(data); } catch {}
  }
}

function expireRoom(id: string) {
  const room = rooms.get(id);
  if (!room) return;
  broadcast(room, { type: "closed", reason: "expired" });
  for (const [ws] of room.participants) {
    try { ws.close(1000, "Room expired"); } catch {}
  }
  rooms.delete(id);
}

export function closeAllRooms() {
  for (const [id, room] of rooms) {
    clearTimeout(room.timer);
    if (room.warningTimer) clearTimeout(room.warningTimer);
    broadcast(room, { type: "closed", reason: "host_disconnected" });
    for (const [ws] of room.participants) {
      try { ws.close(1000, "Server shutting down"); } catch {}
    }
  }
  rooms.clear();
}
