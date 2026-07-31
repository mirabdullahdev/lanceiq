import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildLattice, EXTENT, type Node } from '../../lib/lattice'

/* ------------------------------------------------------------------ *
 * The sweep.
 *
 * A scanning wave crosses the field roughly every eight seconds. As it
 * passes, each node brightens in proportion to its score — strong matches
 * flare green, weak ones barely register — then fades behind it. That is
 * the Decision Agent, animated: the same field of jobs, sorted in public.
 *
 * The alternative (everything drifting gently forever) was decoration.
 * This is the argument.
 * ------------------------------------------------------------------ */

const CYCLE = 8.2 // full loop, including the quiet gap
const SWEEP = 5.0 // seconds the wave takes to cross
const LEAD = 1.1 // how far ahead of the wave a node starts to react
const TRAIL = 3.6 // how far behind it the glow lingers
const SPAN = EXTENT.x + 3

/**
 * Position of the wave at time t. It deliberately keeps travelling past the
 * right edge after the sweep ends, so the trail decays off-screen instead of
 * every node snapping dark at the loop point.
 */
function sweepX(t: number) {
  const p = (t % CYCLE) / SWEEP
  // easeInOutSine while crossing — a constant-speed wipe reads like a
  // progress bar, which is exactly the wrong association.
  const eased = p <= 1 ? 0.5 - Math.cos(Math.PI * p) / 2 : 1 + (p - 1) * 0.9
  return -SPAN + eased * SPAN * 2
}

/** 0–1 how strongly a node at `x` is being touched by the wave right now. */
function reaction(x: number, wave: number) {
  const dx = wave - x
  if (dx >= 0) return dx < TRAIL ? 1 - dx / TRAIL : 0 // behind: long tail
  return -dx < LEAD ? 1 + dx / LEAD : 0 // ahead: short lead-in
}

/* Scratch objects, allocated once. Building these per node per frame would
   put thousands of objects a second in front of the GC for no reason. */
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

const PALE_NEAR = new THREE.Color('#c2e4d0')
const PALE_FAR = new THREE.Color('#e2f2e8')
const FLARE = new THREE.Color('#43a94b')

/* ------------------------------------------------------------------ *
 * Dim nodes — the jobs. One instanced draw call for all of them.
 * ------------------------------------------------------------------ */

type Prepped = Node & { base: THREE.Color; peak: THREE.Color; scale: number }

function DimNodes({ nodes }: { nodes: Node[] }) {
  const dim = useMemo<Prepped[]>(() => {
    return nodes
      .filter((n) => !n.lit)
      .map((n) => {
        // Depth read as colour: nodes further back sit paler, which does the
        // work a depth-of-field pass would have cost a second render target.
        const depth = (n.z + EXTENT.z) / (EXTENT.z * 2)
        const base = PALE_FAR.clone().lerp(PALE_NEAR, depth)
        // How hard this node flares is its score. That is the whole point:
        // the wave sorts the field in front of you.
        const peak = base.clone().lerp(FLARE, 0.12 + n.score * 0.88)
        return { ...n, base, peak, scale: 0.055 + n.score * 0.075 }
      })
  }, [nodes])

  const mesh = useRef<THREE.InstancedMesh>(null)

  // Seed matrices and colours before first paint, or every node flashes at
  // the origin in white for one frame.
  useLayoutEffect(() => {
    paint(mesh.current, dim, 0)
  }, [dim])

  useFrame(({ clock }) => paint(mesh.current, dim, clock.elapsedTime))

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, dim.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshLambertMaterial transparent opacity={0.92} flatShading />
    </instancedMesh>
  )
}

