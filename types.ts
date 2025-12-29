import React from 'react';

export interface ParticleConfig {
  // 1. Circle
  radius: number;
  thickness: number; // Spread
  
  // 2. Fractal Noise (Simulation)
  noiseStrength: number;
  noiseSpeed: number;
  
  // 3. Color
  color: string;
  color2: string; // Secondary color for gradient
  
  // 4. CC P World / Camera
  count: number;
  size: number;
  speed: number; // Velocity
  cameraZoom: number;
  
  // 5. Deep Glow
  glowIntensity: number;
  glowRadius: number;
  glowThreshold: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      points: any;
      pointsMaterial: any;
      color: any;
    }
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        ambientLight: any;
        points: any;
        pointsMaterial: any;
        color: any;
      }
    }
  }
}
