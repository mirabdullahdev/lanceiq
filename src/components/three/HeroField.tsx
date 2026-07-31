import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildLattice, EXTENT, type Node } from '../../lib/lattice'

/* ------------------------------------------------------------------ *
 * The sweep, done entirely on the GPU.
 *
 * A scanning wave crosses the field every ~8 seconds. As it passes, each
 * node brightens in proportion to its score — strong matches flare green,
 * weak ones barely register — then fades behind it. That is the Decision
 * Agent, animated.
 *
 * The previous version computed all of that in JavaScript: rebuilding 129
 * instance matrices, lerping 129 colours and rewriting ~600 edge vertex
 * colours on the main thread every frame, then uploading three buffers.
 * That is roughly 750 operations per frame competing with React, scrolling
 * and everything else.
 *
 * Now the geometry is uploaded once and never touched. Per frame the CPU
 * sets a single float — uTime — on each material and damps one group
 * rotation. Everything else happens in the vertex shader, in parallel, on
 * hardware built for exactly this.
 * ------------------------------------------------------------------ */

/** Must stay in step with the same constants in the shader below. */
const CYCLE = 8.2
const SPAN = EXTENT.x + 3

/* Shared GLSL: the wave position at time t, and how strongly a node at x is
   being touched by it. Injected into all three shaders so the nodes, their
   haloes and the edges cannot drift out of sync. */
const SWEEP_GLSL = /* glsl */ `
  const float CYCLE = ${CYCLE.toFixed(1)};
  const float SWEEP = 5.0;
  const float LEAD  = 1.1;
  const float TRAIL = 3.6;
  const float SPAN  = ${SPAN.toFixed(4)};

  float sweepX(float t) {
    float p = mod(t, CYCLE) / SWEEP;
    // easeInOutSine across, then keep travelling so the trail decays off the
    // right edge instead of every node snapping dark at the loop point.
    float eased = p <= 1.0 ? 0.5 - cos(3.141592653589793 * p) * 0.5
                           : 1.0 + (p - 1.0) * 0.9;
    return -SPAN + eased * SPAN * 2.0;
  }

  float reaction(float x, float wave) {
    float dx = wave - x;
    if (dx >= 0.0) return dx < TRAIL ? 1.0 - dx / TRAIL : 0.0; // behind: long tail
    return -dx < LEAD ? 1.0 + dx / LEAD : 0.0;                 // ahead: short lead
  }
`

/* ------------------------------------------------------------------ *
 * Nodes
 * ------------------------------------------------------------------ */

const NODE_VERT = /* glsl */ `
  attribute mat4 instanceMatrix;
  attribute float aScore;
  attribute float aPhase;
  attribute float aScale;
  attribute float aLit;

  uniform float uTime;
  uniform vec3 uPaleFar;
  uniform vec3 uPaleNear;
  uniform vec3 uFlare;
  uniform vec3 uMint;

  varying vec3 vColor;
  varying float vLight;

  ${SWEEP_GLSL}

  void main() {
    vec3 base = instanceMatrix[3].xyz;
    float hit = reaction(base.x, sweepX(uTime));

    // Nodes swell as the wave reads them, strong matches more than weak.
    float scale = aScale * (1.0 + hit * (0.18 + aScore * 0.5) + aLit * 0.35);

    // Uniform scale, so the instance rotation baked into instanceMatrix is
    // all the normal needs.
    vec4 world = instanceMatrix * vec4(position * scale, 1.0);

    // Slow independent drift. Cheap trig, done per-vertex on the GPU.
    world.x += cos(uTime * 0.19 + aPhase) * 0.07;
    world.y += sin(uTime * 0.28 + aPhase) * 0.12;

    vec3 n = normalize(mat3(instanceMatrix) * normal);
    vLight = 0.58 + 0.42 * max(dot(n, normalize(vec3(0.35, 0.7, 0.85))), 0.0);

    // Depth read as colour: nodes further back sit paler. Does the work a
    // depth-of-field pass would have cost a second render target.
    float depth = clamp((base.z + ${EXTENT.z.toFixed(3)}) / ${(EXTENT.z * 2).toFixed(3)}, 0.0, 1.0);
    vec3 pale = mix(uPaleFar, uPaleNear, depth);
    vec3 peak = mix(pale, uFlare, 0.12 + aScore * 0.88);

    vColor = mix(mix(pale, peak, hit), uMint, aLit);

    gl_Position = projectionMatrix * modelViewMatrix * world;
  }
`

const NODE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vLight;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(vColor * vLight, uOpacity);
  }
