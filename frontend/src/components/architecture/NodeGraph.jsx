import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Cpu, Activity, Calculator, Network, LayoutTemplate, X, TriangleAlert } from 'lucide-react';
import anime from 'animejs';

const CODE_SNIPPET = `async def find_hospitals(state: EmergencyState):
    """LangGraph Node for querying OpenStreetMap."""
    hospitals = await fetch_hospitals_from_osm(
        state.lat, state.lon, radius_m=10000
    )
    
    # Greedy allocation of casualties to capacity
    state.hospitals = hospitals
    state.allocations = _allocate_patients(state, hospitals)
    return state`;

const Node = ({ icon: Icon, title, subtitle, status, isRed, isActive, isDimmed, children, w = "w-[220px]", h = "min-h-[100px]", onClick }) => {
  return (
    <div 
      className={`relative group transition-all duration-500 z-20 ${w} ${isDimmed ? 'opacity-30' : 'opacity-100'} ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <div className={`flex flex-col p-4 pb-10 rounded-xl border backdrop-blur-md shadow-xl transition-all ${
        isRed || isActive 
          ? 'bg-[#1a0f14] border-danger/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
          : 'bg-[#0f172a]/90 border-white/5 hover:border-white/20'
      } ${h}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${isRed || isActive ? 'bg-danger/20 text-danger' : 'bg-cyan/10 text-cyan'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        
        {children}

        {status && (
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isRed || isActive ? 'bg-danger animate-pulse' : 'bg-cyan'}`} />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function NodeGraph({ mode = 'normal', pulseKey = 0 }) {
  const [pulseActive, setPulseActive] = useState(false);
  const [swarmState, setSwarmState] = useState(0);
  const [showCode, setShowCode] = useState(false);
  
  const isEmergencyMode = mode === 'emergency';
  const pulseRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (pulseKey > 0) {
      setPulseActive(true);
      
      const pathId = isEmergencyMode ? '#path-emergency-full' : '#path-normal-full';
      const path = anime.path(pathId);
      
      if (animRef.current) animRef.current.pause();

      animRef.current = anime({
        targets: pulseRef.current,
        translateX: path('x'),
        translateY: path('y'),
        easing: 'linear',
        duration: isEmergencyMode ? 3000 : 4000,
        complete: () => setPulseActive(false)
      });

      if (isEmergencyMode) {
        setTimeout(() => setSwarmState(1), 1000);
        setTimeout(() => setSwarmState(2), 1500);
        setTimeout(() => setSwarmState(3), 2000);
        setTimeout(() => setSwarmState(4), 2500);
      }
    } else {
      setPulseActive(false);
      setSwarmState(0);
      if (animRef.current) animRef.current.pause();
    }
  }, [pulseKey, mode]);

  useEffect(() => {
    if (!isEmergencyMode) {
      setSwarmState(0);
    }
  }, [isEmergencyMode]);

  // Handle modal animation
  const modalRef = useRef(null);
  useEffect(() => {
    if (showCode && modalRef.current) {
      anime({
        targets: modalRef.current,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 300,
        easing: 'easeOutExpo'
      });
    }
  }, [showCode]);

  return (
    <div className="flex-1 w-full h-full relative bg-transparent overflow-hidden flex flex-col items-center">
      <div className="relative overflow-x-auto overflow-y-hidden w-full flex justify-center">
        <div className="relative w-[1200px] h-[650px] shrink-0 mt-4">
          
          {/* SVG Wires Layer */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Invisible continuous paths for AnimeJS to follow */}
              <path id="path-normal-full" d="M 270 120 C 330 120, 290 315, 350 315 L 570 315 C 630 315, 590 120, 650 120 L 870 120 C 930 120, 890 315, 950 315" fill="none" stroke="transparent" />
              <path id="path-emergency-full" d="M 270 430 C 330 430, 290 315, 350 315 L 570 315 C 630 315, 590 470, 650 470 L 870 470 C 930 470, 890 315, 950 315" fill="none" stroke="transparent" />

              {/* Weather -> Gateway */}
              <path d="M 270 120 C 330 120, 290 315, 350 315" fill="none" stroke={!isEmergencyMode ? '#06b6d4' : '#1e293b'} strokeWidth="2" filter={!isEmergencyMode ? 'url(#glow-cyan)' : ''} />
              
              {/* Hardware -> Gateway */}
              <path d="M 270 430 C 330 430, 290 315, 350 315" fill="none" stroke={isEmergencyMode ? '#ef4444' : '#1e293b'} strokeWidth="2" strokeDasharray={!isEmergencyMode ? "5,5" : ""} filter={isEmergencyMode ? 'url(#glow-danger)' : ''} />
              
              {/* Gateway -> MILP */}
              <path d="M 570 315 C 630 315, 590 120, 650 120" fill="none" stroke={!isEmergencyMode ? '#06b6d4' : '#1e293b'} strokeWidth="2" filter={!isEmergencyMode ? 'url(#glow-cyan)' : ''} />
              
              {/* Gateway -> Swarm */}
              <path d="M 570 315 C 630 315, 590 470, 650 470" fill="none" stroke={isEmergencyMode ? '#ef4444' : '#1e293b'} strokeWidth="2" strokeDasharray={!isEmergencyMode ? "5,5" : ""} filter={isEmergencyMode ? 'url(#glow-danger)' : ''} />
              
              {/* MILP -> Frontend */}
              <path d="M 870 120 C 930 120, 890 315, 950 315" fill="none" stroke={!isEmergencyMode ? '#06b6d4' : '#1e293b'} strokeWidth="2" filter={!isEmergencyMode ? 'url(#glow-cyan)' : ''} />
              
              {/* Swarm -> Frontend */}
              <path d="M 870 470 C 930 470, 890 315, 950 315" fill="none" stroke={isEmergencyMode ? '#ef4444' : '#1e293b'} strokeWidth="2" strokeDasharray={!isEmergencyMode ? "5,5" : ""} filter={isEmergencyMode ? 'url(#glow-danger)' : ''} />

              {/* Pulse Dot */}
              {pulseActive && (
                <g ref={pulseRef}>
                  <circle r="6" fill={isEmergencyMode ? '#ef4444' : '#06b6d4'} className="drop-shadow-2xl" />
                  <circle r="12" fill={isEmergencyMode ? '#ef4444' : '#06b6d4'} opacity="0.4" className="animate-ping" />
                </g>
              )}
            </svg>
          </div>

          {/* Nodes HTML Layer */}
          <div className="absolute inset-0 z-10 font-sans">
            
            {/* Col 1 */}
            <div className="absolute left-[50px] top-[75px]">
              <Node 
                icon={Cloud} title="Weather API" subtitle="External Data" status="Standby"
                isDimmed={isEmergencyMode}
              />
            </div>
            
            <div className="absolute left-[50px] top-[385px]">
              <Node 
                icon={Cpu} title="ESP32 + MPU6050" subtitle="Edge Hardware" status={isEmergencyMode ? "CRITICAL: Peak_G 8.4!" : "Standby"}
                isRed={isEmergencyMode}
                isDimmed={!isEmergencyMode}
              />
            </div>

            {/* Col 2 */}
            <div className="absolute left-[350px] top-[270px]">
              <Node 
                icon={Activity} title="FastAPI Gateway" subtitle="Request Router" status={isEmergencyMode ? "Routing Emergency" : "Standby"}
                isActive={isEmergencyMode}
              />
            </div>

            {/* Col 3 */}
            <div className="absolute left-[650px] top-[75px]">
              <Node 
                icon={Calculator} title="MILP Optimizer" subtitle="PuLP Solver" status="Standby"
                isDimmed={isEmergencyMode}
              />
            </div>

            <div className="absolute left-[650px] top-[360px]">
              <Node 
                icon={isEmergencyMode ? TriangleAlert : Network} 
                title="LangGraph Agent Swarm" 
                subtitle="Emergency Response" 
                status=""
                isActive={isEmergencyMode}
                isDimmed={!isEmergencyMode}
                h="min-h-[220px]"
                onClick={() => setShowCode(true)}
              >
                <p className="text-[10px] text-slate-500 mt-2 ml-14 mb-2 hover:text-cyan cursor-pointer transition-colors">Click to view source</p>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className={`p-2 rounded bg-[#080c14] border ${swarmState >= 1 ? 'border-orange shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-white/5 opacity-50'}`}>
                    <span className={`text-[10px] font-bold ${swarmState >= 1 ? 'text-orange' : 'text-slate-400'}`}>Analyzer</span>
                  </div>
                  <div className={`p-2 rounded bg-[#080c14] border ${swarmState >= 2 ? 'border-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-white/5 opacity-50'}`}>
                    <span className={`text-[10px] font-bold ${swarmState >= 2 ? 'text-primary' : 'text-slate-400'}`}>Medical</span>
                  </div>
                  <div className={`p-2 rounded bg-[#080c14] border ${swarmState >= 3 ? 'border-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-white/5 opacity-50'}`}>
                    <span className={`text-[10px] font-bold ${swarmState >= 3 ? 'text-cyan' : 'text-slate-400'}`}>Router</span>
                  </div>
                  <div className={`p-2 rounded bg-[#080c14] border ${swarmState >= 4 ? 'border-emerald shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/5 opacity-50'}`}>
                    <span className={`text-[10px] font-bold ${swarmState >= 4 ? 'text-emerald' : 'text-slate-400'}`}>Resource</span>
                  </div>
                </div>
              </Node>
            </div>

            {/* Col 4 */}
            <div className="absolute left-[950px] top-[270px]">
              <Node 
                icon={LayoutTemplate} title="Frontend UI" subtitle="deck.gl Map" status={isEmergencyMode ? "Receiving Update" : "Standby"}
                isActive={isEmergencyMode}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Code Modal */}
      {showCode && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden opacity-0">
            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-[#2d2d2d] relative">
              <div className="flex space-x-2">
                <button onClick={() => setShowCode(false)} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer transition-colors" title="Close window"></button>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-sm font-mono absolute left-1/2 -translate-x-1/2 pointer-events-none">backend/app/agents/medical.py</span>
            </div>
            <div className="p-6 overflow-auto text-sm">
              <pre className="text-emerald font-mono">
                <code>{CODE_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
