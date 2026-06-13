import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Server, Calculator, Network, LayoutTemplate, Activity, ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import anime from 'animejs';

// Dummy Code Snippet for Modal
const CODE_SNIPPET = `def emergency_router_agent(state: EmergencyState):
    """LangGraph Node for dispatching ambulances."""
    impact = state.get("impact_g_force", 0)
    
    if impact > 8.0:
        hospitals = query_overpass_api(radius_km=10)
        ambulances = calculate_dispatch(hospitals)
        return {"status": "DISPATCHED", "count": ambulances}
    
    return {"status": "MONITORING"}`;

// Sub-component for individual Nodes
const Node = ({ icon: Icon, title, isRed, isActive, isDimmed, hoverText, onClick, colorClass = "text-white" }) => {
  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${isDimmed ? 'opacity-30' : 'opacity-100'} z-20`}
      onClick={onClick}
    >
      <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 backdrop-blur-md shadow-2xl transition-all ${
        isRed || isActive 
          ? 'bg-red-950 border-danger shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-110' 
          : 'bg-surface/80 border-white/10 hover:border-cyan hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
      }`}>
        <Icon className={`h-10 w-10 ${isActive || isRed ? 'text-danger animate-pulse' : colorClass}`} />
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 text-center w-32">
        <p className="font-bold text-sm text-white">{title}</p>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-max max-w-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-slate-900 border border-white/20 p-3 rounded-lg shadow-xl text-xs font-mono text-emerald">
          {hoverText}
        </div>
      </div>
    </div>
  );
};

