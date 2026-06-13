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
    <div className="w-[30%] min-w-[350px] max-w-[450px] m-4 rounded-3xl bg-slate-900/60 backdrop-blur-3xl border border-white/10 flex flex-col z-40 relative shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-500">
      {!isEmergencyMode ? (
        <div
          ref={normalRef}
          className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto opacity-0"
        >
          {/* Network Status Header */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
            <Activity className="h-5 w-5 text-emerald" />
            <h2 className="text-emerald font-bold tracking-wide uppercase text-sm">Network Status: Optimal</h2>
          </div>

          {/* Weather Warning Widget */}
          <div className="bg-slate-800/40 border border-white/10 p-5 rounded-2xl flex items-center justify-between shrink-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Local Weather</p>
              <p className="text-xl font-black text-white tracking-tight">
                {isSimulating ? 'Heavy Rain Warning' : 'Clear Skies'}
              </p>
            </div>
            {isSimulating ? (
              <CloudRain className="h-8 w-8 text-primary animate-pulse relative z-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            ) : (
              <CloudSun className="h-8 w-8 text-slate-300 relative z-10" />
            )}
          </div>

          {/* Active Trains List */}
          <div className="space-y-4">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Active Consists</h3>
            
            {trains.map((train) => (
              <div key={train.train_id || train.id} className="bg-slate-800/30 border border-white/10 p-4 rounded-xl hover:bg-slate-800/60 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_20px_rgba(59,130,246,0.15)] transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white font-mono flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors"></span>
                    <span>{train.train_id || train.id}</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider ${(train.delay_offset || 0) > 0 ? 'text-warning bg-warning/10' : 'text-emerald bg-emerald/10'}`}>
                    {(train.delay_offset || 0) > 0 ? `+${Math.round(train.delay_offset)}m DELAY` : 'ON TIME'}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1.5 mt-3">
                  <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider text-slate-500">Speed</span><span className="text-slate-200 font-medium">{Math.round(train.speed_kmh || 0)} km/h</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider text-slate-500">Platform</span><span className="text-slate-200 font-medium">{train.platform || 'Transit'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider text-slate-500">Status</span><span className="text-slate-200 font-medium">{(train.delay_offset || 0) > 0 ? 'Delayed' : 'En Route'}</span></div>
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
          {/* Emergency Status Header */}
          <div className="p-6 border-b border-danger/20 bg-danger/10 flex items-center space-x-3 shrink-0">
            <ServerCrash className="h-5 w-5 text-danger animate-pulse" />
            <h2 className="text-danger font-bold tracking-wide uppercase text-sm animate-pulse">System Events: CRITICAL FAILURE</h2>
          </div>

          {/* AI Agent Terminal Output */}
          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto relative bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-danger/5 pointer-events-none animate-pulse"></div>
            {dispatchPlan ? (
              <div className="space-y-4 relative z-10 drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
                <TypewriterLine 
                  text={`> [Hardware Edge]: Emergency detected on ${dispatchPlan.train_id}.`} 
                  delay={100} 
                  className="text-danger font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" 
                />
                <TypewriterLine 
                  text={`> [Incident Analyzer]: ${dispatchPlan.reasoning}`} 
                  delay={1500} 
                  className="text-orange drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" 
                />
                <TypewriterLine 
                  text={`> [Medical Coordinator]: Found ${dispatchPlan.hospitals.length} Trauma Centers in radius.`} 
                  delay={3500} 
                  className="text-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" 
                />
                <TypewriterLine 
                  text={`> [Resource Manager]: Need ${dispatchPlan.total_ambulances} total ambulances.`} 
                  delay={5500} 
                  className="text-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" 
                />
                <TypewriterLine 
                  text={`> [Router]: Dispatch plan generated. Confidence ${dispatchPlan.confidence}%.`} 
                  delay={7000} 
                  className="text-emerald font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" 
                />
                <div className="mt-4 border-t border-danger/30 pt-4 opacity-0 animate-[fadeIn_0.5s_ease-in-out_9s_forwards]">
                  <p className="text-slate-300 mb-2 font-bold flex items-center"><span className="w-2 h-2 bg-danger rounded-full mr-2 animate-ping"></span> Allocations:</p>
                  {dispatchPlan.allocations.map((alloc, idx) => (
                    <p key={idx} className="text-slate-400 ml-4 border-l-2 border-danger/30 pl-2 my-1">- {alloc.hospital_name}: {alloc.ambulances_dispatched} units</p>
                  ))}
                  <div className="mt-4 flex items-center text-danger font-bold animate-pulse">
                    <span>&gt; _</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <p className="text-orange animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">&gt; Waiting for LangGraph swarm response<span className="animate-ping">_</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
