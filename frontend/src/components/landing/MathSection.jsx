import React from 'react';
import { Brain, Calculator, ShieldAlert, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MathSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <section className="py-32 bg-deepslate relative border-t border-white/5 overflow-hidden">
      {/* Background Math/Code Particles */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 text-4xl font-mono text-cyan/30 animate-pulse">∑</div>
        <div className="absolute bottom-40 right-20 text-5xl font-mono text-danger/30 animate-pulse delay-700">∫</div>
        <div className="absolute top-1/2 left-1/3 text-6xl font-mono text-primary/20 animate-pulse delay-300">∂</div>
        <div className="absolute top-1/4 right-1/4 text-3xl font-mono text-emerald/30 animate-pulse delay-500">∇</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase">
            Theoretical Core
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Mathematical Foundations</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            RailCortex is not a wrapper. It uses deep mathematical abstractions to power the <strong className="text-white">Digital Twin</strong> and the <strong className="text-white">Agentic Swarm</strong>.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          
          {/* Machine Learning Card */}
          <motion.div variants={itemVariants} className="group bg-[#080c14] border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-primary/50 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Deterministic MILP Optimization</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Instead of relying on stochastic LLMs for physical routing, RailCortex uses <strong className="text-white">Mixed-Integer Linear Programming (MILP)</strong> via PuLP. It calculates optimal platform reallocations deterministically, ensuring mathematical bounds and collision-avoidance constraints are never violated.
            </p>
            <div className="bg-[#0f172a] p-4 rounded-xl font-mono text-sm text-emerald border border-white/5 overflow-x-auto shadow-inner relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald rounded-l-xl" />
              <span className="text-slate-500">{"// PuLP MILP Objective"}</span>
              <br/>
              prob <span className="text-white">+=</span> pulp.<span className="text-cyan">lpSum</span>(costs[i][j] <span className="text-cyan">×</span> x[i][j])
              <br/>
              prob <span className="text-white">+=</span> (arrival[i] <span className="text-cyan">&gt;=</span> departure[j] + buffer)
            </div>
          </motion.div>

          {/* Agentic Pipeline Card */}
          <motion.div variants={itemVariants} className="group bg-[#080c14] border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-warning/50 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl group-hover:bg-warning/20 transition-all" />
            <div className="w-14 h-14 bg-warning/20 rounded-xl flex items-center justify-center mb-6 border border-warning/30 group-hover:scale-110 transition-transform">
              <Calculator className="h-7 w-7 text-warning" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Autonomous Agentic Swarm</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              RailCortex leverages a <strong className="text-white">LangGraph</strong> state machine to orchestrate emergency response. Individual agents—Analyzer, Medical, and Dispatcher—act autonomously, assessing the crash, querying OpenStreetMap for hospitals, and allocating ambulances dynamically without human intervention.
            </p>
            <div className="bg-[#0f172a] p-4 rounded-xl font-mono text-sm text-warning border border-white/5 overflow-x-auto shadow-inner relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-warning rounded-l-xl" />
              <span className="text-slate-500">{"// LangGraph State Orchestration"}</span>
              <br/>
              graph.<span className="text-cyan">add_node</span>(<span className="text-emerald">"analyze"</span>, analyzer_agent)
              <br/>
              graph.<span className="text-cyan">add_node</span>(<span className="text-emerald">"allocate"</span>, medical_agent)
            </div>
          </motion.div>

          {/* Kinematics Card */}
          <motion.div variants={itemVariants} className="group bg-[#080c14] border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-danger/50 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-3xl group-hover:bg-danger/20 transition-all" />
            <div className="w-14 h-14 bg-danger/20 rounded-xl flex items-center justify-center mb-6 border border-danger/30 group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-7 w-7 text-danger" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Kinematic Risk Analysis</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              The Incident Analyzer continuously monitors edge sensor data. It calculates an instantaneous risk score by directly multiplying Peak G-Force vectors with train velocity. If anomalies exceed heuristic thresholds (e.g., G-force &gt; 7), <strong className="text-danger">MASS CASUALTY</strong> mode activates.
            </p>
            <div className="bg-[#0f172a] p-4 rounded-xl font-mono text-sm text-danger border border-white/5 overflow-x-auto shadow-inner relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-danger rounded-l-xl" />
              <span className="text-slate-500">{"// Unified Risk Score"}</span>
              <br/>
              <span className="text-white">Risk</span> = peak_g_force <span className="text-cyan">×</span> velocity_kmh
              <br/>
              <span className="text-white">Confidence</span> = 70 + (Risk / 40)
            </div>
          </motion.div>

          {/* Routing Card */}
          <motion.div variants={itemVariants} className="group bg-[#080c14] border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-emerald/50 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 rounded-full blur-3xl group-hover:bg-emerald/20 transition-all" />
            <div className="w-14 h-14 bg-emerald/20 rounded-xl flex items-center justify-center mb-6 border border-emerald/30 group-hover:scale-110 transition-transform">
              <MapIcon className="h-7 w-7 text-emerald" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Geospatial Routing Heuristics</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              During a crisis, speed is critical. The Medical Agent queries <strong className="text-white">OpenStreetMap</strong> using Haversine formulas to locate nearby trauma centers. The Dispatcher then provisions ambulances via greedy allocation, ensuring capacity constraints are met in real-time.
            </p>
            <div className="bg-[#0f172a] p-4 rounded-xl font-mono text-sm text-emerald border border-white/5 overflow-x-auto shadow-inner relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald rounded-l-xl" />
              <span className="text-slate-500">{"// Haversine Distance Optimization"}</span>
              <br/>
              <span className="text-white">a</span> = sin²(Δφ/2) + cos φ₁ ⋅ cos φ₂ ⋅ sin²(Δλ/2)
              <br/>
              <span className="text-white">Distance</span> = 2R ⋅ arcsin(√a)
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
