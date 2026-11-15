import * as THREE from "three";

function monoFamily() {
  if (typeof document === "undefined") return "monospace";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains-mono").trim();
  return v ? `${v}, ui-monospace, monospace` : "ui-monospace, monospace";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Holographic code panel (title bar + syntax-tinted lines). */
export function createHoloPanelTexture(title: string, lines: string[], width = 512, height = 320) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTexture(canvas);
  const font = monoFamily();

  roundRect(ctx, 4, 4, width - 8, height - 8, 18);
  ctx.fillStyle = "rgba(0, 40, 22, 0.55)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 255, 136, 0.85)";
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 255, 136, 0.16)";
  ctx.fillRect(6, 6, width - 12, 46);
  ["#00ff88", "#00cc6a", "#00ffcc"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(28 + i * 22, 29, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = `600 22px ${font}`;
  ctx.fillStyle = "#e0ffe9";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 104, 30);

  ctx.font = `20px ${font}`;
  lines.forEach((line, i) => {
    const y = 84 + i * 30;
    if (y > height - 20) return;
    ctx.fillStyle = "rgba(0, 255, 136, 0.35)";
    ctx.fillText(String(i + 1).padStart(2, "0"), 22, y);
    ctx.fillStyle = i % 3 === 0 ? "#00ffcc" : i % 3 === 1 ? "#00ff88" : "rgba(224,255,233,0.8)";
    ctx.fillText(line, 64, y);
  });

  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, y, width, 1);
  }
  return toTexture(canvas);
}

/** Small holographic technology badge: icon tile + label. */
export function createBadgeTexture(label: string, icon: string, width = 384, height = 144) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTexture(canvas);
  const font = monoFamily();

  roundRect(ctx, 6, 6, width - 12, height - 12, 26);
  ctx.fillStyle = "rgba(0, 34, 18, 0.6)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0, 255, 136, 0.9)";
  ctx.stroke();

  roundRect(ctx, 22, 22, height - 44, height - 44, 18);
  ctx.fillStyle = "rgba(0, 255, 136, 0.14)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 255, 204, 0.7)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#00ffcc";
  ctx.font = `700 40px ${font}, "Segoe UI Symbol", sans-serif`;
  ctx.fillText(icon, height / 2, height / 2 + 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#e8fff0";
  ctx.font = `600 44px ${font}`;
  ctx.fillText(label, height + 4, height / 2 + 2);
  return toTexture(canvas);
}

/** Soft radial gradient used for fake volumetric fog and floor glows. */
export function createRadialTexture(inner = "rgba(0,255,136,0.9)", size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.45, "rgba(0,255,136,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return toTexture(canvas);
}
