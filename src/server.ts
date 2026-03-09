import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serve } from "@hono/node-server";
import { networkInterfaces } from "os";
import QRCode from "qrcode";
import { createRoom, getRoom, joinRoom, disconnectMember, leaveRoom, broadcastMessage, broadcastTyping, closeAllRooms, type Room } from "./room.js";
import { generateHTML } from "./html.js";

export interface ServerOpts {
  port: number;
  name?: string;
  password?: string;
  max?: number;
  ttl?: number;
}

export function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

export function startServer(opts: ServerOpts, onReady: (url: string, room: Room) => void | Promise<void>) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  const room = createRoom({ name: opts.name, password: opts.password, max: opts.max, ttl: opts.ttl });
  const ip = getLocalIP();

  app.get("/", (c) => c.redirect(`/room/${room.id}`));

  app.get("/manifest.json", (c) => c.json({
    name: opts.name || "qchat",
    short_name: "qchat",
    description: "Disposable group chat",
    start_url: `/room/${room.id}`,
    display: "standalone",
    background_color: "#0b141a",
    theme_color: "#00a884",
    icons: [{
      src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%230b141a' width='100' height='100' rx='20'/><text y='70' x='50' text-anchor='middle' font-size='60'>💬</text></svg>",
      sizes: "any",
      type: "image/svg+xml"
    }]
  }));

  app.get("/sw.js", (c) => {
    return c.body("self.addEventListener('fetch',()=>{});", 200, { "Content-Type": "application/javascript" });
  });

  app.get("/room/:id", (c) => {
    const r = getRoom(c.req.param("id")!);
    if (!r) return c.text("Room not found", 404);
    return c.html(generateHTML(r.id, r.name, !!r.password, r.ttlMinutes, r.createdAt));
  });

  app.get("/room/:id/qr", async (c) => {
    const r = getRoom(c.req.param("id")!);
    if (!r) return c.text("Room not found", 404);
    const url = `http://${ip}:${opts.port}/room/${r.id}`;
    const svg = await QRCode.toString(url, { type: "svg" });
    return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
  });

  app.get("/room/:id/ws", upgradeWebSocket((c) => {
    const roomId = c.req.param("id")!;
    return {
      onMessage(event, ws) {
        const r = getRoom(roomId);
        if (!r) return;
        try {
          const raw = event.data;
          const msg = JSON.parse(typeof raw === "string" ? raw : String(raw));
          if (msg.type === "join") {
            if (r.password && msg.password !== r.password) {
              ws.send(JSON.stringify({ type: "error", text: "Wrong password" }));
              return;
            }
            if (!msg.name?.trim()) {
              ws.send(JSON.stringify({ type: "error", text: "Name required" }));
              return;
            }
            joinRoom(r, ws, msg.name.trim(), msg.deviceId || "unknown");
          } else if (msg.type === "message") {
            if (msg.text?.trim()) broadcastMessage(r, ws, msg.text.trim());
          } else if (msg.type === "typing") {
            broadcastTyping(r, ws);
          } else if (msg.type === "leave") {
            leaveRoom(r, ws, msg.deviceId || "unknown");
          }
        } catch {}
      },
      onClose(_, ws) {
        const r = getRoom(roomId);
        if (r) disconnectMember(r, ws);
      },
    };
  }));

  const server = serve({ fetch: app.fetch, port: opts.port }, () => {
    injectWebSocket(server);
    const url = `http://${ip}:${opts.port}/room/${room.id}`;
    onReady(url, room);
  });

  process.on("SIGINT", () => { closeAllRooms(); server.close(); process.exit(0); });
  process.on("SIGTERM", () => { closeAllRooms(); server.close(); process.exit(0); });
}
