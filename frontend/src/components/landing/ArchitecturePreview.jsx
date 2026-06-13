import React, { useEffect, useRef } from 'react';
import { Cpu, Server, Network, Map as MapIcon, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import NodeGraph from '../architecture/NodeGraph';

export default function ArchitecturePreview() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          anime({
            targets: '.arch-item',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(300),
            duration: 800,
            easing: 'easeOutQuad'
          });

          // Continuous shockwave for the edge node
          anime({
            targets: '.shockwave',
            scale: [1, 2],
            opacity: [1, 0],
            duration: 2000,
            loop: true,
            easing: 'easeOutQuad'
          });

          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="architecture" className="py-32 bg-deepslate relative border-t border-white/5" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Backend Simulation</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From the physical edge to the agentic swarm. Watch the data flow in real-time.
          </p>
        </div>

        <div className="relative w-full h-[600px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 mt-12 arch-item opacity-0">
          <NodeGraph />
        </div>

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
