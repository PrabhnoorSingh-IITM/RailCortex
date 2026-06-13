import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function MetricsSection() {
  const sectionRef = useRef(null);

  const metrics = [
    { value: '18.4%', label: 'Reduction in Cascading Delays' },
    { value: '0', label: 'Human Clicks for Emergency Dispatch' },
    { value: '< 3s', label: 'From Physical Impact to Ambulance Routing' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          anime({
            targets: '.metric-card',
            opacity: [0, 1],
            scale: [0.8, 1],
            delay: anime.stagger(200),
            duration: 800,
            easing: 'easeOutBack'
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section id="impact" className="py-32 bg-background border-t border-white/5" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="metric-card opacity-0 p-8 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-sm"
            >
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-4 tracking-tighter">
                {metric.value}
              </div>
              <p className="text-lg text-slate-400 font-medium">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
