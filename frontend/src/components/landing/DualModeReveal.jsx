import React, { useState } from 'react';
import { Activity, ShieldAlert, Monitor, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DualModeReveal() {
  const [isEmergency, setIsEmergency] = useState(false);

  return (
    <section id="solution" className="py-32 bg-[#080c14] relative overflow-hidden border-t border-white/5">
      
      {/* Background Flash Effect */}
      <AnimatePresence>
        {isEmergency && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-danger/10 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Dual-Mode Execution</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Not just a dashboard. A reactive, hardware-integrated agentic swarm.
          </p>
        </motion.div>

        {/* Interactive Toggle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-16"
        >
          <div className="bg-[#0f172a]/80 p-1.5 rounded-full border border-white/10 flex space-x-1 backdrop-blur-md shadow-2xl relative">
            <button
              onClick={() => setIsEmergency(false)}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all flex items-center space-x-2 relative z-10 ${
                !isEmergency 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Digital Twin Mode</span>
            </button>
            <button
              onClick={() => setIsEmergency(true)}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all flex items-center space-x-2 relative z-10 ${
                isEmergency 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Emergency Swarm Mode</span>
            </button>

            {/* Sliding background pill */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full z-0 ${isEmergency ? 'bg-danger shadow-[0_0_15px_rgba(239,68,68,0.5)] right-1.5' : 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] left-1.5'}`}
            />
          </div>
        </motion.div>

        {/* Dynamic Content Area */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Text Description */}
          <div className="relative min-h-[180px] overflow-hidden">
             <AnimatePresence mode="wait">
               {!isEmergency ? (
                 <motion.div 
                   key="normal-text"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   transition={{ duration: 0.3 }}
                   className="absolute inset-0 space-y-6"
                 >
                     <h3 className="text-3xl font-bold text-emerald">Deterministic MILP Optimization</h3>
                     <p className="text-lg text-slate-300 leading-relaxed">
                       We prevent gridlock deterministically. Our backend utilizes <strong className="text-white">Mixed-Integer Linear Programming (PuLP)</strong> to analyze live <strong className="text-white">WebSocket</strong> telemetry and autonomously calculate platform reallocations, absorbing localized delays before they cascade.
                     </p>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="emergency-text"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   transition={{ duration: 0.3 }}
                   className="absolute inset-0 space-y-6"
                 >
                     <h3 className="text-3xl font-bold text-danger">Hardware-Triggered Swarm</h3>
                     <p className="text-lg text-slate-300 leading-relaxed">
                       When physics fail, software takes over. Our <strong className="text-white">LangGraph AI</strong> instantly queries <strong className="text-white">OpenStreetMap</strong> and routes heavy-vehicle ambulances the millisecond a physical impact is detected by the edge node.
                     </p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Visual Mockup Container */}
          <div className="relative aspect-video rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              {!isEmergency ? (
                <motion.div 
                  key="normal-visual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#1e293b]/50">
                    <Monitor className="h-4 w-4 text-emerald mr-2" />
                    <span className="text-xs text-slate-400 font-mono">railcortex_dashboard.jsx</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-[#080c14]">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30"></div>
                      
                      {/* Animated Sine Wave */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <motion.path 
                          d="M 0 100 Q 150 50 300 100 T 600 100" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </svg>
                      
                      <motion.div 
                        animate={{ x: [0, 600], y: [100, 100, 100] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-3 h-3 bg-emerald rounded-full shadow-[0_0_15px_#10b981] -ml-1.5 -mt-1.5"
                      />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="emergency-visual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-[#1a0f14] flex flex-col"
                >
                  <div className="h-10 border-b border-danger/20 flex items-center px-4 bg-black/50">
                    <Terminal className="h-4 w-4 text-danger mr-2" />
                    <span className="text-xs text-danger font-mono">swarm_override.sh</span>
                  </div>
                  <div className="flex-1 p-6 font-mono text-sm space-y-3 overflow-hidden relative">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-danger">&gt; [Hardware]: MPU6050 Peak G-Force 8.4G Detected.</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-orange">&gt; [Analyzer]: Kinetic energy exceeds threshold. Severity: HIGH.</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <p className="text-primary">&gt; [Medical]: Querying OpenStreetMap... 3 Trauma Centers Found.</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <p className="text-warning">&gt; [Resource]: Dispatching 14 Ambulances. ETA 12 mins.</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </div>
    </section>
  );
}
