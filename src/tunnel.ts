import { existsSync, mkdirSync, createWriteStream, chmodSync } from "fs";
import { join } from "path";
import { homedir, platform, arch } from "os";
import { spawn } from "child_process";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";

const BIN_DIR = join(homedir(), ".qchat", "bin");
const BIN_NAME = platform() === "win32" ? "cloudflared.exe" : "cloudflared";
const BIN_PATH = join(BIN_DIR, BIN_NAME);

function getDownloadURL(): string {
  const p = platform();
  const a = arch();
  const base = "https://github.com/cloudflare/cloudflared/releases/latest/download";

  if (p === "darwin") {
    return a === "arm64"
      ? `${base}/cloudflared-darwin-arm64.tgz`
      : `${base}/cloudflared-darwin-amd64.tgz`;
  }
  if (p === "win32") {
    return a === "x64"
      ? `${base}/cloudflared-windows-amd64.exe`
      : `${base}/cloudflared-windows-386.exe`;
  }
  // Linux
  if (a === "arm64" || a === "aarch64") return `${base}/cloudflared-linux-arm64`;
  if (a === "arm") return `${base}/cloudflared-linux-arm`;
  return `${base}/cloudflared-linux-amd64`;
}

async function download(): Promise<void> {
  mkdirSync(BIN_DIR, { recursive: true });
  const url = getDownloadURL();
  const isTgz = url.endsWith(".tgz");

  console.log("  \x1b[2mDownloading cloudflared (one-time)...\x1b[0m");

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Failed to download cloudflared: ${res.status}`);

  if (isTgz) {
    // macOS .tgz — extract via tar
    const tmpPath = BIN_PATH + ".tgz";
    const fileStream = createWriteStream(tmpPath);
    // @ts-ignore - node fetch body is a ReadableStream
    await pipeline(res.body as any, fileStream);
    // Extract with tar
    const { execSync } = await import("child_process");
    execSync(`tar -xzf "${tmpPath}" -C "${BIN_DIR}"`, { stdio: "ignore" });
    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpPath); } catch {}
  } else {
    // Direct binary (Linux, Windows)
    const fileStream = createWriteStream(BIN_PATH);
    // @ts-ignore
    await pipeline(res.body as any, fileStream);
  }

  if (platform() !== "win32") {
    chmodSync(BIN_PATH, 0o755);
  }

  console.log("  \x1b[2m✓ cloudflared installed to ~/.qchat/bin/\x1b[0m");
}

export async function ensureCloudflared(): Promise<string> {
  if (!existsSync(BIN_PATH)) {
    await download();
  }
  return BIN_PATH;
}

export function startTunnel(port: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const binPath = await ensureCloudflared();
    const proc = spawn(binPath, ["tunnel", "--url", `http://localhost:${port}`], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; reject(new Error("Tunnel timed out (30s)")); }
    }, 30000);

    const handleOutput = (data: Buffer) => {
      const line = data.toString();
      // cloudflared prints the URL to stderr
      const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(match[0]);
      }
    };

    proc.stdout.on("data", handleOutput);
    proc.stderr.on("data", handleOutput);

    proc.on("error", (err) => {
      if (!resolved) { resolved = true; clearTimeout(timeout); reject(err); }
    });

    proc.on("exit", (code) => {
      if (!resolved) { resolved = true; clearTimeout(timeout); reject(new Error(`cloudflared exited with code ${code}`)); }
    });

    // Cleanup on process exit
    process.on("SIGINT", () => { proc.kill(); });
    process.on("SIGTERM", () => { proc.kill(); });
    process.on("exit", () => { proc.kill(); });
  });
}