export default function NodeGraph() {
  const [mode, setMode] = useState('normal'); // normal | emergency
  const [pulseActive, setPulseActive] = useState(false);
  const [swarmState, setSwarmState] = useState(0); // 0 to 4 for sequential lighting
  const [showCode, setShowCode] = useState(false);
  
  const pulseRef = useRef(null);
  const pulseAnimRef = useRef(null);

  const triggerNormal = () => {
    if (mode === 'emergency') return;
    setPulseActive(true);
    
    setTimeout(() => {
      if (pulseRef.current) {
        pulseAnimRef.current = anime({
          targets: pulseRef.current,
          cx: [150, 300, 400, 400, 550, 650, 750, 750, 850],
          cy: [300, 300, 300, 150, 150, 150, 150, 300, 300],
          duration: 3000,
          easing: 'linear',
          complete: () => setPulseActive(false)
        });
      }
    }, 50);
  };

  const triggerEmergency = () => {
    setMode('emergency');
    setPulseActive(true);
    
    setTimeout(() => {
      if (pulseRef.current) {
        pulseAnimRef.current = anime({
          targets: pulseRef.current,
          cx: [150, 300, 400, 400, 550, 650, 750, 750, 850],
          cy: [300, 300, 300, 450, 450, 450, 450, 300, 300],
          duration: 4000,
          easing: 'linear',
          complete: () => setPulseActive(false)
        });
      }
    }, 50);
    
    // Sequential lighting of Swarm
    setTimeout(() => setSwarmState(1), 1000);
    setTimeout(() => setSwarmState(2), 2000);
    setTimeout(() => setSwarmState(3), 3000);
    setTimeout(() => setSwarmState(4), 4000);
  };

  const reset = () => {
    setMode('normal');
    setPulseActive(false);
    setSwarmState(0);
    if (pulseAnimRef.current) pulseAnimRef.current.pause();
  };

  // Anime JS for modal
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

  // Anime JS for swarm state lines
  useEffect(() => {
    if (mode === 'emergency' && swarmState > 0) {
      anime({
        targets: '.swarm-line',
        opacity: [0, 1],
        translateY: [-10, 0],
        delay: anime.stagger(100),
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
  }, [swarmState, mode]);

  return (
    <div className="flex-1 w-full relative bg-deepslate overflow-hidden flex flex-col">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_2px,transparent_2px)] bg-[size:40px_40px]"></div>

      {/* Header */}
      <div className="h-[10vh] border-b border-white/5 flex justify-between items-center px-8 relative z-30 bg-surface/50 backdrop-blur-md">
        <Link to="/" className="text-slate-400 hover:text-white font-medium">&lt; Back to Landing Page</Link>
        <h1 className="text-xl font-bold text-white">Live Architecture Simulation</h1>
        <button onClick={reset} className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-2 rounded">Reset Simulation</button>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative flex items-center justify-center p-8">
        
        {/* Wires container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <svg className="w-full h-full absolute" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
            {/* Edge to Gateway */}
            <path d="M 150 300 L 300 300" fill="none" stroke="#334155" strokeWidth="4" />
            
            {/* Gateway to MILP (Top Path) */}
            <path d="M 300 300 L 400 300 L 400 150 L 550 150" fill="none" stroke={mode === 'normal' ? '#06b6d4' : '#334155'} strokeWidth="4" />
            
            {/* Gateway to Swarm (Bottom Path) */}
            <path d="M 300 300 L 400 300 L 400 450 L 550 450" fill="none" stroke={mode === 'emergency' ? '#ef4444' : '#334155'} strokeWidth="4" />
            
            {/* MILP to Frontend */}
            <path d="M 650 150 L 750 150 L 750 300 L 850 300" fill="none" stroke={mode === 'normal' ? '#06b6d4' : '#334155'} strokeWidth="4" />
            
            {/* Swarm to Frontend */}
            <path d="M 650 450 L 750 450 L 750 300 L 850 300" fill="none" stroke={mode === 'emergency' ? '#ef4444' : '#334155'} strokeWidth="4" />

            {/* Pulse */}
            {pulseActive && (
              <circle 
                ref={pulseRef}
                cx="150" cy="300" 
                r={mode === 'normal' ? 6 : 8} 
                fill={mode === 'normal' ? '#06b6d4' : '#ef4444'} 
                className={mode === 'normal' ? 'shadow-[0_0_15px_#06b6d4]' : 'shadow-[0_0_20px_#ef4444]'}
              />
            )}
          </svg>
        </div>

        {/* Nodes Layer */}
        <div className="relative w-[1000px] h-[600px] flex items-center justify-between z-10">
          
          {/* Col 1 */}
          <div className="absolute left-[100px] top-[250px] flex flex-col items-center">
            <Node 
              icon={Cpu} title="Hardware Edge" hoverText={mode === 'normal' ? "Peak_G: 1.2, Temp: 32C" : "CRITICAL: Peak_G 8.4G!"}
              isRed={mode === 'emergency'}
              colorClass="text-slate-300"
            />
            {mode === 'normal' && (
              <button onClick={triggerEmergency} className="mt-16 bg-danger/20 border border-danger hover:bg-danger text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] pointer-events-auto">
                [Trigger Physical Shock]
              </button>
            )}
          </div>

          {/* Col 2 */}
          <div className="absolute left-[250px] top-[250px]">
            <Node icon={Server} title="API Gateway" hoverText="FastAPI: Receiving Data Stream" colorClass="text-cyan" />
          </div>

          {/* Col 3 Top */}
          <div className="absolute left-[550px] top-[100px] flex flex-col items-center">
            <Node 
              icon={Calculator} title="MILP Engine" hoverText="Minimize Z = Σ(C_delay * dt)" 
              isDimmed={mode === 'emergency'}
              colorClass="text-primary"
            />
            {mode === 'normal' && (
              <button onClick={triggerNormal} className="mt-16 bg-primary/20 border border-primary hover:bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] pointer-events-auto">
                [Simulate Weather Event]
              </button>
            )}
          </div>

          {/* Col 3 Bottom (Swarm) */}
          <div className="absolute left-[550px] top-[400px]">
            <Node 
              icon={Network} title="LangGraph Swarm" hoverText="Click to view Code State" 
              isDimmed={mode === 'normal'}
              isActive={swarmState > 0}
              onClick={() => setShowCode(true)}
              colorClass="text-orange"
            />
            
            {/* Swarm Details showing up sequentially */}
            {mode === 'emergency' && swarmState > 0 && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-12 w-64 space-y-2 font-mono text-xs">
                {swarmState >= 1 && <div className="swarm-line text-orange bg-slate-900/80 p-2 rounded border border-orange/30">Analyzer: Severity HIGH</div>}
                {swarmState >= 2 && <div className="swarm-line text-primary bg-slate-900/80 p-2 rounded border border-primary/30">Medical: 3 Hospitals Found</div>}
                {swarmState >= 3 && <div className="swarm-line text-cyan bg-slate-900/80 p-2 rounded border border-cyan/30">Router: Calculating Routes</div>}
                {swarmState >= 4 && <div className="swarm-line text-warning bg-slate-900/80 p-2 rounded border border-warning/30">Resource: Dispatch JSON Generated</div>}
              </div>
            )}
          </div>

          {/* Col 4 */}
          <div className="absolute left-[800px] top-[250px]">
            <Node icon={LayoutTemplate} title="Frontend UI" hoverText="React + Leaflet render" colorClass="text-emerald" />
          </div>

        </div>
      </div>

      {/* Code Modal */}
      {showCode && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden opacity-0">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-[#2d2d2d]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-sm font-mono">langgraph_swarm.py</span>
              <button onClick={() => setShowCode(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5"/></button>
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
