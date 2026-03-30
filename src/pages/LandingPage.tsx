import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Globe, Cpu, Zap, Terminal, Trophy, ChevronDown, Lock } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera, Text, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLanguage } from '../context/LanguageContext';

function CodeBlock({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Editor Window */}
      <RoundedBox args={[3, 4, 0.2]} radius={0.1}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </RoundedBox>
      
      {/* Code Lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.8, 1.2 - i * 0.4, 0.11]}>
          <planeGeometry args={[1.5 + Math.random(), 0.15]} />
          <meshBasicMaterial color={i === 4 ? "#10b981" : "#333"} />
        </mesh>
      ))}
      
      {/* Cursor */}
      <mesh position={[-1.2, 1.2 - 4 * 0.4, 0.12]}>
        <planeGeometry args={[0.1, 0.2]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
}

function AppWindow({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = -0.2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <RoundedBox ref={mesh} args={[4, 3, 0.2]} radius={0.1}>
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.1}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color="#ffffff"
            background={new THREE.Color("#000000")}
          />
        </RoundedBox>
        {/* UI Elements inside App */}
        <group position={[0, 0, 0.15]} rotation={[0, -0.2, 0]}>
           <mesh position={[0, 0.8, 0]}>
             <planeGeometry args={[3.5, 0.5]} />
             <meshBasicMaterial color="#10b981" transparent opacity={0.2} />
           </mesh>
           <mesh position={[-1, -0.2, 0]}>
             <planeGeometry args={[1.2, 1.5]} />
             <meshBasicMaterial color="#333" transparent opacity={0.5} />
           </mesh>
           <mesh position={[0.8, -0.2, 0]}>
             <planeGeometry args={[1.8, 1.5]} />
             <meshBasicMaterial color="#333" transparent opacity={0.3} />
           </mesh>
        </group>
      </Float>
    </group>
  );
}

function DataStream() {
  const count = 30;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      t: Math.random() * 100,
      speed: 0.05 + Math.random() * 0.05,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;

    particles.forEach((p, i) => {
      p.t += p.speed;
      // Move from left (-4) to right (4)
      const x = -4 + (p.t % 8); 
      // Sine wave path
      const y = Math.sin(x * 0.5 + p.offset) * 0.5;
      const z = Math.cos(x * 0.5 + p.offset) * 0.5;
      
      // Scale based on position (fade in/out)
      const s = Math.sin((x + 4) / 8 * Math.PI) * 0.15;

      dummy.position.set(x, y, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(p.t, p.t, p.t);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#10b981" />
    </instancedMesh>
  );
}

function ResponsiveSceneContent() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 10;
  
  // Adjust scale and position based on screen size
  const scale = isMobile ? 0.5 : 1;
  const position: [number, number, number] = isMobile ? [0, 3, -2] : [4, 0, 0];
  
  return (
    <group position={position} rotation={[0, -0.2, 0]} scale={scale}>
      <CodeBlock position={[-4, 0, 0]} />
      <DataStream />
      <AppWindow position={[4, 0, 0]} />
    </group>
  );
}

function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        <ambientLight intensity={0.5} />
        <pointLight position={[-10, 10, 10]} intensity={1} color="#10b981" />
        <pointLight position={[10, -10, 10]} intensity={1} color="#3b82f6" />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />
        <ResponsiveSceneContent />
      </Canvas>
    </div>
  );
}

