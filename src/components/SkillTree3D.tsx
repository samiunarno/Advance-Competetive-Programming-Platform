import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Sphere, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Node {
  id: string;
  title: string;
  position: [number, number, number];
  color: string;
}

const NODES: Node[] = [
  { id: '1', title: 'Basics', position: [0, 0, 0], color: '#10b981' },
  { id: '2', title: 'Arrays', position: [2, 1, -1], color: '#10b981' },
  { id: '3', title: 'Strings', position: [-2, 1, 1], color: '#10b981' },
  { id: '4', title: 'DP', position: [0, 3, -2], color: '#f59e0b' },
  { id: '5', title: 'Graphs', position: [3, 4, 2], color: '#f59e0b' },
  { id: '6', title: 'Trees', position: [-3, 4, -2], color: '#f59e0b' },
  { id: '7', title: 'Hard DP', position: [0, 6, 0], color: '#ef4444' },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 6], [5, 6]
];

function Connection({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  return <Line points={points} color="#333" lineWidth={1} transparent opacity={0.5} />;
}

function SkillNode({ node, onClick }: { node: Node, onClick: (id: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={node.position}>
        <Sphere
          ref={meshRef}
          args={[0.4, 32, 32]}
          onClick={() => onClick(node.id)}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
        >
          {node.title}
        </Text>
      </group>
    </Float>
  );
}

export default function SkillTree3D() {
  const handleNodeClick = (id: string) => {
    console.log('Node clicked:', id);
    // In a real app, navigate to a filtered problem list
  };

  return (
    <div className="h-[600px] w-full bg-black rounded-2xl overflow-hidden border border-white/5 relative group">
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-xl font-serif text-white mb-1">Interactive Skill Tree</h3>
        <p className="text-xs text-neutral-500 font-mono">DRAG TO ROTATE • SCROLL TO ZOOM</p>
      </div>
      
      <Canvas camera={{ position: [0, 3, 10], fov: 45 }}>
        <color attach="background" args={['#000']} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
        
        <group position={[0, -2, 0]}>
          {NODES.map((node) => (
            <SkillNode key={node.id} node={node} onClick={handleNodeClick} />
          ))}
          {CONNECTIONS.map(([startIdx, endIdx], i) => (
            <Connection
              key={i}
              start={NODES[startIdx].position}
              end={NODES[endIdx].position}
            />
          ))}
        </group>
        
        <OrbitControls 
          enablePan={false} 
          minDistance={5} 
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      <div className="absolute bottom-6 right-6 z-10 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-neutral-400 font-mono">Basic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-neutral-400 font-mono">Intermediate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-xs text-neutral-400 font-mono">Advanced</span>
        </div>
      </div>
    </div>
  );
}
