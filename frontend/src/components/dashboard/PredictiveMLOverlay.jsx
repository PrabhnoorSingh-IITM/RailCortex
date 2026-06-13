import React, { useEffect, useRef } from 'react';
import { BrainCircuit } from 'lucide-react';
import anime from 'animejs';
import useAppStore from '../../store/useAppStore';

export default function PredictiveMLOverlay() {
  const { isSimulating, trains } = useAppStore();
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isSimulating && overlayRef.current) {
      anime({
        targets: overlayRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        scale: [0.95, 1],
        duration: 400,
        easing: 'easeOutExpo'
      });
    }
  }, [isSimulating]);

  if (!isSimulating) return null;

  return (
    <div 
      ref={overlayRef}
      className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-slate-900/60 backdrop-blur-3xl border border-primary/40 p-6 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.4)] z-50 flex items-center space-x-6 opacity-0 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
    >
      {/* Outer Glow Effect */}
      <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none rounded-2xl"></div>
      
      <div className="bg-primary/20 p-4 rounded-full border border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] relative">
        <BrainCircuit className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,1)]" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white flex items-center">
          Predictive ML Inference Active
          <span className="flex space-x-1 ml-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
          </span>
        </h3>
        <p className="text-slate-400 mt-1">Adjusting ETAs and routing for <span className="text-primary font-bold">{trains.length}</span> active consists...</p>
      </div>
    </div>
  );
}
