import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import anime from 'animejs';

export default function ProblemScroll() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Play animation once when scrolled into view
          anime({
            targets: '.problem-card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(200),
            duration: 1000,
            easing: 'easeOutExpo'
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

  const problems = [
    {
      icon: <AlertTriangle className="h-10 w-10 text-danger" />,
      title: "Delayed Emergency Response",
      desc: "Traditional rail networks rely on manual phone calls and radio relays during derailments, costing precious minutes when trauma care is needed instantly."
    },
    {
      icon: <TrendingDown className="h-10 w-10 text-orange" />,
      title: "Cascading Network Delays",
      desc: "A single track blockage causes a ripple effect. Without global network awareness, dispatchers struggle to optimally reroute trains, leading to massive logistical bottlenecks."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Static Weather Constraints",
      desc: "Trains run on fixed schedules that don't adapt to micro-climate changes. Heavy rain or fog isn't accounted for dynamically, reducing safety margins."
    }
  ];

  return (
    <section id="problem" className="py-32 bg-slate-900 border-t border-white/5 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">The Legacy Bottleneck</h2>
          <p className="text-slate-400 max-w-3xl mx-auto text-lg">
            Railways are inherently complex physical networks governed by outdated software. We are replacing rigid, siloed systems with an intelligent, self-healing architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((prob, idx) => (
            <div key={idx} className="problem-card opacity-0 bg-slate-800/50 border border-slate-700/50 p-8 rounded-xl hover:border-slate-500 transition-colors">
              <div className="bg-slate-900/50 w-16 h-16 rounded-lg flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                {prob.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{prob.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {prob.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