function paint(mesh: THREE.InstancedMesh | null, dim: Prepped[], t: number) {
  if (!mesh) return
  const wave = sweepX(t)

  for (let i = 0; i < dim.length; i++) {
    const n = dim[i]!
    const hit = reaction(n.x, wave)

    _p.set(
      n.x + Math.cos(t * 0.19 + n.phase) * 0.07,
      n.y + Math.sin(t * 0.28 + n.phase) * 0.12,
      n.z,
    )
    // Nodes swell as the wave reads them, strong matches more than weak ones.
    _s.setScalar(n.scale * (1 + hit * (0.18 + n.score * 0.5)))
    // Spin picks up while being read, then settles back to the idle drift.
    _e.set(n.phase * 0.5, n.phase + t * (0.09 + hit * 0.85), 0)
    _q.setFromEuler(_e)
    _m.compose(_p, _q, _s)
    mesh.setMatrixAt(i, _m)

    _c.copy(n.base).lerp(n.peak, hit)
    mesh.setColorAt(i, _c)
  }

  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

/* ------------------------------------------------------------------ *
 * Lit nodes — the standing "apply" verdicts. Few enough for real materials.
 * ------------------------------------------------------------------ */

function LitNode({ node }: { node: Node }) {
  const ref = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const hit = reaction(node.x, sweepX(t))

    const g = ref.current
    if (g) {
      g.position.y = node.y + Math.sin(t * 0.32 + node.phase) * 0.16
      g.position.x = node.x + Math.cos(t * 0.21 + node.phase) * 0.09
      g.rotation.y = node.phase + t * 0.16
      g.rotation.x = Math.sin(t * 0.14 + node.phase) * 0.25
      g.scale.setScalar(1 + hit * 0.3)
    }

    const h = halo.current
    if (h) {
      // A slow breath, flaring when the wave confirms it. Never a strobe.
      // Kept tight: at the old 0.62 these read as bokeh blobs rather than
      // glow, which is exactly the background-blob look we were avoiding.
      const breath = 1 + Math.sin(t * 0.9 + node.phase) * 0.14
      h.scale.setScalar(0.34 * breath * (1 + hit * 0.8))
      ;(h.material as THREE.MeshBasicMaterial).opacity =
        0.11 + Math.sin(t * 0.9 + node.phase) * 0.03 + hit * 0.15
    }
  })

  return (
    <group ref={ref} position={[node.x, node.y, node.z]}>
      <mesh scale={0.2}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#72db97"
          emissive="#3f9c52"
          emissiveIntensity={0.5}
          roughness={0.25}
          metalness={0.05}
          flatShading
        />
      </mesh>
      {/* Cheap bloom stand-in. Real post-processing costs ~90kb and a second
          render target for no gain that survives on a white background. */}
      <mesh ref={halo} scale={0.34}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#72db97" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Edges — the relationships between postings, lighting up as read.
 * ------------------------------------------------------------------ */

/* On a white page, "bright" means saturated, not light: an edge fades by
   approaching the background, not by getting whiter than it. */
const EDGE_IDLE = new THREE.Color('#dcefe3')
const EDGE_READ = new THREE.Color('#2f8f45')

function Edges({ nodes, edges }: { nodes: Node[]; edges: [number, number][] }) {
  const { geometry, xs } = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    const colors = new Float32Array(edges.length * 6)
    const xs = new Float32Array(edges.length * 2)

    edges.forEach(([a, b], i) => {
      const na = nodes[a]!
      const nb = nodes[b]!
      positions.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], i * 6)
      colors.set([EDGE_IDLE.r, EDGE_IDLE.g, EDGE_IDLE.b, EDGE_IDLE.r, EDGE_IDLE.g, EDGE_IDLE.b], i * 6)
      xs[i * 2] = na.x
      xs[i * 2 + 1] = nb.x
    })

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry: g, xs }
  }, [nodes, edges])

  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const wave = sweepX(clock.elapsedTime)
    const attr = geometry.getAttribute('color') as THREE.BufferAttribute
    const arr = attr.array as Float32Array

    for (let v = 0; v < xs.length; v++) {
      _c.copy(EDGE_IDLE).lerp(EDGE_READ, reaction(xs[v]!, wave))
      arr[v * 3] = _c.r
      arr[v * 3 + 1] = _c.g
      arr[v * 3 + 2] = _c.b
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.5} depthWrite={false} />
    </lineSegments>
  )
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

function Scene() {
  const { nodes, edges } = useMemo(() => buildLattice(), [])
  const lit = useMemo(() => nodes.filter((n) => n.lit), [nodes])
  const group = useRef<THREE.Group>(null)
  const { size } = useThree()

  // Fit the lattice to the viewport rather than letting it crop arbitrarily.
  const fit = Math.min(1, size.width / 1180)

  useFrame(({ pointer, clock }, delta) => {
    const g = group.current
    if (!g) return
    // Damped parallax — the field leans toward the cursor and settles.
    // Clamped small: this is depth, not a toy that spins.
    const targetY = pointer.x * 0.2
    const targetX = -pointer.y * 0.12
    const k = 1 - Math.pow(0.0015, delta)
    g.rotation.y += (targetY - g.rotation.y) * k
    g.rotation.x += (targetX - g.rotation.x) * k
    g.position.y = Math.sin(clock.elapsedTime * 0.16) * 0.08
  })

  return (
    <>
      {/* Two lights, not four. Every additional light recompiles into the
          shader and is paid for by every fragment, every frame. */}
      <ambientLight intensity={2.1} color="#eef8f1" />
      <directionalLight position={[4, 6, 8]} intensity={1.25} />

      <group ref={group} scale={fit}>
        <Edges nodes={nodes} edges={edges} />
        <DimNodes nodes={nodes} />
        {lit.map((n, i) => (
          <LitNode key={i} node={n} />
        ))}
      </group>
    </>
  )
}

export default function HeroField({ active }: { active: boolean }) {
  return (
    <Canvas
      /* `demand` when the hero is off screen: the last frame stays painted
         and nothing re-renders. Previously this ran a full 60fps render
         loop for the entire length of the page, which is most of why
         scrolling felt heavy. */
      frameloop={active ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, EXTENT.x * 1.42], fov: 42 }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Scene />
    </Canvas>
  )
}
