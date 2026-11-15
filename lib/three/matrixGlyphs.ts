import * as THREE from "three";

export const GLYPH_GRID = 8;
const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFZ:=";

let atlas: THREE.CanvasTexture | null = null;

/** 8×8 mirrored katakana/digit atlas shared by the rain, lenses and panels. */
export function getGlyphAtlas(): THREE.CanvasTexture {
  if (atlas) return atlas;
  const size = 512;
  const cell = size / GLYPH_GRID;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(cell * 0.74)}px "MS Gothic", "Hiragino Kaku Gothic Pro", "Noto Sans JP", monospace`;
    const chars = Array.from(GLYPHS);
    for (let i = 0; i < GLYPH_GRID * GLYPH_GRID; i++) {
      const ch = chars[i % chars.length];
      ctx.save();
      ctx.translate((i % GLYPH_GRID) * cell + cell / 2, Math.floor(i / GLYPH_GRID) * cell + cell / 2);
      ctx.scale(-1, 1);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
  }
  atlas = new THREE.CanvasTexture(canvas);
  atlas.anisotropy = 4;
  atlas.needsUpdate = true;
  return atlas;
}

/**
 * `matrixRain(uv, grid, t, glyphs)` → (brightness, head) for a falling-code
 * field. `uv` is 0–1 with y up; `grid` is columns × rows of glyph cells.
 */
export const MATRIX_GLSL = /* glsl */ `
float mxHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 matrixRain(vec2 uv, vec2 grid, float t, sampler2D glyphs) {
  vec2 cell = floor(uv * grid);
  vec2 local = fract(uv * grid);
  float speed = 0.35 + mxHash(vec2(cell.x, 1.7)) * 0.65;
  float phase = mxHash(vec2(cell.x, 9.2));
  float lane = step(0.22, mxHash(vec2(cell.x, 4.4)));
  float headPos = fract(t * speed * 0.25 + phase);
  float y = 1.0 - (cell.y + 0.5) / grid.y;
  float d = fract(headPos - y);
  float trail = pow(1.0 - d, 5.0) * lane;
  float head = step(d, 1.0 / grid.y) * lane;
  float idx = floor(mxHash(cell + floor(t * (1.5 + speed * 4.0) + phase * 10.0)) * 64.0);
  vec2 g = vec2(mod(idx, 8.0), floor(idx / 8.0));
  vec2 auv = vec2((g.x + local.x) / 8.0, 1.0 - (g.y + 1.0 - local.y) / 8.0);
  float glyph = texture2D(glyphs, auv).r;
  return vec2(glyph * trail, glyph * head);
}
`;
