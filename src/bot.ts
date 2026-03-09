import { execFile } from "child_process";
import { promisify } from "util";
import WebSocket from "ws";

const execFileAsync = promisify(execFile);

export interface BotOpts {
  url: string;
  name: string;
  agent?: string;
  greeting?: string;
}

interface ChatMessage {
  user: string;
  text: string;
  ts: number;
}

const MAX_CONTEXT_MESSAGES = 50;

export function startBot(opts: BotOpts) {
  const transcript: ChatMessage[] = [];
  let botReady = false;
  let ws: WebSocket;
  let processing = false;

  function connect() {
    ws = new WebSocket(opts.url);

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "join", name: opts.name, deviceId: "bot-" + opts.name.toLowerCase().replace(/\s+/g, "-") }));
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(msg);
      } catch {}
    });

    ws.on("close", () => {
      setTimeout(connect, 2000);
    });

    ws.on("error", () => {});
  }

  function announce() {
    if (botReady) return;
    botReady = true;
    const greeting = opts.greeting || `Hey! I'm ${opts.name} 🤖 — mention me with @${opts.name} and I'll help out.`;
    ws.send(JSON.stringify({ type: "message", text: greeting }));
    console.log(`  \x1b[32m🤖 ${opts.name} joined the chat\x1b[0m`);
  }

  function handleMessage(msg: any) {
    if (msg.type === "history") {
      for (const m of msg.messages) {
        if (m.type === "message" && m.user !== opts.name) {
          transcript.push({ user: m.user, text: m.text, ts: m.ts });
        }
      }
      announce();
      return;
    }

    if (msg.type === "joined" && !botReady) {
      announce();
      return;
    }

    if (msg.type === "message") {
      if (msg.user === opts.name) return;

      transcript.push({ user: msg.user, text: msg.text, ts: msg.ts });
      if (transcript.length > MAX_CONTEXT_MESSAGES) transcript.shift();

      const botTag = `@${opts.name}`;
      if (!msg.text.toLowerCase().includes(botTag.toLowerCase())) return;

      // Don't queue multiple requests
      if (processing) return;

      console.log(`  \x1b[36m💬 ${msg.user}: ${msg.text}\x1b[0m`);
      ws.send(JSON.stringify({ type: "typing" }));

      // Process async so we don't block the event loop
      processMessage(msg).catch(() => {});
    }
  }

  async function processMessage(msg: any) {
    processing = true;

    const contextLines = transcript.slice(-20).map(m =>
      `[${m.user}]: ${m.text}`
    ).join("\n");

    const prompt = `You are "${opts.name}", a participant in a group chat. You only respond when someone tags you with @${opts.name}. You can see the full conversation for context.

Recent conversation:
${contextLines}

${msg.user} just mentioned you. Respond naturally as a chat participant. Keep it concise — this is a group chat. No markdown headers. Be helpful but brief.`;

    try {
      const agentId = opts.agent || "main";
      // Keep sending typing every 3s while waiting
      const typingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "typing" }));
        }
      }, 3000);

      const { stdout, stderr } = await execFileAsync(
        "openclaw",
        ["agent", "--json", "--agent", agentId, "--message", prompt],
        { timeout: 120_000 }
      );

      clearInterval(typingInterval);

      const responseText = parseAgentResponse(stdout) || parseAgentResponse(stderr);

      if (responseText) {
        ws.send(JSON.stringify({ type: "message", text: responseText }));
        transcript.push({ user: opts.name, text: responseText, ts: Date.now() });
        console.log(`  \x1b[32m🤖 ${opts.name}: ${responseText.slice(0, 100)}${responseText.length > 100 ? "..." : ""}\x1b[0m`);
      } else {
        console.error(`  \x1b[31m🤖 No response parsed from agent output\x1b[0m`);
        console.error(`  \x1b[2mstdout: ${stdout.slice(0, 200)}\x1b[0m`);
        ws.send(JSON.stringify({ type: "message", text: "Sorry, I couldn't process that. Try again?" }));
      }
    } catch (err: any) {
      // execFile error — check if stdout/stderr have the response anyway
      const output = (err.stdout || "") + "\n" + (err.stderr || "");
      const fallback = parseAgentResponse(output);
      if (fallback) {
        ws.send(JSON.stringify({ type: "message", text: fallback }));
        transcript.push({ user: opts.name, text: fallback, ts: Date.now() });
        console.log(`  \x1b[32m🤖 ${opts.name}: ${fallback.slice(0, 100)}${fallback.length > 100 ? "..." : ""}\x1b[0m`);
      } else {
        console.error(`  \x1b[31m🤖 Agent error: ${err.message?.slice(0, 200)}\x1b[0m`);
        ws.send(JSON.stringify({ type: "message", text: "Sorry, I couldn't process that. Try again?" }));
      }
    } finally {
      processing = false;
    }
  }

  connect();
}

function parseAgentResponse(output: string): string {
  if (!output) return "";
  // Try parsing entire output as JSON (pretty-printed)
  try {
    const parsed = JSON.parse(output.trim());
    if (parsed.payloads?.[0]?.text) return parsed.payloads[0].text;
  } catch {}
  // Try to find JSON object by matching braces
  const start = output.indexOf("{");
  if (start >= 0) {
    let depth = 0;
    for (let i = start; i < output.length; i++) {
      if (output[i] === "{") depth++;
      else if (output[i] === "}") { depth--; if (depth === 0) {
        try {
          const parsed = JSON.parse(output.slice(start, i + 1));
          if (parsed.payloads?.[0]?.text) return parsed.payloads[0].text;
        } catch {}
        break;
      }}
    }
  }
  return "";
}
