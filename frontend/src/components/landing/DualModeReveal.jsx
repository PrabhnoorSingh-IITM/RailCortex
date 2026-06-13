import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Monitor, Terminal } from 'lucide-react';
import anime from 'animejs';

export default function DualModeReveal() {
  const [isEmergency, setIsEmergency] = useState(false);
  const flashRef = useRef(null);
  const normalTextRef = useRef(null);
  const emergencyTextRef = useRef(null);
  const normalVisualRef = useRef(null);
  const emergencyVisualRef = useRef(null);

  useEffect(() => {
    // Initial setup
    if (emergencyTextRef.current) emergencyTextRef.current.style.display = 'none';
    if (emergencyVisualRef.current) emergencyVisualRef.current.style.display = 'none';
  }, []);

  const handleToggle = (emergency) => {
    if (emergency === isEmergency) return;

    if (emergency) {
      // Switch to emergency
      if (emergencyTextRef.current) emergencyTextRef.current.style.display = 'block';
      if (emergencyVisualRef.current) emergencyVisualRef.current.style.display = 'flex';

      anime({
        targets: flashRef.current,
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });

      anime({
        targets: [normalTextRef.current, normalVisualRef.current],
        opacity: [1, 0],
        translateX: [0, -20],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => {
          if (normalTextRef.current) normalTextRef.current.style.display = 'none';
          if (normalVisualRef.current) normalVisualRef.current.style.display = 'none';
          
          anime({
            targets: [emergencyTextRef.current, emergencyVisualRef.current],
            opacity: [0, 1],
            translateX: [20, 0],
            duration: 500,
            easing: 'easeOutQuad'
          });
        }
      });
    } else {
      // Switch to normal
      if (normalTextRef.current) normalTextRef.current.style.display = 'block';
      if (normalVisualRef.current) normalVisualRef.current.style.display = 'flex';

      anime({
        targets: flashRef.current,
        opacity: [1, 0],
        duration: 300,
        easing: 'easeOutQuad'
      });

      anime({
        targets: [emergencyTextRef.current, emergencyVisualRef.current],
        opacity: [1, 0],
        translateX: [0, -20],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => {
          if (emergencyTextRef.current) emergencyTextRef.current.style.display = 'none';
          if (emergencyVisualRef.current) emergencyVisualRef.current.style.display = 'none';
          
          anime({
            targets: [normalTextRef.current, normalVisualRef.current],
            opacity: [0, 1],
            translateX: [20, 0],
            duration: 500,
            easing: 'easeOutQuad'
          });
        }
      });
    }

    setIsEmergency(emergency);
  };

  return (
    <section id="solution" className="py-32 bg-background relative overflow-hidden">
      
      {/* Background Flash Effect */}
      <div 
        ref={flashRef}
        className="absolute inset-0 bg-danger/10 z-0 opacity-0 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Dual-Mode Execution</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Not just a dashboard. A reactive, hardware-integrated agentic swarm.
          </p>
        </div>

        {/* Interactive Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-surface/50 p-1.5 rounded-full border border-white/10 flex space-x-1 backdrop-blur-md">
            <button
              onClick={() => handleToggle(false)}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all flex items-center space-x-2 ${
                !isEmergency 
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Digital Twin Mode</span>
            </button>
            <button
              onClick={() => handleToggle(true)}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all flex items-center space-x-2 ${
                isEmergency 
                  ? 'bg-danger text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Emergency Swarm Mode</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Text Description */}
          <div className="relative min-h-[150px]">
             {/* Normal Text */}
             <div ref={normalTextRef} className="absolute inset-0 space-y-6">
                <h3 className="text-3xl font-bold text-emerald">Predictive MILP Mathematics</h3>
                <p className="text-lg text-slate-300">
                  We foresee track gridlock before it cascades. Our Mixed-Integer Linear Programming (MILP) engine autonomously reallocates platforms and adjusts schedules in real-time.
                </p>
             </div>
             
             {/* Emergency Text */}
             <div ref={emergencyTextRef} className="absolute inset-0 space-y-6">
                <h3 className="text-3xl font-bold text-danger">Hardware-Triggered Agentic Swarm</h3>
                <p className="text-lg text-slate-300">
                  When physics fail, software takes over. Our LangGraph AI instantly maps trauma centers and routes heavy-vehicle ambulances the millisecond a physical impact is detected by the edge node.
                </p>
             </div>
          </div>

          {/* Visual Mockup Container */}
          <div className="relative aspect-video rounded-xl border border-white/10 bg-slate-800 overflow-hidden shadow-2xl">
            
            {/* Normal Visual */}
            <div ref={normalVisualRef} className="absolute inset-0 bg-slate-900 flex flex-col">
              <div className="h-10 border-b border-white/5 flex items-center px-4 bg-slate-800">
                <Monitor className="h-4 w-4 text-emerald mr-2" />
                <span className="text-xs text-slate-400 font-mono">railcortex_dashboard.jsx</span>
              </div>
              <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald/30"></div>
                  <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-emerald rounded-full shadow-[0_0_10px_#10b981]"></div>
              </div>
            </div>

            {/* Emergency Visual */}
            <div ref={emergencyVisualRef} className="absolute inset-0 bg-red-950 flex flex-col">
              <div className="h-10 border-b border-danger/20 flex items-center px-4 bg-black/50">
                <Terminal className="h-4 w-4 text-danger mr-2" />
                <span className="text-xs text-danger font-mono">swarm_override.sh</span>
              </div>
              <div className="flex-1 p-6 font-mono text-sm space-y-2">
                <p className="text-danger">&gt; [Hardware]: MPU6050 Peak G-Force 8.4G Detected.</p>
                <p className="text-orange">&gt; [Analyzer]: Kinetic energy exceeds threshold. Severity: HIGH.</p>
                <p className="text-primary">&gt; [Medical]: Querying OpenStreetMap... 3 Trauma Centers Found.</p>
                <p className="text-warning">&gt; [Resource]: Dispatching 14 Ambulances. ETA 12 mins.</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
