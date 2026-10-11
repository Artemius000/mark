import * as THREE from "three";

// Procedural textures drawn on canvas, so the scene ships without image assets.

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function textOnArc(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, r: number, start: number) {
  let a = start;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    const half = w / 2 / r;
    a += half;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += half + 0.004;
  }
  return a;
}

/** Sidewall lettering for a RingGeometry whose outer radius is `outer` (planar UVs). */
export function sidewallTexture(outer: number) {
  const S = 2048;
  const [c, ctx] = makeCanvas(S, S);
  const cx = S / 2;
  const px = (r: number) => (r / outer) * (S / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(170,170,174,0.9)";
  ctx.font = "900 78px Arial, Helvetica, sans-serif";
  let a = textOnArc(ctx, "P ZERO", cx, cx, px(0.8), -Math.PI * 0.86);
  ctx.font = "700 40px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(150,150,155,0.85)";
  a = textOnArc(ctx, "   315/30 ZR21 (107Y)   ·   N0   ·   RADIAL TUBELESS", cx, cx, px(0.8), a);
  ctx.font = "700 34px Arial, Helvetica, sans-serif";
  textOnArc(ctx, "DOT 2423   ·   MAX PRESS 350 kPa   ·   ROTATION ➝   ·   МОМЕНТ ATELIER", cx, cx, px(0.8), Math.PI * 0.18);

  // moulded ring lines
  ctx.strokeStyle = "rgba(90,90,95,0.7)";
  ctx.lineWidth = 3;
  for (const r of [0.735, 0.865]) {
    ctx.beginPath();
    ctx.arc(cx, cx, px(r), 0, Math.PI * 2);
    ctx.stroke();
  }
  return finish(c);
}

/** Bump map for the tread band of the lathe tyre (u = around, v = profile index). */
export function treadBump(v0: number, v1: number) {
  const W = 4096;
  const H = 512;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const y0 = (1 - v1) * H;
  const y1 = (1 - v0) * H;
  const lugs = 150;
  ctx.strokeStyle = "#202020";
  ctx.lineCap = "round";
  for (let k = 0; k < lugs; k++) {
    const x = (k / lugs) * W;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 6);
    ctx.quadraticCurveTo(x + 10, (y0 + y1) / 2, x + 26, y1 - 6);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + W / lugs / 2, y0 + (y1 - y0) * 0.2);
    ctx.lineTo(x + W / lugs / 2 + 9, y0 + (y1 - y0) * 0.8);
    ctx.stroke();
  }
  const t = finish(c, false);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Carbon-ceramic friction face: speckled grey with concentric wear marks and a faint heat tint. */
export function discTextures(outer: number) {
  const S = 1024;
  const [c, ctx] = makeCanvas(S, S);
  const [rc, rctx] = makeCanvas(S, S);
  const cx = S / 2;
  const px = (r: number) => (r / outer) * (S / 2);

  ctx.fillStyle = "#3d3e42";
  ctx.fillRect(0, 0, S, S);
  rctx.fillStyle = "#c8c8c8";
  rctx.fillRect(0, 0, S, S);

  // carbon fibre speckle
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const l = 30 + Math.random() * 50;
    ctx.fillStyle = `rgba(${l},${l},${l + 4},${0.35 + Math.random() * 0.4})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }
  // concentric wear in the swept band
  for (let i = 0; i < 520; i++) {
    const r = px(0.29 + Math.random() * 0.26);
    const a0 = Math.random() * Math.PI * 2;
    const l = 70 + Math.random() * 70;
    ctx.strokeStyle = `rgba(${l},${l},${l + 6},${0.05 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.6;
    ctx.beginPath();
    ctx.arc(cx, cx, r, a0, a0 + 0.6 + Math.random() * 4);
    ctx.stroke();
    rctx.strokeStyle = `rgba(90,90,90,${0.08 + Math.random() * 0.12})`;
    rctx.lineWidth = 1 + Math.random() * 2;
    rctx.beginPath();
    rctx.arc(cx, cx, r, a0, a0 + 1 + Math.random() * 4);
    rctx.stroke();
  }
  // heat tint near the outer edge
  const g = ctx.createRadialGradient(cx, cx, px(0.44), cx, cx, px(0.56));
  g.addColorStop(0, "rgba(120,90,60,0)");
  g.addColorStop(0.6, "rgba(130,96,70,0.18)");
  g.addColorStop(1, "rgba(70,80,120,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  const map = finish(c);
  const rough = finish(rc, false);
  for (const t of [map, rough]) {
    t.repeat.set(1 / (outer * 2), 1 / (outer * 2));
    t.offset.set(0.5, 0.5);
  }
  return { map, rough };
}

/** Flat decal with a word set in the house voice. */
export function wordDecal(text: string, color: string, w = 1024, h = 256, weight = 900) {
  const [c, ctx] = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${weight} ${Math.round(h * 0.62)}px Arial, Helvetica, sans-serif`;
  const letterSpacing = h * 0.12;
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, x) => s + x, 0) + letterSpacing * (chars.length - 1);
  let x = w / 2 - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x + widths[i] / 2, h / 2 + h * 0.03);
    x += widths[i] + letterSpacing;
  });
  return finish(c);
}

/** Soft studio backdrop: a warm pool of light falling off to black. */
export function backdropTexture() {
  const S = 1024;
  const [c, ctx] = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S * 0.5, S * 0.45, 0, S * 0.5, S * 0.5, S * 0.5);
  g.addColorStop(0, "#2a2a2d");
  g.addColorStop(0.45, "#151517");
  g.addColorStop(1, "#0a0a0b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return finish(c);
}
