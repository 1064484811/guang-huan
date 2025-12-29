import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleRing } from './components/ParticleRing';
import { EffectControls } from './components/EffectControls';
import { ParticleConfig } from './types';

function Scene({ config }: { config: ParticleConfig }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      
      {/* 4. Camera Control (Zoom) */}
      <PerspectiveCamera makeDefault position={[0, 6, config.cameraZoom]} fov={50} />
      
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={50}
        autoRotate={false}
      />

      <ambientLight intensity={0.5} />
      
      <ParticleRing config={config} />

      {/* 5. Deep Glow Simulation */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={config.glowThreshold} 
          mipmapBlur 
          intensity={config.glowIntensity} 
          radius={config.glowRadius} 
          levels={9}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    // 1. Circle
    radius: 4.5,
    thickness: 1.0,
    
    // 2. Fractal Noise
    noiseStrength: 0.5,
    noiseSpeed: 1.0,

    // 3. Color
    color: '#a855f7', // Purple
    color2: '#3b82f6', // Blue
    
    // 4. CC P World
    count: 5000,
    size: 0.15,
    speed: 1.5,
    cameraZoom: 14,
    
    // 5. Deep Glow
    glowIntensity: 1.5,
    glowRadius: 0.6,
    glowThreshold: 0.2
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-purple-500 font-mono">
          Loading Particles...
        </div>
      }>
        <Canvas 
          ref={canvasRef}
          gl={{ antialias: false, alpha: false, stencil: false, depth: true, preserveDrawingBuffer: true }}
        >
          <Scene config={config} />
        </Canvas>
      </Suspense>

      <EffectControls config={config} setConfig={setConfig} canvasRef={canvasRef} />
    </div>
  );
};

export default App;
