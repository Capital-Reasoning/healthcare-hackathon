'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Point {
  x: number;
  y: number;
  z: number;
  centerDist: number;
  isShell: boolean;
  cluster: number;
  /** 'base' | 'found' | 'retained' | 'cited' */
  role: number;
  /** per-point random offset for twinkle / stagger */
  offset: number;
  // screen-space (set each frame)
  sx: number;
  sy: number;
  depth: number;
}

interface AnalysisAnimationProps {
  onComplete: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants (from Vector Cube app.mjs)                               */
/* ------------------------------------------------------------------ */

const TOTAL_DURATION = 10; // seconds

// Original Vector Cube colors (RGB)
const COLOR = {
  wave: [228, 232, 238] as const, // thought / search wave
  analyzed: [74, 176, 255] as const, // azure
  retained: [87, 220, 170] as const, // mint-teal
  cited: [255, 171, 92] as const, // amber
  shell: [145, 156, 175] as const,
};

const BG = '#07101b';
const CUBE_SIZE = 10;
const CENTER = (CUBE_SIZE - 1) * 0.5;
const POINT_COUNT = 900;
const CLUSTER_COUNT = 6;
const FOUND_COUNT = 38;
const RETAINED_COUNT = 14;
const CITED_COUNT = 5;
const ROLE_BASE = 0;
const ROLE_FOUND = 1;
const ROLE_RETAINED = 2;
const ROLE_CITED = 3;
const SPIN_SPEED = 0.18; // rad/s

const STATUS_MESSAGES = [
  { at: 0, text: 'Ingesting patient records...' },
  { at: 2, text: 'Searching clinical patterns...' },
  { at: 4.5, text: 'Analyzing guideline matches...' },
  { at: 7, text: 'Resolving care actions...' },
  { at: 9, text: 'Analysis complete' },
];

/* ------------------------------------------------------------------ */
/*  Math helpers (ported from Vector Cube)                             */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function gaussian(rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/*  Point generation                                                   */
/* ------------------------------------------------------------------ */

function generatePoints(seed: number): Point[] {
  const rng = mulberry32(seed);
  const points: Point[] = [];

  // Structured centroids spread across the cube (opposite corners + face centers)
  const centroids: [number, number, number][] = [
    [2.5, 2.5, 2.5],
    [6.5, 6.5, 6.5],
    [2.5, 6.5, 2.5],
    [6.5, 2.5, 6.5],
    [6.5, 2.5, 2.5],
    [2.5, 6.5, 6.5],
  ];
  // Add jitter to centroids
  for (const c of centroids) {
    c[0] += (rng() - 0.5) * 1.5;
    c[1] += (rng() - 0.5) * 1.5;
    c[2] += (rng() - 0.5) * 1.5;
  }

  // Generate clustered points (700)
  const CLUSTERED = 700;
  for (let i = 0; i < CLUSTERED; i++) {
    const ci = i % CLUSTER_COUNT;
    const centroid = centroids[ci]!;
    const x = clamp(centroid[0] + gaussian(rng) * 1.3, 0, CUBE_SIZE - 1);
    const y = clamp(centroid[1] + gaussian(rng) * 1.3, 0, CUBE_SIZE - 1);
    const z = clamp(centroid[2] + gaussian(rng) * 1.3, 0, CUBE_SIZE - 1);
    points.push(makeDataPoint(x, y, z, ci, rng));
  }

  // Uniform ambient points spread throughout the cube (200)
  for (let i = 0; i < POINT_COUNT - CLUSTERED; i++) {
    const x = rng() * (CUBE_SIZE - 1);
    const y = rng() * (CUBE_SIZE - 1);
    const z = rng() * (CUBE_SIZE - 1);
    points.push(makeDataPoint(x, y, z, i % CLUSTER_COUNT, rng));
  }

  // Add shell wireframe points on cube faces
  for (let a = 0; a <= CUBE_SIZE - 1; a += 1) {
    for (let b = 0; b <= CUBE_SIZE - 1; b += 1) {
      // Only edges and sparse face grid
      if (a % 3 !== 0 && b % 3 !== 0) continue;
      for (const face of [0, CUBE_SIZE - 1]) {
        // XY faces (z = 0 and z = max)
        points.push(makeShellPoint(a, b, face, rng));
        // XZ faces (y = 0 and y = max)
        points.push(makeShellPoint(a, face, b, rng));
        // YZ faces (x = 0 and x = max)
        points.push(makeShellPoint(face, a, b, rng));
      }
    }
  }

  // Assign roles: sort by center distance and pick subsets
  const sorted = [...points.filter((p) => !p.isShell)].sort(
    (a, b) => a.centerDist - b.centerDist,
  );

  // Cited = innermost points from a couple clusters
  for (let i = 0; i < Math.min(CITED_COUNT, sorted.length); i++) {
    sorted[i]!.role = ROLE_CITED;
  }
  // Retained = next tier
  let retainCount = 0;
  for (let i = CITED_COUNT; i < sorted.length && retainCount < RETAINED_COUNT; i++) {
    sorted[i]!.role = ROLE_RETAINED;
    retainCount++;
  }
  // Found = broader set
  let foundCount = 0;
  for (let i = CITED_COUNT + RETAINED_COUNT; i < sorted.length && foundCount < FOUND_COUNT; i++) {
    sorted[i]!.role = ROLE_FOUND;
    foundCount++;
  }

  return points;
}

function makeDataPoint(x: number, y: number, z: number, cluster: number, rng: () => number): Point {
  const dx = x - CENTER;
  const dy = y - CENTER;
  const dz = z - CENTER;
  return {
    x,
    y,
    z,
    centerDist: Math.sqrt(dx * dx + dy * dy + dz * dz),
    isShell: false,
    cluster,
    role: ROLE_BASE,
    offset: rng(),
    sx: 0,
    sy: 0,
    depth: 0,
  };
}

function makeShellPoint(x: number, y: number, z: number, rng: () => number): Point {
  const dx = x - CENTER;
  const dy = y - CENTER;
  const dz = z - CENTER;
  return {
    x,
    y,
    z,
    centerDist: Math.sqrt(dx * dx + dy * dy + dz * dz),
    isShell: true,
    cluster: -1,
    role: ROLE_BASE,
    offset: rng(),
    sx: 0,
    sy: 0,
    depth: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Phase intensity helpers                                            */
/* ------------------------------------------------------------------ */

/** Repeating outward wave sweep — uniform spherical expansion, loops every WAVE_PERIOD. */
const WAVE_PERIOD = 3; // seconds per full expansion
const MAX_WAVE_RADIUS = Math.sqrt(CENTER * CENTER * 3) * 1.15;

function searchWaveIntensity(centerDist: number, elapsed: number): number {
  const cycleT = (elapsed % WAVE_PERIOD) / WAVE_PERIOD;
  const waveRadius = cycleT * MAX_WAVE_RADIUS;
  const waveWidth = 1.2;
  const ring = Math.exp(-((centerDist - waveRadius) ** 2) / (2 * waveWidth * waveWidth));
  // Soft glow behind the wavefront
  const fill = centerDist < waveRadius ? 0.12 * (1 - centerDist / Math.max(waveRadius, 0.01)) : 0;
  return (ring + fill) * 0.85;
}

/** Twinkle/blink effect during analysis. */
function twinkleIntensity(offset: number, elapsed: number): number {
  const t = (elapsed * 3.2 + offset * 6.28) % 6.28;
  return 0.3 + 0.7 * Math.max(0, Math.sin(t));
}

/* ------------------------------------------------------------------ */
/*  Color blending                                                     */
/* ------------------------------------------------------------------ */

function colorForPoint(
  point: Point,
  elapsed: number,
): [number, number, number, number] {
  // Shell points: constant faint gray
  if (point.isShell) {
    const fadeIn = smoothstep(0, 1.5, elapsed);
    return [COLOR.shell[0], COLOR.shell[1], COLOR.shell[2], 0.18 * fadeIn];
  }

  const fadeIn = smoothstep(0, 1, elapsed);
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;

  // --- Continuous search wave (repeating spherical expansion) ---
  const wave = searchWaveIntensity(point.centerDist, elapsed) * fadeIn;
  const waveAlpha = Math.min(0.58, wave * 0.56);
  if (waveAlpha > 0.001) {
    r += COLOR.wave[0] * waveAlpha;
    g += COLOR.wave[1] * waveAlpha;
    b += COLOR.wave[2] * waveAlpha;
    a += waveAlpha;
  }

  // --- Found points progressively light up azure ---
  if (point.role >= ROLE_FOUND) {
    const foundT = smoothstep(2, 5, elapsed);
    const twinkle = twinkleIntensity(point.offset, elapsed);
    const azureAlpha = Math.min(0.65, foundT * 0.5 * twinkle * fadeIn);
    if (azureAlpha > 0.001) {
      r += COLOR.analyzed[0] * azureAlpha;
      g += COLOR.analyzed[1] * azureAlpha;
      b += COLOR.analyzed[2] * azureAlpha;
      a += azureAlpha;
    }
  }

  // --- Retained points transition to mint-teal ---
  if (point.role >= ROLE_RETAINED) {
    const mintT = smoothstep(4, 7, elapsed);
    const mintAlpha = Math.min(0.72, mintT * 0.6 * fadeIn);
    if (mintAlpha > 0.001) {
      r += COLOR.retained[0] * mintAlpha;
      g += COLOR.retained[1] * mintAlpha;
      b += COLOR.retained[2] * mintAlpha;
      a += mintAlpha;
    }
  }

  // --- Cited points transition to amber ---
  if (point.role === ROLE_CITED) {
    const amberT = smoothstep(6, 8.5, elapsed);
    const amberAlpha = Math.min(0.92, amberT * 0.8 * fadeIn);
    if (amberAlpha > 0.001) {
      r += COLOR.cited[0] * amberAlpha;
      g += COLOR.cited[1] * amberAlpha;
      b += COLOR.cited[2] * amberAlpha;
      a += amberAlpha;
    }
  }

  if (a <= 0.003) return [0, 0, 0, 0];
  return [Math.round(r / a), Math.round(g / a), Math.round(b / a), clamp(a, 0, 0.98)];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnalysisAnimation({ onComplete, className }: AnalysisAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pointsRef = useRef<Point[]>([]);
  const completedRef = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const render = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startTimeRef.current === 0) startTimeRef.current = now;
    const elapsed = (now - startTimeRef.current) / 1000;

    // Fire completion
    if (elapsed >= TOTAL_DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete();
      return;
    }

    // Canvas sizing
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const points = pointsRef.current;
    if (points.length === 0) return;

    // Camera: auto-spin
    const yaw = -Math.PI / 4 + elapsed * SPIN_SPEED;
    const pitch = Math.asin(1 / Math.sqrt(3));
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    const cameraScale = (Math.min(w, h) / Math.max(CUBE_SIZE * 2.4, 1)) * 1.15;
    const baseRadius = Math.max(2, cameraScale * 0.09 * 1.4);

    // Project all points
    for (const p of points) {
      const wx = p.x - CENTER;
      const wy = p.y - CENTER;
      const wz = p.z - CENTER;
      const yawX = wx * cosYaw - wy * sinYaw;
      const yawY = wx * sinYaw + wy * cosYaw;
      p.sy = h * 0.5 + (yawY * cosPitch - wz * sinPitch) * cameraScale;
      p.depth = yawY * sinPitch + wz * cosPitch;
      p.sx = w * 0.5 + yawX * cameraScale;
    }

    // Depth sort (back to front)
    points.sort((a, b) => a.depth - b.depth);

    // Draw
    for (const p of points) {
      const [cr, cg, cb, ca] = colorForPoint(p, elapsed);
      if (ca <= 0.003) continue;

      let radius = baseRadius;
      if (p.role === ROLE_CITED) radius = baseRadius * 1.6;
      else if (p.role === ROLE_RETAINED) radius = baseRadius * 1.35;
      else if (p.role === ROLE_FOUND) radius = baseRadius * 1.15;
      else if (p.isShell) radius = baseRadius * 0.85;

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${ca})`;
      ctx.fill();
    }

    // Update status text
    if (statusRef.current) {
      let msg = '';
      for (let i = STATUS_MESSAGES.length - 1; i >= 0; i--) {
        if (elapsed >= STATUS_MESSAGES[i]!.at) {
          msg = STATUS_MESSAGES[i]!.text;
          break;
        }
      }
      if (statusRef.current.textContent !== msg) {
        statusRef.current.textContent = msg;
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [onComplete]);

  useEffect(() => {
    // Generate points once
    pointsRef.current = generatePoints(0xb35704);

    // Start animation loop
    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        className="h-[min(80vh,800px)] w-[min(80vh,800px)]"
        style={{ background: BG }}
      />
      <p
        ref={statusRef}
        className="font-mono text-sm tracking-wide"
        style={{ color: `rgb(${COLOR.wave.join(',')})` }}
      />
    </div>
  );
}