const TextReveal = ({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) => {
  const words = text.split(" ");
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mr-[0.2em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, index }: { title: string, desc: string, icon: any, index: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      className="group relative border border-white/10 bg-neutral-900/50 p-8 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">
        <div className="w-12 h-12 bg-neutral-800/50 rounded-lg flex items-center justify-center mb-6 border border-white/5 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
          <Icon className="w-6 h-6 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
        </div>
        <h3 className="text-xl font-serif mb-3 text-white">{title}</h3>
        <p className="text-neutral-400 leading-relaxed font-light">{desc}</p>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 border-b border-white/5 overflow-hidden">
        <HeroScene />
        
        <div className="relative z-10 max-w-7xl w-full mx-auto pointer-events-none">
          <motion.div style={{ y, opacity }} className="relative grid lg:grid-cols-2">
            <div className="pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-[13vw] lg:text-[10vw] leading-[0.8] font-serif tracking-tighter mb-8 mix-blend-difference text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">
                  XiaoXuan
                </h1>
              </motion.div>
              
              <div className="flex flex-col gap-12 border-t border-white/10 pt-8 max-w-xl">
                <div>
                  <TextReveal 
                    text={t('home.hero_subtitle')}
                    className="text-xl md:text-2xl font-light text-neutral-400 leading-relaxed"
                    delay={0.5}
                  />
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex gap-6">
                    <Link 
                      to="/register" 
                      className="group relative px-8 py-4 bg-white text-black font-medium text-lg rounded-full overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative flex items-center gap-2">
                        {t('home.start_coding')} <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 text-neutral-500 text-sm font-mono border-l-2 border-emerald-500/50 pl-4">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>
                      {t('home.exclusive_to')} <span className="text-white">XiaoXuan</span>. 
                      <br/>
                      <span className="text-xs opacity-70">{t('home.permission_required')}</span>
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
            {/* Right side is reserved for the 3D scene visibility */}
            <div className="hidden lg:block"></div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500 text-sm font-mono uppercase tracking-widest pointer-events-none"
        >
          <span>Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* PHILOSOPHY / ABOUT */}
      <section className="py-40 px-6 md:px-12 lg:px-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-start relative z-10">
          <div className="sticky top-32">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-500 mb-6 block">01 — {t('home.features_title')}</span>
            <h2 className="text-5xl md:text-7xl font-serif leading-[1.1]">
              {t('home.code_philosophy_1')}<br/>
              <span className="text-neutral-600">{t('home.code_philosophy_2')}</span>
            </h2>
          </div>
          <div className="space-y-16 pt-4">
            <p className="text-xl text-neutral-400 font-light leading-relaxed">
              {t('home.hero_subtitle')}
            </p>
            
            <div className="grid grid-cols-2 gap-12 border-t border-white/10 pt-12">
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl font-serif mb-2 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent"
                >
                  1.2M+
                </motion.div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-mono">{t('profile.problems_solved')}</div>
              </div>
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl font-serif mb-2 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent"
                >
                  10k+
                </motion.div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-mono">{t('home.feature_3_title')}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {['C++', 'Python', 'Java', 'Rust', 'Go', 'TypeScript'].map((lang, i) => (
                <motion.span 
                  key={lang}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-2 rounded-full border border-white/10 text-neutral-400 text-sm hover:border-emerald-500/50 hover:text-emerald-400 transition-colors cursor-default"
                >
                  {lang}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-40 px-6 md:px-12 lg:px-24 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-500 mb-6 block">02 — {t('home.the_platform')}</span>
              <h2 className="text-4xl md:text-5xl font-serif max-w-2xl">
                {t('home.features_title')} <br/>
                <span className="text-neutral-600">{t('home.nothing_you_dont')}</span>
              </h2>
            </div>
            <Link to="/register" className="text-white border-b border-white pb-1 hover:text-emerald-400 hover:border-emerald-400 transition-colors flex items-center gap-2">
              {t('home.view_problems')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              index={0}
              icon={Terminal}
              title={t('home.feature_1_title')}
              desc={t('home.feature_1_desc')}
            />
            <FeatureCard 
              index={1}
              icon={Zap}
              title={t('home.feature_2_title')}
              desc={t('home.feature_2_desc')}
            />
            <FeatureCard 
              index={2}
              icon={Trophy}
              title={t('home.feature_3_title')}
              desc={t('home.feature_3_desc')}
            />
            <FeatureCard 
              index={3}
              icon={Globe}
              title={t('home.multi_language')}
              desc={t('home.multi_language_desc')}
            />
            <FeatureCard 
              index={4}
              icon={Cpu}
              title={t('home.performance_analysis')}
              desc={t('home.performance_analysis_desc')}
            />
            <FeatureCard 
              index={5}
              icon={Code2}
              title={t('home.problem_archive')}
              desc={t('home.problem_archive_desc')}
            />
          </div>
        </div>
      </section>

      {/* SELECTED WORKS / SHOWCASE */}
      <section className="py-40 px-6 md:px-12 lg:px-24 border-t border-white/5">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-500 mb-24 block">03 — {t('home.interface')}</span>
        
        <div className="space-y-40">
          {/* Feature 1 */}
          <div className="group relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="order-2 md:order-1"
              >
                <div className="aspect-[16/10] bg-neutral-900 rounded-lg overflow-hidden border border-white/10 relative group-hover:border-emerald-500/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
                  {/* Abstract UI Representation */}
                  <div className="absolute inset-4 border border-white/5 rounded bg-[#0a0a0a] p-4 font-mono text-xs text-neutral-500">
                    <div className="flex gap-2 mb-4 border-b border-white/5 pb-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex"><span className="text-purple-400 w-8">01</span> <span className="text-blue-400">import</span> std.io;</div>
                      <div className="flex"><span className="text-neutral-700 w-8">02</span> </div>
                      <div className="flex"><span className="text-purple-400 w-8">03</span> <span className="text-blue-400">fn</span> <span className="text-yellow-400">main</span>() {'{'}</div>
                      <div className="flex"><span className="text-neutral-700 w-8">04</span>   <span className="text-emerald-400">// The journey begins here</span></div>
                      <div className="flex"><span className="text-neutral-700 w-8">05</span>   println!(<span className="text-green-400">"Hello XiaoXuan"</span>);</div>
                      <div className="flex"><span className="text-purple-400 w-8">06</span> {'}'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="order-1 md:order-2"
              >
                <h3 className="text-4xl font-serif mb-6">{t('home.ide_title')}</h3>
                <p className="text-neutral-400 font-light mb-8 leading-relaxed text-lg">
                  {t('home.ide_desc')}
                </p>
                <ul className="space-y-4 text-sm text-neutral-300 font-mono">
                  <li className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <span className="text-emerald-500">01</span> <span>{t('home.monaco_engine')}</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <span className="text-emerald-500">02</span> <span>{t('home.keybindings')}</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <span className="text-emerald-500">03</span> <span>{t('home.custom_themes')}</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER / CTA */}
      <footer className="py-40 px-6 md:px-12 lg:px-24 border-t border-white/10 bg-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-neutral-950 to-neutral-950 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-9xl font-serif mb-16 tracking-tighter"
          >
            {t('home.start_coding')}
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex flex-col md:flex-row items-center justify-center gap-8"
          >
            <Link 
              to="/register" 
              className="px-12 py-5 bg-white text-black font-medium text-lg hover:bg-neutral-200 transition-colors rounded-full shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.5)]"
            >
              {t('auth.signup_button')}
            </Link>
            <Link 
              to="/dashboard" 
              className="px-12 py-5 border border-white/20 text-white font-medium text-lg hover:bg-white/5 transition-colors rounded-full backdrop-blur-sm"
            >
              {t('home.view_problems')}
            </Link>
          </motion.div>
          
          <div className="mt-40 flex flex-col md:flex-row justify-between items-end text-sm text-neutral-500 font-mono uppercase tracking-widest border-t border-white/5 pt-8">
            <div className="mb-4 md:mb-0">© 2024 XiaoXuan</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
