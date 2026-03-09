#!/usr/bin/env node
import { program } from "commander";
import qrTerminal from "qrcode-terminal";
import { startServer } from "./server.js";

program
  .name("qchat")
  .description("Disposable group chat. One command, one QR code, zero signup.")
  .version("1.0.0")
  .option("-p, --port <number>", "port to serve on", (v) => parseInt(v), 0)
  .option("-t, --ttl <minutes>", "room TTL in minutes", (v) => parseInt(v), 60)
  .option("-n, --name <name>", "room name")
  .option("-m, --max <number>", "max participants", (v) => parseInt(v), 50)
  .option("--password <secret>", "room password")
  .parse();

const opts = program.opts();
const port = opts.port || (3000 + Math.floor(Math.random() * 6000));

startServer(
  { port, name: opts.name, password: opts.password, max: opts.max, ttl: opts.ttl },
  (url, room) => {
    console.log("");
    console.log("  \x1b[36m\x1b[1m⚡ qchat\x1b[0m");
    console.log("");
    console.log(`  Room:  \x1b[1m${room.name}\x1b[0m`);
    console.log(`  TTL:   ${room.ttlMinutes} minutes`);
    console.log(`  Max:   ${room.maxParticipants} participants`);
    if (room.password) console.log("  🔒    Password-protected");
    console.log("");
    console.log(`  \x1b[4m${url}\x1b[0m`);
    console.log("");
    qrTerminal.generate(url, { small: true }, (qr: string) => {
      console.log(qr);
      console.log("");
      console.log("  \x1b[2mScan the QR code or share the URL. Ctrl+C to close.\x1b[0m");
      console.log("");
    });
  }
);
