import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Volcano3DSceneProps {
  className?: string;
  showAshCloud?: boolean;
  eruptionIntensity?: number;
}

function VolcanoTerrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(3, 5, 64, 32, true);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = (Math.sin(x * 2) * Math.cos(z * 2) * 0.15 + Math.random() * 0.05) * (5 - y) * 0.2;
      positions.setX(i, x + noise);
      positions.setZ(i, z + noise);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, -0.5, 0]}>
      <meshStandardMaterial
        color="#2d1810"
        roughness={0.9}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}

function VolcanoCrater() {
  return (
    <mesh position={[0, 4.3, 0]}>
      <cylinderGeometry args={[0.6, 0.8, 0.4, 32]} />
      <meshStandardMaterial color="#1a0a05" roughness={1} />
    </mesh>
  );
}

function LavaPool() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <mesh position={[0, 4.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.55, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ff4500"
        emissive="#ff6600"
        emissiveIntensity={1.5}
        roughness={0.2}
      />
    </mesh>
  );
}

interface EruptionParticlesProps {
  intensity?: number;
}

function EruptionParticles({ intensity = 1 }: EruptionParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 800;

  const { positions, velocities, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = 4.5 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0.03 + Math.random() * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = Math.random() * 0.08 + 0.03;
    }

    return { positions, velocities, sizes };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocities[i * 3] * intensity;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * intensity;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * intensity;

      velocities[i * 3] += (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.001;

      if (posArr[i * 3 + 1] > 12) {
        posArr[i * 3] = (Math.random() - 0.5) * 0.8;
        posArr[i * 3 + 1] = 4.5;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = 0.03 + Math.random() * 0.05;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors={false}
        color="#ff8844"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface AshCloudProps {
  visible?: boolean;
}

function AshCloud({ visible = true }: AshCloudProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  if (!visible) return null;

  const ashParticles = useMemo(() => {
    const particles: { pos: [number, number, number]; scale: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 4;
      const height = 6 + Math.random() * 5;
      particles.push({
        pos: [
          Math.cos(theta) * radius,
          height,
          Math.sin(theta) * radius,
        ],
        scale: 0.5 + Math.random() * 1.5,
        opacity: 0.08 + Math.random() * 0.12,
      });
    }
    return particles;
  }, []);

  return (
    <group ref={groupRef}>
      {ashParticles.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#4a4a4a"
            transparent
            opacity={p.opacity}
            roughness={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
      <circleGeometry args={[20, 64]} />
      <meshStandardMaterial color="#0d0503" roughness={1} />
    </mesh>
  );
}

function Scene({ intensity, showAshCloud }: { intensity: number; showAshCloud: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a2a4a" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.4}
        color="#aaccff"
      />
      <pointLight
        position={[0, 5, 0]}
        color="#ff6633"
        intensity={2 * intensity}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[0, 8, 0]}
        color="#ffaa44"
        intensity={1 * intensity}
        distance={10}
        decay={2}
      />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <Ground />
      <VolcanoTerrain />
      <VolcanoCrater />
      <LavaPool />
      <EruptionParticles intensity={intensity} />
      <AshCloud visible={showAshCloud} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function Volcano3DScene({
  className,
  showAshCloud = true,
  eruptionIntensity = 1,
}: Volcano3DSceneProps) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="section-title !mb-0">3D火山喷发场景</h3>
          <div className="flex items-center gap-2 text-xs text-deep-space-400">
            <span className="w-2 h-2 rounded-full bg-lava-500 animate-pulse" />
            <span>实时渲染</span>
          </div>
        </div>
      </div>
      <div className="h-[420px] w-full">
        <Canvas
          camera={{ position: [8, 6, 8], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'linear-gradient(to bottom, #03070F 0%, #0A1628 50%, #060E1A 100%)' }}
        >
          <fog attach="fog" args={['#03070F', 15, 40]} />
          <Scene intensity={eruptionIntensity} showAshCloud={showAshCloud} />
        </Canvas>
      </div>
      <div className="px-5 py-3 border-t border-deep-space-700/50">
        <div className="flex items-center justify-between text-xs text-deep-space-400">
          <span>🖱️ 拖拽旋转 · 滚轮缩放 · 右键平移</span>
          <span className="font-mono">喷发强度: <span className="text-lava-400">{(eruptionIntensity * 100).toFixed(0)}%</span></span>
        </div>
      </div>
    </div>
  );
}
