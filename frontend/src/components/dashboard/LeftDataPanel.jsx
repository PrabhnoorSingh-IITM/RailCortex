import React, { useState, useEffect, useRef } from 'react';
import { Activity, ServerCrash, CloudSun, CloudRain } from 'lucide-react';
import anime from 'animejs';
import useAppStore from '../../store/useAppStore';

// Helper component for typing effect
const TypewriterLine = ({ text, delay, className }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let timeout;
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
        timeout = setTimeout(typeWriter, 30); // typing speed
      }
    };
    
    // Initial delay before starting this line
    const startTimeout = setTimeout(typeWriter, delay);
    
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, delay]);

  return <p className={className}>{displayedText}</p>;
};

export default function LeftDataPanel() {
  const { isEmergencyMode, isSimulating, trains, dispatchPlan } = useAppStore();
  const normalRef = useRef(null);
  const emergencyRef = useRef(null);

  useEffect(() => {
    if (!isEmergencyMode && normalRef.current) {
      anime({
        targets: normalRef.current,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 300,
        easing: 'easeOutQuad'
      });
    } else if (isEmergencyMode && emergencyRef.current) {
      anime({
        targets: emergencyRef.current,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  }, [isEmergencyMode]);

  return (
    <div className="w-[25%] h-[90vh] bg-surface/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 relative shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {!isEmergencyMode ? (
        <div
          ref={normalRef}
          className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto opacity-0"
        >
          {/* Header */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
            <Activity className="h-5 w-5 text-emerald" />
            <h2 className="text-emerald font-bold tracking-wide uppercase text-sm">Network Status: Optimal</h2>
          </div>

          {/* Weather Widget */}
          <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl flex items-center justify-between shrink-0">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Local Weather</p>
              <p className="text-lg font-bold text-white">
                {isSimulating ? 'Heavy Rain Warning' : 'Clear Skies'}
              </p>
            </div>
            {isSimulating ? (
              <CloudRain className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <CloudSun className="h-8 w-8 text-slate-300" />
            )}
          </div>

          {/* Train Tracking Cards */}
          <div className="space-y-4">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Active Consists</h3>
            
            {trains.map((train) => (
              <div key={train.train_id || train.id} className="bg-slate-800/50 border border-white/5 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white font-mono">{train.train_id || train.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${(train.delay_offset || 0) > 0 ? 'text-warning bg-warning/10' : 'text-emerald bg-emerald/10'}`}>
                    {(train.delay_offset || 0) > 0 ? `+${Math.round(train.delay_offset)}m DELAY` : 'ON TIME'}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Speed:</span><span className="text-slate-200">{Math.round(train.speed_kmh || 0)} km/h</span></div>
                  <div className="flex justify-between"><span>Platform:</span><span className="text-slate-200">{train.platform || 'Transit'}</span></div>
                  <div className="flex justify-between"><span>Status:</span><span className="text-slate-200">{(train.delay_offset || 0) > 0 ? 'Delayed' : 'En Route'}</span></div>
                </div>
              </div>
            ))}
            {trains.length === 0 && (
              <p className="text-sm text-slate-500 italic">Awaiting telemetry...</p>
            )}
          </div>
          
        </div>
      ) : (
        <div
          ref={emergencyRef}
          className="flex-1 flex flex-col bg-red-950/20 opacity-0"
        >
          {/* Header */}
          <div className="p-6 border-b border-danger/20 bg-danger/10 flex items-center space-x-3 shrink-0">
            <ServerCrash className="h-5 w-5 text-danger animate-pulse" />
            <h2 className="text-danger font-bold tracking-wide uppercase text-sm animate-pulse">System Events: CRITICAL FAILURE</h2>
          </div>

          {/* Terminal Content */}
          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto">
            {dispatchPlan ? (
              <div className="space-y-4">
                <TypewriterLine 
                  text={`> [Hardware Edge]: Emergency detected on ${dispatchPlan.train_id}.`} 
                  delay={100} 
                  className="text-danger font-bold" 
                />
                <TypewriterLine 
                  text={`> [Incident Analyzer]: ${dispatchPlan.reasoning}`} 
                  delay={1500} 
                  className="text-orange" 
                />
                <TypewriterLine 
                  text={`> [Medical Coordinator]: Found ${dispatchPlan.hospitals.length} Trauma Centers in radius.`} 
                  delay={3500} 
                  className="text-cyan" 
                />
                <TypewriterLine 
                  text={`> [Resource Manager]: Need ${dispatchPlan.total_ambulances} total ambulances.`} 
                  delay={5500} 
                  className="text-cyan" 
                />
                <TypewriterLine 
                  text={`> [Router]: Dispatch plan generated. Confidence ${dispatchPlan.confidence}%.`} 
                  delay={7000} 
                  className="text-emerald font-bold" 
                />
                <div className="mt-4 border-t border-danger/30 pt-4 opacity-0 animate-[fadeIn_0.5s_ease-in-out_9s_forwards]">
                  <p className="text-slate-300 mb-2 font-bold">Allocations:</p>
                  {dispatchPlan.allocations.map((alloc, idx) => (
                    <p key={idx} className="text-slate-400 ml-4">- {alloc.hospital_name}: {alloc.ambulances_dispatched} units</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-orange animate-pulse">&gt; Waiting for LangGraph swarm response...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
