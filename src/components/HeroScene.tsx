import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';
import { Float, Stars, Text3D, Center } from '@react-three/drei';

function FloatingCode({ position, text, color }: { position: [number, number, number], text: string, color: string }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <Center>
          <Text3D
            font="/fonts/helvetiker_regular.typeface.json"
            size={0.5}
            height={0.1}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={5}
          >
            {text}
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </Text3D>
        </Center>
      </group>
    </Float>
  );
}

function Grid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#0f172a" transparent opacity={0.8} />
      <gridHelper args={[50, 50, 0x10b981, 0x1e293b]} position={[0, 0.01, 0]} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <FloatingCode position={[-3, 1, 0]} text="<Code />" color="#10b981" />
        <FloatingCode position={[3, -1, -2]} text="{ Solve }" color="#3b82f6" />
        <FloatingCode position={[0, 2, -4]} text="XiaoXuan" color="#f59e0b" />
        
        <Grid />
        
        <fog attach="fog" args={['#020617', 5, 20]} />
      </Canvas>
    </div>
  );
}
