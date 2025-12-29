import React, { useRef, useState } from 'react';
import { ParticleConfig } from '../types';
import { Settings2, Circle, Zap, Palette, Camera, Sun, Download, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { generateAEScript } from '../utils/aescript';

interface EffectControlsProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// Reusable Slider Component
const ControlGroup = ({ title, icon: Icon, children, onReset }: any) => (
  <div className="mb-6 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
    <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
      <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
        <Icon size={16} />
        {title}
      </div>
      {onReset && (
        <button onClick={onReset} className="text-gray-600 hover:text-red-400 transition-colors" title="Reset Group">
          <Trash2 size={12} />
        </button>
      )}
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const Slider = ({ label, value, min, max, step, onChange }: any) => (
  <div>
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>{label}</span>
      <span className="font-mono text-purple-300">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
    />
  </div>
);

export const EffectControls: React.FC<EffectControlsProps> = ({ config, setConfig, canvasRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const update = (key: keyof ParticleConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadScript = () => {
    const scriptContent = generateAEScript(config);
    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Particle_Ring_v1.jsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'particle_snapshot.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const toggleRecording = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    if (isRecording) {
      // Stop Recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start Recording
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'particle_sequence.webm';
        a.click();
      };

      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-black/90 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Settings2 className="text-purple-500" />
        <div>
          <h2 className="text-sm font-bold text-white">AE 脚本生成器</h2>
          <p className="text-[10px] text-gray-500">Params Control & Export</p>
        </div>
      </div>

      {/* Scrollable Controls */}
      <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
        
        {/* 1. 圆形 (Circle) */}
        <ControlGroup title="1-圆形 (Circle)" icon={Circle}>
          <Slider label="半径 (Radius)" value={config.radius} min={1} max={10} step={0.1} onChange={(v: number) => update('radius', v)} />
          <Slider label="厚度 (Thickness)" value={config.thickness} min={0.1} max={5} step={0.1} onChange={(v: number) => update('thickness', v)} />
        </ControlGroup>

        {/* 2. 分形杂色 (Fractal Noise) */}
        <ControlGroup title="2-分形杂色 (Fractal Noise)" icon={Sun}>
           <Slider label="杂色强度 (Influence)" value={config.noiseStrength} min={0} max={2} step={0.1} onChange={(v: number) => update('noiseStrength', v)} />
           <Slider label="演化速度 (Evolution)" value={config.noiseSpeed} min={0} max={5} step={0.1} onChange={(v: number) => update('noiseSpeed', v)} />
        </ControlGroup>

        {/* 3. 色光 (Colorama) */}
        <ControlGroup title="3-色光 (Colorama)" icon={Palette}>
          <div className="flex gap-2 mb-2">
             <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">主色 A</label>
                <input type="color" value={config.color} onChange={(e) => update('color', e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
             </div>
             <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">辅色 B</label>
                <input type="color" value={config.color2} onChange={(e) => update('color2', e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
             </div>
          </div>
        </ControlGroup>

        {/* 4. CC P粒子 & 摄像机 */}
        <ControlGroup title="4-CC P粒子-摄像机" icon={Camera}>
           <Slider label="粒子数量 (Birth Rate)" value={config.count} min={1000} max={20000} step={500} onChange={(v: number) => update('count', v)} />
           <Slider label="粒子大小 (Size)" value={config.size} min={0.01} max={0.5} step={0.01} onChange={(v: number) => update('size', v)} />
           <Slider label="速度 (Velocity)" value={config.speed} min={0} max={5} step={0.1} onChange={(v: number) => update('speed', v)} />
           <Slider label="摄像机距离 (Zoom)" value={config.cameraZoom} min={5} max={30} step={1} onChange={(v: number) => update('cameraZoom', v)} />
        </ControlGroup>

        {/* 5. Deep Glow */}
        <ControlGroup title="5-发光 (Deep Glow)" icon={Zap}>
           <Slider label="发光半径 (Radius)" value={config.glowRadius} min={0} max={2} step={0.1} onChange={(v: number) => update('glowRadius', v)} />
           <Slider label="发光强度 (Exposure)" value={config.glowIntensity} min={0} max={3} step={0.1} onChange={(v: number) => update('glowIntensity', v)} />
           <Slider label="阈值 (Threshold)" value={config.glowThreshold} min={0} max={1} step={0.05} onChange={(v: number) => update('glowThreshold', v)} />
        </ControlGroup>

      </div>

      {/* Footer / Export Actions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/80 space-y-2">
        
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={handleSnapshot}
                className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded transition-all"
            >
                <ImageIcon size={14} /> 截图 (PNG)
            </button>
            <button 
                onClick={toggleRecording}
                className={`flex items-center justify-center gap-1 text-white text-xs py-2 rounded transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                <Video size={14} /> {isRecording ? '停止录制' : '录制序列 (WebM)'}
            </button>
        </div>

        <button 
          onClick={handleDownloadScript}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95"
        >
          <Download size={18} />
          下载 AE 脚本 (.jsx)
        </button>
      </div>
    </div>
  );
};
