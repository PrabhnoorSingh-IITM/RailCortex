import React, { useEffect, useRef } from 'react';
import { Calculator } from 'lucide-react';
import anime from 'animejs';
import useAppStore from '../../store/useAppStore';

export default function MilpOverlay() {
  const { isSimulating } = useAppStore();
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
      className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md border border-primary/50 p-6 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] z-50 flex items-center space-x-6 opacity-0"
    >
      <div className="bg-primary/20 p-4 rounded-full border border-primary/30">
        <Calculator className="h-8 w-8 text-primary" />
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-white flex items-center">
          Optimizing MILP Objective Function
          <span className="flex space-x-1 ml-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </span>
        </h3>
        <p className="text-slate-400 mt-1">Reallocating platforms... Processing 14,000 permutations.</p>
      </div>
    </div>
  );
}
