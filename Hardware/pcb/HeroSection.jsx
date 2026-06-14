import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function HeroSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 1500
    });

    tl.add({
      targets: '.hero-grid',
      opacity: [0, 0.5],
      duration: 2000
    })
    .add({
      targets: '.hero-badge',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800
    }, '-=1500')
    .add({
      targets: '.hero-title',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1000
    }, '-=600')
    .add({
      targets: '.hero-subtitle',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000
    }, '-=800')
    .add({
      targets: '.hero-buttons',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800
    }, '-=800')
    .add({
      targets: '.hero-data-stream',
      opacity: [0, 1],
      height: ['0%', '100%'],
      duration: 1500,
      easing: 'easeInOutQuad'
    }, '-=1000');
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-deepslate pt-20" ref={containerRef}>
      {/* Background Grids and Glowing Nodes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] hero-grid opacity-0" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-danger/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        
        {/* Status Badge */}
        <div className="inline-block hero-badge opacity-0 mb-6">
          <div className="flex items-center space-x-2 bg-slate-800/50 border border-primary/30 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-mono text-primary tracking-wider uppercase">System Online: All nodes operational</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 hero-title opacity-0 text-white">
          Predictive Intelligence for <br/>
          <span className="bg-gradient-to-r from-primary to-cyan text-transparent bg-clip-text">
            Railway Networks
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 hero-subtitle opacity-0">
          RailCortex fuses deterministic <strong className="text-white">MILP mathematical routing</strong> with a <strong className="text-white">LangGraph</strong> agentic swarm. It analyzes live <strong className="text-white">WebSocket</strong> telemetry to prevent gridlock via PuLP, instantly detect IoT physical impacts, and autonomously dispatch trauma resources.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 hero-buttons opacity-0">
          <a href="#architecture" className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center group">
            Explore Architecture
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
          <a href="https://drive.google.com/file/d/1XESk1WhmcyDZzcQoyr-ekqZNMPGzPJtn/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded transition-all flex items-center">
            Watch Demo Video
          </a>
          <a href="https://drive.google.com/file/d/1N0aOrDR9K62Z9wJUEEKm0sZDDuzc8ooX/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded transition-all flex items-center">
            View Pitch Deck
          </a>
        </div>
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-primary/50 to-transparent hero-data-stream opacity-0" />
      <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-danger/30 to-transparent hero-data-stream opacity-0" />
    </section>
  );
}
