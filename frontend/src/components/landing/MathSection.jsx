import React, { useEffect, useRef } from 'react';
import { Brain, Calculator, ShieldAlert, GitBranch } from 'lucide-react';
import anime from 'animejs';

export default function MathSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          anime({
            targets: '.math-item',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(200),
            duration: 800,
            easing: 'easeOutQuad'
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-background relative border-t border-white/5" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Mathematical Foundations</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            RailCortex is not a wrapper. It uses deep mathematical abstractions to power the Digital Twin and the Agentic Swarm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Card 1: GNN */}
          <div className="math-item opacity-0 bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.05)] hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">SAGE-Het Graph Neural Networks</h3>
            <p className="text-slate-400 mb-6 line-clamp-4">
              To predict cascading delays (the "Domino Effect"), standard time-series models fail because they ignore track geography. We use a Spatial-Temporal Heterogeneous Graph (SAGE-Het) to model the network. Delay prediction depends on the aggregated state of upstream trains and adjacent stations.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-emerald border border-white/5 overflow-x-auto">
              <span className="text-slate-500">{"// GraphSAGE Message Passing"}</span>
              <br/>
              h_v(k) = σ(W(k) • CONCAT(h_v(k-1), AGG(N(v))))
            </div>
          </div>

          {/* Card 2: MILP */}
          <div className="math-item opacity-0 bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.05)] hover:border-warning/50 transition-colors">
            <div className="w-14 h-14 bg-warning/20 rounded-xl flex items-center justify-center mb-6">
              <Calculator className="h-7 w-7 text-warning" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Mixed-Integer Linear Programming</h3>
            <p className="text-slate-400 mb-6 line-clamp-4">
              When the GNN predicts a conflict, the AI cannot use a stochastic LLM to reroute trains (since LLMs can hallucinate). Instead, we solve the Train Platforming Problem (TPP) using exact MILP solvers to guarantee physical safety.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-warning border border-white/5 overflow-x-auto">
              <span className="text-slate-500">{"// Objective: Minimize Delays & Penalties"}</span>
              <br/>
              Minimize Z = Σ (C_delay • Δt_i + C_plat • ρ_i,p) x_i,p,t
            </div>
          </div>

          {/* Card 3: Kinematics */}
          <div className="math-item opacity-0 bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.05)] hover:border-danger/50 transition-colors">
            <div className="w-14 h-14 bg-danger/20 rounded-xl flex items-center justify-center mb-6">
              <ShieldAlert className="h-7 w-7 text-danger" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Edge Kinematics & Severity Index</h3>
            <p className="text-slate-400 mb-6 line-clamp-4">
              The Incident Analyzer Agent calculates the physical severity of a crash. Our custom IoT edge node measures Peak G-Force vectors which are combined with kinetic energy formulas to derive a Severity Index (S). If S exceeds a threshold, the swarm triggers MASS CASUALTY mode.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-danger border border-white/5 overflow-x-auto">
              <span className="text-slate-500">{"// Unified Severity Index"}</span>
              <br/>
              S = α√(Gx² + Gy² + Gz²) + β(v_initial / Δt_stop)
            </div>
          </div>

          {/* Card 4: Routing */}
          <div className="math-item opacity-0 bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.05)] hover:border-emerald/50 transition-colors">
            <div className="w-14 h-14 bg-emerald/20 rounded-xl flex items-center justify-center mb-6">
              <GitBranch className="h-7 w-7 text-emerald" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Dynamic Dijkstra Routing</h3>
            <p className="text-slate-400 mb-6 line-clamp-4">
              The Route Planner Agent uses Dijkstra's Algorithm for ambulances, but dynamically adjusts the edge weights based on heavy-vehicle constraints. It mathematically penalizes narrow roads and traffic density to ensure the fastest physical response.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-emerald border border-white/5 overflow-x-auto">
              <span className="text-slate-500">{"// Edge Weight Adjustment"}</span>
              <br/>
              c_amb(u,v) = Dist(u,v)/[Speed(u,v)•(1-ρ)] + Penalty(W)
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
