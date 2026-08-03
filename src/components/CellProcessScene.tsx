'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const PHASES = [
  { label: 'Live Cell', detail: 'State exists as one complete Cell' },
  { label: 'Validate', detail: 'Lock and type scripts check the transition' },
  { label: 'Consume', detail: 'The input Cell is spent, never edited' },
  { label: 'Create', detail: 'New output Cells carry the next state' },
] as const

const LAYERS = [
  { color: '#e7e5e4', emissive: '#292524', size: [1.52, 0.2, 1] as const },
  { color: '#60a5fa', emissive: '#102c55', size: [1.28, 0.17, 0.83] as const },
  { color: '#fbbf24', emissive: '#4a2d03', size: [1.04, 0.15, 0.67] as const },
  { color: '#34d399', emissive: '#064e3b', size: [0.8, 0.13, 0.51] as const },
] as const

type SceneProps = {
  reducedMotion: boolean
  onPhaseChange: (phase: number) => void
}

function ease(value: number) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1)
  return clamped * clamped * (3 - 2 * clamped)
}

function CellLayers({ compact = false }: { compact?: boolean }) {
  return (
    <group scale={compact ? 0.78 : 1}>
      {LAYERS.map((layer, index) => (
        <RoundedBox
          key={layer.color}
          args={[...layer.size]}
          position={[0, (index - 1.5) * 0.2, 0]}
          radius={0.075}
          smoothness={5}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={layer.color}
            emissive={layer.emissive}
            emissiveIntensity={0.18}
            roughness={0.3}
            metalness={0.18}
            clearcoat={0.72}
            clearcoatRoughness={0.25}
          />
          <Edges color={layer.color} threshold={20} />
        </RoundedBox>
      ))}
    </group>
  )
}

function ProcessingCell({ spread }: { spread: React.MutableRefObject<number> }) {
  const layers = useRef<Array<THREE.Group | null>>([])

  useFrame(() => {
    layers.current.forEach((layer, index) => {
      if (!layer) return
      const restingY = (index - 1.5) * 0.2
      const openY = (1.5 - index) * 0.58
      layer.position.y = THREE.MathUtils.lerp(layer.position.y, restingY + openY * spread.current, 0.1)
    })
  })

  return (
    <group>
      {LAYERS.map((layer, index) => (
        <group key={layer.color} ref={(node) => { layers.current[index] = node }}>
          <RoundedBox args={[...layer.size]} radius={0.075} smoothness={5} castShadow receiveShadow>
            <meshPhysicalMaterial
              color={layer.color}
              emissive={layer.emissive}
              emissiveIntensity={index === 1 || index === 2 ? 0.35 : 0.15}
              roughness={0.28}
              metalness={0.2}
              clearcoat={0.78}
              clearcoatRoughness={0.22}
            />
            <Edges color={layer.color} threshold={20} />
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

function FlowParticles() {
  const particles = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!particles.current) return
    particles.current.children.forEach((particle, index) => {
      const cycle = (clock.elapsedTime * 0.32 + index / 8) % 1
      particle.position.x = -4.1 + cycle * 8.2
      const visibility = Math.sin(cycle * Math.PI)
      particle.scale.setScalar(Math.max(0.05, visibility * 0.85))
    })
  })

  return (
    <group ref={particles}>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-4 + index, -0.78, -0.35]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshBasicMaterial color={index < 4 ? '#fb7185' : '#34d399'} transparent opacity={0.72} />
        </mesh>
      ))}
    </group>
  )
}

