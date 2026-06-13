import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AlertTriangle, TrendingDown, CloudRain } from 'lucide-react';

export default function ProblemScroll() {
  const containerRef = useRef(null);

  // We track the scroll progress of this massive 400vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // --- Background Grid Scaling ---
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 2]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 0.4, 0.4, 0.1]);

  // --- Frame 1: Intro / Problem 1 ---
  // Active from 0% to 33%
  const opacity1 = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.35], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.35], [50, 0, 0, -50]);

  // --- Frame 2: Problem 2 ---
  // Active from 33% to 66%
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.4, 0.55, 0.65], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.25, 0.4, 0.55, 0.65], [50, 0, 0, -50]);

  // --- Frame 3: Problem 3 ---
  // Active from 66% to 100%
  const opacity3 = useTransform(scrollYProgress, [0.55, 0.7, 0.9, 1], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.55, 0.7, 0.9, 1], [50, 0, 0, -50]);

  return (
    <section 
      id="problem" 
      ref={containerRef} 
      className="relative h-[400vh] bg-slate-950"
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Apple-style background grid that zooms in as you scroll */}
        <motion.div 
          style={{ scale: bgScale, opacity: bgOpacity }}
          className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none"
        />

        {/* --- Frame 1 --- */}
        <motion.div 
          style={{ opacity: opacity1, y: y1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-transform"
        >
          <div className="bg-danger/10 border border-danger/30 p-6 rounded-full mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="h-16 w-16 text-danger" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Seconds <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">Cost Lives.</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed font-light">
            Traditional networks rely on manual phone calls. Our <strong className="text-white">LangGraph AI Swarm</strong> is triggered by hardware the millisecond an impact occurs, bypassing human latency.
          </p>
        </motion.div>

        {/* --- Frame 2 --- */}
        <motion.div 
          style={{ opacity: opacity2, y: y2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-transform"
        >
          <div className="bg-orange/10 border border-orange/30 p-6 rounded-full mb-8 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
            <TrendingDown className="h-16 w-16 text-orange-500" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Predictive <span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">Intelligence.</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed font-light">
            We don't just react. We analyze kinematic energy using <strong className="text-white">scikit-learn models</strong> to predict severity and casualties instantly.
          </p>
        </motion.div>

        {/* --- Frame 3 --- */}
        <motion.div 
          style={{ opacity: opacity3, y: y3 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-transform"
        >
          <div className="bg-cyan/10 border border-cyan/30 p-6 rounded-full mb-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <CloudRain className="h-16 w-16 text-cyan" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Digital <span className="text-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">Twin.</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed font-light">
            A live <strong className="text-white">WebSocket</strong> telemetry feed continuously updates train coordinates on a React-Leaflet dashboard in real-time.
          </p>
        </motion.div>

        {/* Scroll Indicator at bottom of viewport */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 opacity-50">
          <span className="text-xs uppercase tracking-[0.3em] text-white">Keep Scrolling</span>
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>

      </div>
    </section>
  );
}
