import { useMemo } from 'react'
import { buildLattice, EXTENT } from '../../lib/lattice'
import { cn } from '../../lib/cn'

const CAMERA_Z = EXTENT.x * 1.42

/** Same perspective divide the WebGL camera applies, done in 3 lines of maths. */
function project(x: number, y: number, z: number) {
  const p = CAMERA_Z / (CAMERA_Z - z)
  return { x: x * p, y: -y * p, p }
}

/**
 * The reduced-motion / no-WebGL / server-render stand-in for <HeroField>.
 *
 * It reads the *same* lattice from the same seed, so a visitor who never
 * loads three.js sees the identical composition — not a different picture.
 * No <img>, no network request, ~4kb of inline SVG.
 */
export function LatticeStill({ className }: { className?: string }) {
  const { nodes, edges } = useMemo(() => buildLattice(), [])

  return (
    <svg
      viewBox="-9 -5.4 18 10.8"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="lattice-lit" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#72db97" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#72db97" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g>
        {edges.map(([a, b], i) => {
          const na = nodes[a]!
          const nb = nodes[b]!
          const pa = project(na.x, na.y, na.z)
          const pb = project(nb.x, nb.y, nb.z)
          return (
            <line
              key={i}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="#4caf50"
              strokeWidth={0.012}
              opacity={0.14}
            />
          )
        })}
      </g>

      <g>
        {nodes.map((n, i) => {
          const { x, y, p } = project(n.x, n.y, n.z)
          if (n.lit) {
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={0.36 * p} fill="url(#lattice-lit)" />
                <circle cx={x} cy={y} r={0.19 * p} fill="#72db97" />
              </g>
            )
          }
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={(0.055 + n.score * 0.075) * p}
              fill="#cfe9d8"
              opacity={0.5 + n.score * 0.35}
            />
          )
        })}
      </g>
    </svg>
  )
}