function ProcessScene({ reducedMotion, onPhaseChange }: SceneProps) {
  const rig = useRef<THREE.Group>(null)
  const input = useRef<THREE.Group>(null)
  const outputPrimary = useRef<THREE.Group>(null)
  const outputChange = useRef<THREE.Group>(null)
  const gate = useRef<THREE.Group>(null)
  const spread = useRef(reducedMotion ? 0.72 : 0)
  const previousPhase = useRef(-1)
  const { viewport } = useThree()

  useFrame(({ clock, pointer }) => {
    const time = reducedMotion ? 5.2 : clock.elapsedTime % 13
    const phase = time < 3.2 ? 0 : time < 7 ? 1 : time < 8.6 ? 2 : 3

    if (phase !== previousPhase.current) {
      previousPhase.current = phase
      onPhaseChange(phase)
    }

    const travelIn = ease((time - 1) / 2.8)
    const validation = ease((time - 3.5) / 1.5) * (1 - ease((time - 6.7) / 0.55))
    const consumed = ease((time - 7) / 1.25)
    const created = ease((time - 8.1) / 1.35)
    const exit = ease((time - 9.1) / 2.1)

    spread.current = reducedMotion ? 0.72 : validation

    if (input.current) {
      input.current.position.x = THREE.MathUtils.lerp(-2.75, 0, travelIn)
      input.current.position.y = 0.12 + Math.sin(clock.elapsedTime * 1.1) * (reducedMotion ? 0 : 0.035)
      input.current.rotation.y = THREE.MathUtils.lerp(-0.32, 0.08, travelIn)
      const inputScale = reducedMotion ? 0.86 : 0.86 * (1 - consumed)
      input.current.scale.setScalar(Math.max(0.001, inputScale))
    }

    const placeOutput = (cell: THREE.Group | null, y: number, distance: number, delay: number) => {
      if (!cell) return
      const reveal = reducedMotion ? 0.86 : ease((created - delay) / (1 - delay)) * 0.82
      cell.scale.setScalar(Math.max(0.001, reveal))
      cell.position.x = THREE.MathUtils.lerp(0.42, distance, exit)
      cell.position.y = y
      cell.rotation.y = THREE.MathUtils.lerp(-0.08, 0.24, exit)
    }

    placeOutput(outputPrimary.current, 0.5, 2.5, 0)
    placeOutput(outputChange.current, -0.62, 2.95, 0.16)

    if (gate.current) {
      gate.current.rotation.z = clock.elapsedTime * (reducedMotion ? 0 : 0.18)
      const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 3) * 0.025 * validation
      gate.current.scale.setScalar(pulse)
    }

    if (rig.current) {
      const responsiveScale = viewport.width < 7 ? 0.76 : 1
      rig.current.scale.setScalar(responsiveScale)
      rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.055, 0.035)
      rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, -pointer.y * 0.035, 0.035)
    }
  })

  return (
    <group ref={rig} position={[0, 0.08, 0]}>
      <ambientLight intensity={0.72} />
      <directionalLight position={[-3, 5, 5]} intensity={2.4} color="#fff4ee" castShadow />
      <pointLight position={[0, 0.5, 2.5]} intensity={8} distance={5} color="#60a5fa" />
      <pointLight position={[3, 1, 2]} intensity={6} distance={4} color="#34d399" />

      <mesh position={[0, -0.79, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.2, 2.9]} />
        <meshStandardMaterial color="#100e0d" roughness={0.9} />
      </mesh>
      <gridHelper args={[8, 24, '#332e2b', '#24201e']} position={[0, -0.775, -0.18]} />

      <FlowParticles />

      <group ref={input}>
        <ProcessingCell spread={spread} />
      </group>

      <group ref={gate}>
        <mesh>
          <torusGeometry args={[1.12, 0.025, 12, 80]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.31, 0.014, 10, 80]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.42} />
        </mesh>
        <mesh position={[0, 0, -0.15]}>
          <circleGeometry args={[1.08, 80]} />
          <meshBasicMaterial color="#10203a" transparent opacity={0.075} depthWrite={false} />
        </mesh>
      </group>

      <group ref={outputPrimary}>
        <CellLayers compact />
      </group>
      <group ref={outputChange}>
        <CellLayers compact />
      </group>
    </group>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export function CellProcessScene() {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState(reducedMotion ? 1 : 0)

  return (
    <figure className="cell-process" aria-label="A CKB Cell is validated and consumed by a transaction, which creates two new output Cells">
      <div className="cell-process-heading">
        <span>Cell lifecycle</span>
        <strong>{PHASES[phase].label}</strong>
      </div>

      <div className="cell-process-canvas" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 3.7, 8.2], fov: 36 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
          shadows={{ type: THREE.PCFShadowMap }}
        >
          <ProcessScene reducedMotion={reducedMotion} onPhaseChange={setPhase} />
        </Canvas>
      </div>

      <div className="cell-process-labels" aria-hidden="true">
        <span><i className="is-input" />Live input</span>
        <span><i className="is-process" />Transaction</span>
        <span><i className="is-output" />New outputs</span>
      </div>

      <figcaption>
        <span>{PHASES[phase].detail}</span>
        <div className="cell-process-phases" aria-hidden="true">
          {PHASES.map((item, index) => <i key={item.label} className={index === phase ? 'is-active' : ''} />)}
        </div>
      </figcaption>
    </figure>
  )
}
