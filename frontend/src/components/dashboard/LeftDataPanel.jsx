import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, ServerCrash, CloudSun, CloudRain } from 'lucide-react';
import anime from 'animejs';
import useAppStore from '../../store/useAppStore';

// ── Typewriter ──────────────────────────────────────────────────────────────
const TypewriterLine = ({ text, delay, className }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    let t1, t2;
    t1 = setTimeout(() => {
      const tick = () => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
          t2 = setTimeout(tick, 22);
        }
      };
      tick();
    }, delay);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [text, delay]);

  return <p className={className}>{displayed || <span className="opacity-0">.</span>}</p>;
};

// ── Timed reveal block ──────────────────────────────────────────────────────
const RevealBlock = ({ afterMs, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), afterMs);
    return () => clearTimeout(t);
  }, [afterMs]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
      {children}
    </div>
  );
};

// ── Priority badge colour ───────────────────────────────────────────────────
const PRIORITY_STYLES = {
  RED:    'bg-danger/20 text-danger border-danger/40',
  ORANGE: 'bg-orange/20 text-orange border-orange/40',
  YELLOW: 'bg-warning/20 text-warning border-warning/40',
};

// ── Main component ──────────────────────────────────────────────────────────
export default function LeftDataPanel() {
  const { isEmergencyMode, isSimulating, trains, dispatchPlan } = useAppStore();
  const normalRef    = useRef(null);
  const emergencyRef = useRef(null);

  useEffect(() => {
    if (!isEmergencyMode && normalRef.current) {
      anime({ targets: normalRef.current,    opacity: [0, 1], translateX: [-20, 0], duration: 300, easing: 'easeOutQuad' });
    } else if (isEmergencyMode && emergencyRef.current) {
      anime({ targets: emergencyRef.current, opacity: [0, 1], translateX: [-20, 0], duration: 300, easing: 'easeOutQuad' });
    }
  }, [isEmergencyMode]);

  // Safely pull data from dispatch plan
  const plan     = dispatchPlan ?? {};
  const reasoning = Array.isArray(plan.reasoning) ? plan.reasoning[0] : (plan.reasoning ?? 'Sensor analysis complete.');
  const report   = plan.dispatch_report_structured ?? {};
  const actions  = report.immediate_actions  ?? [];
  const risks    = report.operational_risks  ?? [];
  const summary  = report.executive_summary  ?? '';
  const routes   = plan.ambulance_routes     ?? [];
  const priority = plan.priority_level       ?? '';

  return (
    <div className="w-[30%] min-w-[350px] max-w-[450px] m-4 rounded-3xl bg-slate-900/60 backdrop-blur-3xl border border-white/10 flex flex-col z-40 relative shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-500">

      {/* ══ NORMAL MODE ════════════════════════════════════════════════════════ */}
      {!isEmergencyMode && (
        <div ref={normalRef} className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto opacity-0">

          {/* Network status */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
            {isSimulating
              ? <AlertTriangle className="h-5 w-5 text-warning" />
              : <Activity      className="h-5 w-5 text-emerald" />}
            <h2 className={`font-bold tracking-wide uppercase text-sm ${isSimulating ? 'text-warning' : 'text-emerald'}`}>
              {isSimulating ? 'Network Status: Disrupted' : 'Network Status: Optimal'}
            </h2>
          </div>

          {/* Weather widget */}
          <div className={`border p-5 rounded-2xl flex items-center justify-between shrink-0 relative overflow-hidden group transition-colors duration-500 ${isSimulating ? 'bg-blue-950/40 border-primary/30' : 'bg-slate-800/40 border-white/10'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Local Weather</p>
              <p className="text-xl font-black text-white tracking-tight">{isSimulating ? 'Heavy Rain Warning' : 'Clear Skies'}</p>
              {isSimulating && <p className="text-xs text-primary/80 mt-0.5">MILP rerouting active</p>}
            </div>
            {isSimulating
              ? <CloudRain className="h-8 w-8 text-primary animate-pulse relative z-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              : <CloudSun  className="h-8 w-8 text-slate-300 relative z-10" />}
          </div>

          {/* Train list */}
          <div className="space-y-3">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Consists <span className="text-slate-600">({trains.length})</span>
            </h3>
            {trains.map((train) => (
              <div key={train.train_id || train.id} className="bg-slate-800/30 border border-white/10 p-4 rounded-xl hover:bg-slate-800/60 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white font-mono flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    <span>{train.train_id || train.id}</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider ${(train.delay_offset || 0) > 0 ? 'text-warning bg-warning/10' : 'text-emerald bg-emerald/10'}`}>
                    {(train.delay_offset || 0) > 0 ? `+${Math.round(train.delay_offset)}s DELAY` : 'ON TIME'}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1.5 mt-3">
                  <div className="flex justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Speed</span><span className="text-slate-200 font-medium">{Math.round(train.speed_kmh || 0)} km/h</span></div>
                  <div className="flex justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Platform</span><span className="text-slate-200 font-medium">{train.platform || 'Transit'}</span></div>
                  <div className="flex justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Status</span><span className={`font-medium ${(train.delay_offset || 0) > 0 ? 'text-warning' : 'text-emerald'}`}>{(train.delay_offset || 0) > 0 ? 'Delayed' : 'En Route'}</span></div>
                </div>
              </div>
            ))}
            {trains.length === 0 && <p className="text-sm text-slate-500 italic">Awaiting telemetry...</p>}
          </div>
        </div>
      )}

      {/* ══ EMERGENCY MODE ═════════════════════════════════════════════════════ */}
      {isEmergencyMode && (
        <div ref={emergencyRef} className="flex-1 flex flex-col bg-red-950/20 opacity-0">

          {/* Header */}
          <div className="px-6 py-4 border-b border-danger/20 bg-danger/10 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <ServerCrash className="h-5 w-5 text-danger animate-pulse" />
              <h2 className="text-danger font-bold tracking-wide uppercase text-sm animate-pulse">CRITICAL FAILURE</h2>
            </div>
            {priority && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.RED}`}>
                {priority} PRIORITY
              </span>
            )}
          </div>

          {/* Scrollable terminal */}
          <div className="flex-1 p-5 font-mono text-sm overflow-y-auto relative bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_4px]">
            <div className="absolute inset-0 bg-danger/5 pointer-events-none" />

            {dispatchPlan ? (
              <div className="space-y-3 relative z-10">

                {/* ── Agent pipeline lines ── */}
                <TypewriterLine
                  text={`> [Edge Sensor]: Emergency detected on ${plan.train_id}.`}
                  delay={100}
                  className="text-danger font-bold drop-shadow-[0_0_4px_rgba(239,68,68,0.7)]"
                />
                <TypewriterLine
                  text={`> [Analyzer]: ${reasoning}`}
                  delay={1200}
                  className="text-orange"
                />
                <TypewriterLine
                  text={`> [Medical]: ${plan.hospitals?.length ?? 0} trauma centers found within ${plan.search_radius_used_m ? (plan.search_radius_used_m / 1000).toFixed(0) + ' km' : 'search radius'}.`}
                  delay={3000}
                  className="text-cyan"
                />
                <TypewriterLine
                  text={`> [Allocator]: ${plan.total_ambulances} ambulances dispatched across ${plan.allocations?.length ?? 0} hospitals.`}
                  delay={4800}
                  className="text-cyan"
                />
                <TypewriterLine
                  text={`> [Router]: All routes planned. Confidence ${plan.confidence}%. Response target: ${plan.response_time ?? 'N/A'}.`}
                  delay={6200}
                  className="text-emerald font-bold"
                />

                {/* ── Allocations ── */}
                <RevealBlock afterMs={7500}>
                  <div className="mt-3 border-t border-white/5 pt-3 space-y-1">
                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping inline-block" />
                      Hospital Allocations
                    </p>
                    {(plan.allocations ?? []).map((a, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-l-2 border-danger/30 pl-2 py-0.5">
                        <span className="text-slate-300">{a.hospital}</span>
                        <span className="text-slate-400 ml-2 shrink-0">{a.ambulances_dispatched} unit{a.ambulances_dispatched !== 1 ? 's' : ''} · {a.distance_km?.toFixed(1)} km</span>
                      </div>
                    ))}
                  </div>
                </RevealBlock>

                {/* ── Ambulance ETAs ── */}
                {routes.length > 0 && (
                  <RevealBlock afterMs={9000}>
                    <div className="mt-3 border-t border-white/5 pt-3 space-y-1">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Ambulance ETAs</p>
                      {routes.map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-xs border-l-2 border-cyan/30 pl-2 py-0.5">
                          <span className="text-slate-300 truncate mr-2">{r.hospital}</span>
                          <span className="text-cyan shrink-0">{r.eta_minutes?.toFixed(0)} min · {r.distance_km?.toFixed(1)} km</span>
                        </div>
                      ))}
                    </div>
                  </RevealBlock>
                )}

                {/* ── Immediate actions ── */}
                {actions.length > 0 && (
                  <RevealBlock afterMs={10500}>
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Immediate Actions</p>
                      <ol className="space-y-1">
                        {actions.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-2 border-l-2 border-warning/40 pl-2 py-0.5">
                            <span className="text-warning shrink-0">{i + 1}.</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </RevealBlock>
                )}

                {/* ── Operational risks ── */}
                {risks.length > 0 && (
                  <RevealBlock afterMs={12000}>
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Operational Risks</p>
                      <ul className="space-y-1">
                        {risks.map((r, i) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2 border-l-2 border-danger/30 pl-2 py-0.5">
                            <span className="text-danger shrink-0">⚠</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </RevealBlock>
                )}

                {/* ── Executive summary ── */}
                {summary && (
                  <RevealBlock afterMs={13500}>
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Command Summary</p>
                      <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-emerald/40 pl-2">{summary}</p>
                    </div>
                  </RevealBlock>
                )}

                {/* ── Blinking cursor ── */}
                <RevealBlock afterMs={summary ? 14500 : 13000}>
                  <div className="pt-2 flex items-center text-danger font-bold animate-pulse">
                    <span>&gt; Dispatch complete. Awaiting field confirmation_</span>
                  </div>
                </RevealBlock>

              </div>
            ) : (
              <p className="text-orange animate-pulse">
                &gt; Waiting for LangGraph swarm response<span className="animate-ping ml-0.5">_</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
