import { ParticleConfig } from '../types';

export const generateAEScript = (config: ParticleConfig): string => {
  const compName = "AE_Particle_Ring_" + Math.floor(Math.random() * 1000);
  
  // Convert Hex to AE Color Array [r, g, b, a]
  const hexToAe = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `[${r},${g},${b},1]`;
  };

  return `
(function() {
    app.beginUndoGroup("Create AE Particle Ring");

    var compWidth = 1920;
    var compHeight = 1080;
    var compDuration = 10;
    var compFrameRate = 30;

    // Create Composition
    var comp = app.project.items.addComp("${compName}", compWidth, compHeight, 1, compDuration, compFrameRate);
    comp.openInViewer();

    // =========================================================
    // 1. UI Control Layer (Null)
    // =========================================================
    var ctrl = comp.layers.addNull();
    ctrl.name = "Effect Controls (UI)";
    ctrl.label = 11; // Orange
    ctrl.guideLayer = true;

    function addSlider(name, val) {
        var s = ctrl.Effects.addProperty("ADBE Slider Control");
        s.name = name;
        s.property(1).setValue(val);
    }
    
    function addColor(name, hexArr) {
        var c = ctrl.Effects.addProperty("ADBE Color Control");
        c.name = name;
        c.property(1).setValue(hexArr);
    }

    // --- 1. 圆形 (Circle) ---
    addSlider("1-Radius (半径)", ${config.radius * 20}); // Scale up for AE pixels
    addSlider("1-Thickness (圆环厚度)", ${config.thickness * 10});

    // --- 2. 分形杂色 (Fractal Noise) ---
    // Note: In CC Particle World, we simulate noise via Resistance/Extra Angle or Floor
    addSlider("2-Noise Scale (杂色缩放)", ${config.noiseStrength * 10});
    addSlider("2-Noise Evolution (演化速度)", ${config.noiseSpeed});

    // --- 3. 色光 (Color Lights) ---
    addColor("3-Color A (主色)", ${hexToAe(config.color)});
    addColor("3-Color B (辅色)", ${hexToAe(config.color2)});

    // --- 4. CC P粒子-摄像机 (Physics & Camera) ---
    addSlider("4-Birth Rate (粒子数量)", ${config.count / 1000}); 
    addSlider("4-Velocity (速度)", ${config.speed});
    addSlider("4-Gravity (重力)", 0);
    addSlider("4-Size (粒子大小)", ${config.size});

    // --- 5. 发光-Deep Glow ---
    addSlider("5-Glow Radius (发光半径)", ${config.glowRadius * 50});
    addSlider("5-Glow Intensity (发光强度)", ${config.glowIntensity});
    addSlider("5-Threshold (阈值)", ${config.glowThreshold * 100});


    // =========================================================
    // Create Camera
    // =========================================================
    var camera = comp.layers.addCamera("Camera 1", [compWidth/2, compHeight/2]);
    camera.property("Position").setValue([compWidth/2, compHeight/2, -${config.cameraZoom * 100}]);


    // =========================================================
    // Create Particle Layer
    // =========================================================
    var solid = comp.layers.addSolid([0,0,0], "Particle Ring", compWidth, compHeight, 1);
    
    // Check if CC Particle World exists (Standard)
    var pw = solid.Effects.addProperty("CC Particle World");
    
    // --- Link Parameters ---
    
    // 1. Circle Geometry
    // In PW, Radius X/Y corresponds to ring size. We map X and Z to Radius, Y to thickness
    var rExpr = "thisComp.layer('Effect Controls (UI)').effect('1-Radius (半径)')('Slider') / 100";
    pw.property("Producer").property("Radius X").expression = rExpr;
    pw.property("Producer").property("Radius Z").expression = rExpr;
    pw.property("Producer").property("Radius Y").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('1-Thickness (圆环厚度)')('Slider') / 100";
    
    // 4. Physics
    pw.property("Physics").property("Animation").setValue(4); // Vortex
    pw.property("Physics").property("Velocity").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('4-Velocity (速度)')('Slider')";
    pw.property("Physics").property("Gravity").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('4-Gravity (重力)')('Slider')";
    pw.property("Birth Rate").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('4-Birth Rate (粒子数量)')('Slider')";

    // Particles
    pw.property("Particle").property("Particle Type").setValue(1); // Faded Sphere
    pw.property("Particle").property("Birth Size").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('4-Size (粒子大小)')('Slider') / 10";
    pw.property("Particle").property("Death Size").expression = "0";
    
    // 3. Colors
    pw.property("Particle").property("Birth Color").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('3-Color A (主色)')('Color')";
    pw.property("Particle").property("Death Color").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('3-Color B (辅色)')('Color')";

    // 2. Fractal Noise Simulation (Using Extra Angle or Resistance to create chaos)
    pw.property("Physics").property("Extra Angle").expression = 
        "time * thisComp.layer('Effect Controls (UI)').effect('2-Noise Evolution (演化速度)')('Slider') * 10";
    pw.property("Physics").property("Resistance").expression = 
        "thisComp.layer('Effect Controls (UI)').effect('2-Noise Scale (杂色缩放)')('Slider') / 10";


    // =========================================================
    // 5. Deep Glow (Try/Catch Fallback)
    // =========================================================
    try {
        var dg = solid.Effects.addProperty("Deep Glow");
        if (dg) {
            dg.property("Radius").expression = 
                "thisComp.layer('Effect Controls (UI)').effect('5-Glow Radius (发光半径)')('Slider')";
            dg.property("Exposure").expression = 
                "thisComp.layer('Effect Controls (UI)').effect('5-Glow Intensity (发光强度)')('Slider')";
            dg.property("Threshold").expression = 
                "thisComp.layer('Effect Controls (UI)').effect('5-Threshold (阈值)')('Slider')";
        }
    } catch(err) {
        // Fallback to Standard Glow if Deep Glow is missing
        var glow = solid.Effects.addProperty("ADBE Glo2");
        glow.name = "Standard Glow (Deep Glow Missing)";
        glow.property("Glow Radius").expression = 
             "thisComp.layer('Effect Controls (UI)').effect('5-Glow Radius (发光半径)')('Slider')";
        glow.property("Glow Intensity").expression = 
             "thisComp.layer('Effect Controls (UI)').effect('5-Glow Intensity (发光强度)')('Slider')";
        glow.property("Glow Threshold").expression = 
             "thisComp.layer('Effect Controls (UI)').effect('5-Threshold (阈值)')('Slider')";
    }

    app.endUndoGroup();
})();
`;
};
