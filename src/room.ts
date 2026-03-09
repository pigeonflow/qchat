import { nanoid } from "nanoid";
import type { WSContext } from "hono/ws";

export interface Member {
  name: string;
  deviceId: string;
  color: string;
  ws: WSContext | null;  // null = offline
  joinedAt: number;
}

export interface StoredMessage {
  type: "message" | "system";
  user?: string;
  text: string;
  ts: number;
  color?: string;
}

export interface Room {
  id: string;
  name: string;
  password?: string;
  maxParticipants: number;
  ttlMinutes: number;  // 0 = persist until empty
  createdAt: number;
  members: Map<string, Member>;  // keyed by deviceId
  messages: StoredMessage[];
  timer?: ReturnType<typeof setTimeout>;
  warningTimer?: ReturnType<typeof setTimeout>;
}

const rooms = new Map<string, Room>();

const COLORS = [
  "#25d366", "#53bdeb", "#f472b6", "#a78bfa", "#34d399",
  "#fbbf24", "#fb923c", "#f87171", "#38bdf8", "#818cf8",
  "#4ade80", "#e879f9", "#fca5a5", "#67e8f9",
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

function onlineMembers(room: Room): Member[] {
  return [...room.members.values()].filter(m => m.ws !== null);
}

function memberNames(room: Room): string[] {
  return [...room.members.values()].map(m => m.name);
}

function onlineCount(room: Room): number {
  return onlineMembers(room).length;
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
    members: new Map(),
    messages: [],
  };
  if (ttlMinutes > 0) {
    room.timer = setTimeout(() => expireRoom(id), ttlMinutes * 60 * 1000);
    if (ttlMinutes > 5) {
      room.warningTimer = setTimeout(() => {
        const sysMsg: StoredMessage = { type: "system", text: "Room expires in 5 minutes", ts: Date.now() };
        room.messages.push(sysMsg);
        broadcast(room, sysMsg);
      }, (ttlMinutes - 5) * 60 * 1000);
    }
  }
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function joinRoom(room: Room, ws: WSContext, name: string, deviceId: string): { ok: boolean; isReconnect: boolean } {
  const existing = room.members.get(deviceId);

  if (existing) {
    // Reconnect — close old ws if still open
    if (existing.ws) {
      try { existing.ws.close(1000, "Reconnected"); } catch {}
    }
    existing.ws = ws;
    existing.name = name;

    // Send history to reconnecting client
    ws.send(JSON.stringify({ type: "history", messages: room.messages }));
    // Notify others they're back online
    broadcast(room, {
      type: "online",
      user: name,
      members: room.members.size,
      online: onlineCount(room),
      names: memberNames(room),
    });
    return { ok: true, isReconnect: true };
  }

  // New member
  if (room.members.size >= room.maxParticipants) return { ok: false, isReconnect: false };

  const member: Member = { name, deviceId, color: colorFor(name), ws, joinedAt: Date.now() };
  room.members.set(deviceId, member);

  const sysMsg: StoredMessage = { type: "system", text: `${name} joined`, ts: Date.now() };
  room.messages.push(sysMsg);

  // Send history to new member
  ws.send(JSON.stringify({ type: "history", messages: room.messages }));

  broadcast(room, {
    type: "joined",
    user: name,
    members: room.members.size,
    online: onlineCount(room),
    names: memberNames(room),
  });

  return { ok: true, isReconnect: false };
}

/** Called when WebSocket disconnects — member goes offline but stays in room */
export function disconnectMember(room: Room, ws: WSContext) {
  for (const [deviceId, member] of room.members) {
    if (member.ws === ws) {
      member.ws = null;
      broadcast(room, {
        type: "offline",
        user: member.name,
        members: room.members.size,
        online: onlineCount(room),
        names: memberNames(room),
      });
      break;
    }
  }
}

/** Explicit leave — removes member from room entirely */
export function leaveRoom(room: Room, ws: WSContext, deviceId: string) {
  const member = room.members.get(deviceId);
  if (!member) return;

  room.members.delete(deviceId);
  if (member.ws) {
    try { member.ws.close(1000, "Left"); } catch {}
  }

  const sysMsg: StoredMessage = { type: "system", text: `${member.name} left`, ts: Date.now() };
  room.messages.push(sysMsg);

  broadcast(room, {
    type: "left",
    user: member.name,
    members: room.members.size,
    online: onlineCount(room),
    names: memberNames(room),
  });

  // In persist mode, close room when last member leaves
  if (room.ttlMinutes === 0 && room.members.size === 0) {
    broadcast(room, { type: "closed", reason: "empty" });
    rooms.delete(room.id);
  }
}

export function broadcastMessage(room: Room, ws: WSContext, text: string) {
  // Find member by ws
  let sender: Member | undefined;
  for (const m of room.members.values()) {
    if (m.ws === ws) { sender = m; break; }
  }
  if (!sender) return;

  const msg: StoredMessage = { type: "message", user: sender.name, text, ts: Date.now(), color: sender.color };
  room.messages.push(msg);
  broadcast(room, msg);
}

export function broadcastTyping(room: Room, ws: WSContext) {
  let sender: Member | undefined;
  for (const m of room.members.values()) {
    if (m.ws === ws) { sender = m; break; }
  }
  if (!sender) return;
  for (const m of room.members.values()) {
    if (m.ws && m.ws !== ws) {
      try { m.ws.send(JSON.stringify({ type: "typing", user: sender.name })); } catch {}
    }
  }
}

function broadcast(room: Room, msg: object) {
  const data = JSON.stringify(msg);
  for (const m of room.members.values()) {
    if (m.ws) {
      try { m.ws.send(data); } catch {}
    }
  }
}

function expireRoom(id: string) {
  const room = rooms.get(id);
  if (!room) return;
  broadcast(room, { type: "closed", reason: "expired" });
  for (const m of room.members.values()) {
    if (m.ws) try { m.ws.close(1000, "Room expired"); } catch {}
  }
  rooms.delete(id);
}

export function closeAllRooms() {
  for (const [id, room] of rooms) {
    if (room.timer) clearTimeout(room.timer);
    if (room.warningTimer) clearTimeout(room.warningTimer);
    broadcast(room, { type: "closed", reason: "host_disconnected" });
    for (const m of room.members.values()) {
      if (m.ws) try { m.ws.close(1000, "Server shutting down"); } catch {}
    }
  }
  rooms.clear();
}
