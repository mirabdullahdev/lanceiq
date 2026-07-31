/**
 * The hero visual is not decoration — it is the product's thesis in one image.
 *
 * A field of job postings hangs in space. Almost all of them are dim: noise,
 * not worth a connect. A handful are lit. That is the whole pitch, and it is
 * why the scene is a lattice of graded nodes rather than tumbling shapes.
 *
 * Generated deterministically so (a) the WebGL scene and the reduced-motion
 * SVG fallback are the *same* arrangement, and (b) it looks composed rather
 * than re-randomised on every reload.
 */

export type Node = {
  x: number
  y: number
  z: number
  /** 0–1 confidence. Only nodes above LIT_THRESHOLD are "apply" verdicts. */
  score: number
  lit: boolean
  /** Phase offset so the drift never looks synchronised. */
  phase: number
}

export type Edge = [number, number]

/** mulberry32 — tiny, fast, and stable across engines. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const LATTICE_SEED = 0x4c49 // "LI"
const COLS = 9
const ROWS = 5
const LAYERS = 3
const SPACING = { x: 1.62, y: 1.42, z: 1.5 }
const LIT_THRESHOLD = 0.895

export const EXTENT = {
  x: ((COLS - 1) * SPACING.x) / 2,
  y: ((ROWS - 1) * SPACING.y) / 2,
  z: ((LAYERS - 1) * SPACING.z) / 2,
}

export function buildLattice(seed = LATTICE_SEED): { nodes: Node[]; edges: Edge[] } {
  const rand = rng(seed)
  const nodes: Node[] = []

  for (let l = 0; l < LAYERS; l++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Jitter off a grid: structured enough to read as a system,
        // loose enough that it never looks like graph paper.
        const jx = (rand() - 0.5) * 0.62
        const jy = (rand() - 0.5) * 0.62
        const jz = (rand() - 0.5) * 0.4
        const score = rand()
        nodes.push({
          x: (c - (COLS - 1) / 2) * SPACING.x + jx,
          y: (r - (ROWS - 1) / 2) * SPACING.y + jy,
          z: (l - (LAYERS - 1) / 2) * SPACING.z + jz,
          score,
          lit: score > LIT_THRESHOLD,
          phase: rand() * Math.PI * 2,
        })
      }
    }
  }

  // Connect near neighbours only. A fully-connected graph reads as chaos;
  // sparse local links read as a considered structure.
  const edges: Edge[] = []
  const maxDist = 2.05
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]!
    let degree = 0
    for (let j = i + 1; j < nodes.length && degree < 3; j++) {
      const b = nodes[j]!
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
      if (d < maxDist) {
        edges.push([i, j])
        degree++
      }
    }
  }

  return { nodes, edges }
}

/** Indices of the "apply" verdicts, for the scene's emissive pass. */
export function litIndices(nodes: Node[]): number[] {
  return nodes.reduce<number[]>((acc, n, i) => (n.lit ? [...acc, i] : acc), [])
}
