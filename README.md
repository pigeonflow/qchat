# qchat

Disposable group chat. One command, one QR code, zero signup.

Spin up an instant chat room from your terminal. Share the QR code — people scan it and join from their phone browser. No app to install. Room self-destructs when done.

## Install

```bash
npx @pigeonflow/qchat
```

That's it. No global install needed.

## Usage

```bash
# Start a local chat room (default: 60 min TTL)
npx @pigeonflow/qchat

# Public mode — accessible from anywhere via Cloudflare tunnel
npx @pigeonflow/qchat --public

# Custom room name
npx @pigeonflow/qchat --name "Team Standup"

# Persist mode — room stays open until everyone leaves
npx @pigeonflow/qchat --persist

# Password-protected room
npx @pigeonflow/qchat --password secret123

# Custom TTL (30 minutes)
npx @pigeonflow/qchat --ttl 30

# Combine flags
npx @pigeonflow/qchat --public --name "Workshop" --persist --password demo
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --port <n>` | Port to serve on | Random (3000-9000) |
| `-t, --ttl <min>` | Room expires after N minutes | `60` |
| `-n, --name <s>` | Room display name | `Chat Room` |
| `-m, --max <n>` | Max participants | `50` |
| `--password <s>` | Require password to join | None |
| `--public` | Expose via Cloudflare tunnel | Off |
| `--persist` | No TTL — room lives until empty | Off |

## How it works

1. You run `npx @pigeonflow/qchat` on your machine
2. A QR code appears in your terminal
3. People scan it → opens a chat in their phone browser
4. Real-time messaging via WebSocket
5. Room auto-expires after TTL (or when everyone leaves in persist mode)
6. `Ctrl+C` closes everything

### Public mode

By default, qchat runs on your local network. Add `--public` to make it accessible from anywhere:

```bash
npx @pigeonflow/qchat --public
```

This starts a [Cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — your room gets a public HTTPS URL like `https://random-words.trycloudflare.com/room/abc123`. First run downloads the `cloudflared` binary (~25MB, cached at `~/.qchat/bin/`).

### Add to Home Screen

The chat UI is a PWA. Users can tap "📲 Add to Home" in the header to save it as an app shortcut on their phone — instant access without opening a browser.

## Use cases

- **Meetings** — quick throwaway chat for a standup or call
- **Workshops** — audience Q&A without installing anything
- **Events** — conference hallway chat, party coordination
- **Classrooms** — real-time backchannel
- **LAN parties** — local network, no internet needed

## Features

- 📱 WhatsApp-style mobile-first UI (dark theme)
- 🔒 Optional password protection
- ⏱️ Configurable TTL or persist-until-empty mode
- 🌐 Public mode via Cloudflare tunnel
- 📲 PWA — installable as home screen shortcut
- 💬 Typing indicators, read ticks, color-coded names
- 🔄 Device ID tracking (reconnect handling, name memory)
- 📷 QR code in terminal + shareable SVG endpoint

## License

MIT

## Links

- [npm](https://www.npmjs.com/package/@pigeonflow/qchat)
- [GitHub](https://github.com/pigeonflow/qchat)
