#!/usr/bin/env node
import { program } from "commander";
import qrTerminal from "qrcode-terminal";
import { startServer, getLocalIP } from "./server.js";
import { startTunnel } from "./tunnel.js";
import { startBot } from "./bot.js";

program
  .name("qchat")
  .description("Disposable group chat. One command, one QR code, zero signup.")
  .version("1.4.0")
  .option("-p, --port <number>", "port to serve on", (v) => parseInt(v), 0)
  .option("-t, --ttl <minutes>", "room TTL in minutes", (v) => parseInt(v), 60)
  .option("-n, --name <name>", "room name")
  .option("-m, --max <number>", "max participants", (v) => parseInt(v), 50)
  .option("--password <secret>", "room password")
  .option("--public", "expose via Cloudflare tunnel (accessible from anywhere)")
  .option("--persist", "room stays open until everyone leaves (no TTL)")
  .option("--bot [name]", "add an OpenClaw agent as a participant (default name: Agent)")
  .option("--bot-agent <id>", "OpenClaw agent id for --bot")
  .option("--bot-greeting <text>", "custom bot greeting message")
  .parse();

const opts = program.opts();
const port = opts.port || (3000 + Math.floor(Math.random() * 6000));
const ttl = opts.persist ? 0 : opts.ttl;

startServer(
  { port, name: opts.name, password: opts.password, max: opts.max, ttl },
  async (localUrl, room) => {
    let shareUrl = localUrl;

    if (opts.public) {
      console.log("");
      console.log("  \x1b[36m\x1b[1m⚡ qchat\x1b[0m  \x1b[33m(public mode)\x1b[0m");
      console.log("");
      try {
        const tunnelBase = await startTunnel(port);
        shareUrl = `${tunnelBase}/room/${room.id}`;
        console.log("  \x1b[32m✓ Tunnel active\x1b[0m");
      } catch (err: any) {
        console.log(`  \x1b[31m✗ Tunnel failed: ${err.message}\x1b[0m`);
        console.log("  \x1b[2mFalling back to local URL\x1b[0m");
      }
    } else {
      console.log("");
      console.log("  \x1b[36m\x1b[1m⚡ qchat\x1b[0m");
    }

    console.log("");
    console.log(`  Room:  \x1b[1m${room.name}\x1b[0m`);
    console.log(`  TTL:   ${room.ttlMinutes === 0 ? 'Until empty (persist mode)' : room.ttlMinutes + ' minutes'}`);
    console.log(`  Max:   ${room.maxParticipants} participants`);
    if (room.password) console.log("  🔒    Password-protected");
    if (opts.bot) console.log(`  🤖    Bot: ${typeof opts.bot === "string" ? opts.bot : "Agent"}`);
    console.log("");
    console.log(`  \x1b[4m${shareUrl}\x1b[0m`);
    if (opts.public && shareUrl !== localUrl) {
      console.log(`  \x1b[2mLocal: ${localUrl}\x1b[0m`);
    }
    console.log("");
    qrTerminal.generate(shareUrl, { small: true }, (qr: string) => {
      console.log(qr);
      console.log("");
      console.log("  \x1b[2mScan the QR code or share the URL. Ctrl+C to close.\x1b[0m");
      console.log("");

      // Start bot after everything is ready
      if (opts.bot) {
        const botName = typeof opts.bot === "string" ? opts.bot : "Agent";
        const wsUrl = `ws://localhost:${port}/room/${room.id}/ws`;
        startBot({
          url: wsUrl,
          name: botName,
          agent: opts.botAgent,
          greeting: opts.botGreeting,
        });
      }
    });
  }
);