`

function Nodes({ nodes, time }: { nodes: Node[]; time: React.RefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)

  const { geometry, material, count } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0)

    const n = nodes.length
    const score = new Float32Array(n)
    const phase = new Float32Array(n)
    const scale = new Float32Array(n)
    const lit = new Float32Array(n)

    nodes.forEach((node, i) => {
      score[i] = node.score
      phase[i] = node.phase
      scale[i] = node.lit ? 0.2 : 0.055 + node.score * 0.075
      lit[i] = node.lit ? 1 : 0
    })

    geo.setAttribute('aScore', new THREE.InstancedBufferAttribute(score, 1))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scale, 1))
    geo.setAttribute('aLit', new THREE.InstancedBufferAttribute(lit, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.92 },
        uPaleFar: { value: new THREE.Color('#e2f2e8') },
        uPaleNear: { value: new THREE.Color('#c2e4d0') },
        uFlare: { value: new THREE.Color('#43a94b') },
        uMint: { value: new THREE.Color('#72db97') },
      },
    })

    return { geometry: geo, material: mat, count: n }
  }, [nodes])

  // Written once. Never touched again — this is the whole point.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const mat4 = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const pos = new THREE.Vector3()
    const one = new THREE.Vector3(1, 1, 1)

    nodes.forEach((node, i) => {
      pos.set(node.x, node.y, node.z)
      euler.set(node.phase * 0.5, node.phase, 0)
      quat.setFromEuler(euler)
      mat4.compose(pos, quat, one)
      m.setMatrixAt(i, mat4)
    })
    m.instanceMatrix.needsUpdate = true
  }, [nodes])

  useLayoutEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    material.uniforms['uTime']!.value = time.current
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, count]}
      frustumCulled={false}
      matrixAutoUpdate={false}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Haloes for the standing "apply" verdicts. Billboarded quads with a
 * radial falloff — six instances, one draw call, no geometry updates.
 * ------------------------------------------------------------------ */

const HALO_VERT = /* glsl */ `
  attribute mat4 instanceMatrix;
  attribute float aPhase;
  uniform float uTime;
  varying vec2 vUv;
  varying float vGlow;

  ${SWEEP_GLSL}

  void main() {
    vUv = uv;
    vec3 base = instanceMatrix[3].xyz;
    float hit = reaction(base.x, sweepX(uTime));

    // A slow breath, flaring when the wave confirms it. Never a strobe.
    float breath = 1.0 + sin(uTime * 0.9 + aPhase) * 0.14;
    vGlow = 0.11 + sin(uTime * 0.9 + aPhase) * 0.03 + hit * 0.15;

    float size = 0.62 * breath * (1.0 + hit * 0.8);

    vec4 mv = modelViewMatrix * vec4(base, 1.0);
    mv.x += cos(uTime * 0.19 + aPhase) * 0.07;
    mv.y += sin(uTime * 0.28 + aPhase) * 0.12;
    mv.xy += position.xy * size;

    gl_Position = projectionMatrix * mv;
  }
`

const HALO_FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying float vGlow;
  uniform vec3 uColor;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * vGlow);
  }
`

function Haloes({ nodes, time }: { nodes: Node[]; time: React.RefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const lit = useMemo(() => nodes.filter((n) => n.lit), [nodes])

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1)
    const phase = new Float32Array(lit.length)
    lit.forEach((n, i) => (phase[i] = n.phase))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#72db97') },
      },
    })
    return { geometry: geo, material: mat }
  }, [lit])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const mat4 = new THREE.Matrix4()
    lit.forEach((n, i) => {
      mat4.makeTranslation(n.x, n.y, n.z)
      m.setMatrixAt(i, mat4)
    })
    m.instanceMatrix.needsUpdate = true
  }, [lit])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    material.uniforms['uTime']!.value = time.current
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, lit.length]}
      frustumCulled={false}
      matrixAutoUpdate={false}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Edges. Static geometry; the wave tint is computed per-vertex on the GPU.
 * ------------------------------------------------------------------ */

const EDGE_VERT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uIdle;
  uniform vec3 uRead;
  varying vec3 vColor;

  ${SWEEP_GLSL}

  void main() {
    float hit = reaction(position.x, sweepX(uTime));
    vColor = mix(uIdle, uRead, hit);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const EDGE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(vColor, uOpacity); }
`

function Edges({
  nodes,
  edges,
  time,
}: {
  nodes: Node[]
  edges: [number, number][]
  time: React.RefObject<number>
}) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      const na = nodes[a]!
      const nb = nodes[b]!
      positions.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], i * 6)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    /* On a white page "bright" means saturated, not light: an edge fades by
       approaching the background, not by getting whiter than it. */
    const mat = new THREE.ShaderMaterial({
      vertexShader: EDGE_VERT,
      fragmentShader: EDGE_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.5 },
        uIdle: { value: new THREE.Color('#dcefe3') },
        uRead: { value: new THREE.Color('#2f8f45') },
      },
    })
    return { geometry: g, material: mat }
  }, [nodes, edges])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    material.uniforms['uTime']!.value = time.current
  })

  return <lineSegments args={[geometry, material]} frustumCulled={false} />
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

function Scene() {
  const { nodes, edges } = useMemo(() => buildLattice(), [])
  const group = useRef<THREE.Group>(null)
  const { size } = useThree()

  /* One clock read per frame, shared by all three materials, so the wave
     cannot desynchronise between nodes, haloes and edges. */
  const time = useRef(0)

  // Fit the lattice to the viewport rather than letting it crop arbitrarily.
  const fit = Math.min(1, size.width / 1180)

  useFrame(({ pointer, clock }, delta) => {
    time.current = clock.elapsedTime

    const g = group.current
    if (!g) return
    // Damped parallax — the field leans toward the cursor and settles.
    const targetY = pointer.x * 0.2
    const targetX = -pointer.y * 0.12
    const k = 1 - Math.pow(0.0015, delta)
    g.rotation.y += (targetY - g.rotation.y) * k
    g.rotation.x += (targetX - g.rotation.x) * k
    g.position.y = Math.sin(clock.elapsedTime * 0.16) * 0.08
  })

  return (
    /* No lights: the node shader does its own single-direction shading, which
       is all this flat-shaded look needs. Every real light would otherwise be
       paid for by every fragment, every frame. */
    <group ref={group} scale={fit}>
      <Edges nodes={nodes} edges={edges} time={time} />
      <Nodes nodes={nodes} time={time} />
      <Haloes nodes={nodes} time={time} />
    </group>
  )
}

export default function HeroField({ active }: { active: boolean }) {
  return (
    <Canvas
      /* `demand` when the hero is off screen: the last frame stays painted
         and nothing re-renders. */
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
