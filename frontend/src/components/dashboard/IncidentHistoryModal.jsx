import React from 'react';
import { X, Search, Calendar, MapPin, Activity, Train } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function IncidentHistoryModal() {
  const { isHistoryModalOpen, setHistoryModalOpen } = useAppStore();

  if (!isHistoryModalOpen) return null;

  // Placeholder data for frontend demonstration
  const mockIncidents = [
    {
      id: "INC-2026-001",
      date: "2026-06-13 14:32:00",
      train_id: "RAJ-12345",
      location: "Kanpur Sector",
      severity: "HIGH",
      casualties: 12,
      status: "Resolved"
    },
    {
      id: "INC-2026-002",
      date: "2026-06-10 09:15:00",
      train_id: "EXP-99812",
      location: "Delhi Outer",
      severity: "MEDIUM",
      casualties: 4,
      status: "Archived"
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Incident History Log</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Review past emergency deployments and post-incident reports.</p>
          </div>
          <button 
            onClick={() => setHistoryModalOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex space-x-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Train ID or Location..." 
              className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
            />
          </div>
          <button className="flex items-center space-x-2 bg-slate-800 border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg text-sm text-slate-300 transition-colors">
            <Calendar className="h-4 w-4" />
            <span>Filter by Date</span>
          </button>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {mockIncidents.map((incident) => (
              <div key={incident.id} className="bg-slate-800/40 border border-white/5 hover:border-primary/30 p-5 rounded-xl transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-white">{incident.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      incident.severity === 'HIGH' ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-warning/20 text-warning border border-warning/30'
                    }`}>
                      {incident.severity} SEVERITY
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{incident.date}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Train className="h-4 w-4 text-slate-500" />
                    <span>{incident.train_id}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span>{incident.location}</span>
                  </div>
                  <div className="flex justify-end items-center text-slate-400 group-hover:text-primary transition-colors">
                    View Full Report &rarr;
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">
                Note: This is a frontend placeholder. The backend SQLite database integration is required to fetch real history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
