import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleConfig } from '../types';

interface ParticleRingProps {
  config: ParticleConfig;
}

// Helper: Basic texture
const getTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
};

export const ParticleRing: React.FC<ParticleRingProps> = ({ config }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => getTexture(), []);

  // Geometry Generation
  const geometry = useMemo(() => {
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);
    const randoms = new Float32Array(config.count * 3); // Store random offsets for noise calculation

    const colorA = new THREE.Color(config.color);
    const colorB = new THREE.Color(config.color2);

    for (let i = 0; i < config.count; i++) {
      // 1. Circle Math
      const angle = Math.random() * Math.PI * 2;
      const rBase = config.radius;
      // Thickness spread
      const r = rBase + (Math.random() - 0.5) * config.thickness;
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * (config.thickness * 0.4);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // 3. Colorama (Mix)
      // Mix based on angle + random to simulate color cycling
      const mixFactor = Math.random();
      const finalColor = colorA.clone().lerp(colorB, mixFactor);
      
      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;

      // Storing randoms for animation
      randoms[i * 3] = Math.random(); // Phase
      randoms[i * 3 + 1] = Math.random(); // Speed var
      randoms[i * 3 + 2] = Math.random(); // Amplitude var
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
    return geo;
  }, [config.count, config.radius, config.thickness, config.color, config.color2]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // 4. CC Particle World Camera/Physics Simulation
    
    // Base Rotation (Vortex)
    pointsRef.current.rotation.y += config.speed * 0.002;
    
    // 2. Fractal Noise Simulation
    // We can't easily modify buffer attributes every frame efficiently for 10k particles without a shader.
    // So we move the whole object and scale it slightly to simulate "breathing" or noise chaos.
    
    const time = state.clock.elapsedTime * config.noiseSpeed;
    
    // Simulate "Fractal Noise" affecting the structure by wobbling the rings
    pointsRef.current.rotation.x = Math.sin(time * 0.5) * (config.noiseStrength * 0.1);
    pointsRef.current.rotation.z = Math.cos(time * 0.3) * (config.noiseStrength * 0.1);
    
    // Scale pulse to mimic noise displacing particles
    const scaleNoise = 1 + Math.sin(time * 2) * (config.noiseStrength * 0.02);
    pointsRef.current.scale.set(scaleNoise, scaleNoise, scaleNoise);

  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={texture}
        vertexColors
        size={config.size}
        sizeAttenuation={true}
        transparent={true}
        alphaTest={0.001}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
