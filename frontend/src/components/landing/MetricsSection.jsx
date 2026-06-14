import React from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';

export default function MetricsSection() {
  const { trains, isEmergencyMode } = useAppStore();

  const activeConsists = trains.length;
  const displayConsists = activeConsists;
  
  const totalDelay = trains.reduce((acc, train) => acc + (train.delay_offset || 0), 0);
  const avgDelay = activeConsists > 0 ? (totalDelay / activeConsists).toFixed(1) : '0.0';

  const systemStatus = activeConsists === 0 ? 'MONITORING' : (isEmergencyMode ? 'EMERGENCY' : 'NOMINAL');

  const metrics = [
    { value: displayConsists.toString(), label: 'Active Connected Consists', color: 'from-cyan to-blue-500' },
    { value: `+${avgDelay}m`, label: 'Live Average Network Delay', color: 'from-emerald to-green-500' },
    { value: systemStatus, label: 'Current Swarm Status', color: isEmergencyMode ? 'from-danger to-orange' : 'from-white to-slate-500' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section id="impact" className="py-32 bg-[#080c14] border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 flex justify-center items-center opacity-30 pointer-events-none">
        <div className="w-[800px] h-[300px] bg-cyan/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-12 text-center"
        >
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="group p-10 rounded-3xl bg-[#0f172a]/80 border border-white/5 hover:border-white/20 backdrop-blur-md shadow-2xl transition-all hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className={`text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br mb-4 tracking-tighter drop-shadow-lg ${metric.color}`}>
                {metric.value}
              </div>
              <p className="text-lg text-slate-400 font-medium tracking-wide uppercase text-sm mt-2">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
