# ⚡ qchat

**Disposable group chat. One command, one QR code, zero signup.**

> Start a chat room from your terminal. Share the QR code. People join instantly from their phone browser. No app, no account, no friction.

<!-- ![qchat demo](demo.gif) -->

## Install

```bash
npx qchat
```

That's it. No global install needed.

## Usage

```bash
npx qchat                        # start a room on a random port
npx qchat --port 3000            # specify port
npx qchat --ttl 30               # room expires in 30 min (default: 60)
npx qchat --name "Standup"       # give the room a name
npx qchat --max 10               # limit participants (default: 50)
npx qchat --password secret      # password-protect the room
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <n>` | Port to serve on | Random (3000-9000) |
| `-t, --ttl <min>` | Room time-to-live in minutes | `60` |
| `-n, --name <name>` | Room display name | `Chat Room` |
| `-m, --max <n>` | Max participants | `50` |
| `--password <s>` | Room password | None |

## How It Works

1. You run `npx qchat` — a server starts on your local network
2. A QR code appears in your terminal
3. People scan it → beautiful mobile chat opens in their browser
4. Real-time messaging via WebSocket
5. Room auto-expires after the TTL (or when you hit Ctrl+C)

Everything stays on your local network. No cloud, no data collection, nothing leaves your machine.

## Use Cases

- 🏢 **Standup meetings** — quick throwaway chat for daily sync
- 🎓 **Workshops** — audience Q&A without downloading an app  
- 🎉 **Events & parties** — group chat for everyone in the room
- 🏕 **Hackathons** — spin up a team chat in 2 seconds
- 📋 **Presentations** — live questions from the audience
- 🏠 **Home** — share links/text between devices on your network

## Features

- 📱 **Mobile-first UI** — gorgeous dark theme, WhatsApp-level polish
- ⚡ **Instant** — zero signup, zero install for participants
- 🔒 **Optional password** — protect rooms when needed
- ⏱️ **Auto-expire** — rooms self-destruct after TTL
- 🎨 **Color-coded names** — easily distinguish participants
- 💬 **Typing indicators** — see who's typing
- 📡 **Local network** — no cloud, no tracking, fully private

## Tech Stack

- [Hono](https://hono.dev) — ultrafast web framework
- WebSocket — real-time messaging
- Vanilla HTML/CSS/JS — no build step, no framework

## License

MIT
