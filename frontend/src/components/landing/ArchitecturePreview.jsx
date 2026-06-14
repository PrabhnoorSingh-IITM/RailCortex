import React, { useState } from 'react';
import { Cpu, Server, Network, Map as MapIcon, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import NodeGraph from '../architecture/NodeGraph';

export default function ArchitecturePreview() {
  const [simMode, setSimMode] = useState("normal");
  const [pulseKey, setPulseKey] = useState(0);

  const triggerSimulation = () => {
    setPulseKey(prev => prev + 1);
  };

  return (
    <section id="architecture" className="py-32 bg-deepslate relative border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 w-full">
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Live Architecture</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            From the <strong className="text-white">FastAPI</strong> backend to the <strong className="text-white">Zustand</strong> state store. 
            Watch the <strong className="text-white">LangGraph</strong> nodes orchestrate data over a persistent <strong className="text-white">SQLite</strong> memory layer and stream it to the browser via <strong className="text-white">WebSockets</strong>.
          </p>
        </motion.div>

        {/* Interactive Header */}
        <div className="flex justify-center mb-10 relative z-20">
          <div className="flex items-center gap-4 bg-[#1e293b]/50 p-1.5 rounded-lg border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setSimMode("normal")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                simMode === "normal"
                  ? "bg-[#06b6d4]/20 text-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              View Normal Operations
            </button>
            <button
              onClick={() => setSimMode("emergency")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                simMode === "emergency"
                  ? "bg-[#ef4444]/20 text-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              View Emergency Override
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="relative w-full h-[650px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#080c14]"
        >
          {/* Dot Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Main Canvas */}
          <div className="flex-1 w-full h-full relative overflow-auto hide-scrollbar">
            {/* Floating Triggers */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={triggerSimulation}
                className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                  simMode === "normal"
                    ? "bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                    : "bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                }`}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                {simMode === "normal" ? "Simulate Weather Event" : "Trigger Physical Shock"}
              </button>
            </div>

            {/* The Graph */}
            <NodeGraph mode={simMode} pulseKey={pulseKey} />
          </div>
        </motion.div>

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />

      </div>
    </section>
  );
}

function ActivityIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
