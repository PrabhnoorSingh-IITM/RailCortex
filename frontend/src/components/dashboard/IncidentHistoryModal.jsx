import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, MapPin, Activity, Train, Loader2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const SEVERITY_STYLES = {
  HIGH:   'bg-danger/20 text-danger border border-danger/30',
  MEDIUM: 'bg-warning/20 text-warning border border-warning/30',
  LOW:    'bg-emerald/20 text-emerald border border-emerald/30',
};

export default function IncidentHistoryModal() {
  const { isHistoryModalOpen, setHistoryModalOpen } = useAppStore();

  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch from real backend when modal opens
  useEffect(() => {
    if (!isHistoryModalOpen) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/emergency/history?limit=50`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setIncidents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isHistoryModalOpen]);

  if (!isHistoryModalOpen) return null;

  const filtered = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (inc.train_id || '').toLowerCase().includes(q) ||
      (inc.event_type || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

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
            <p className="text-sm text-slate-400 mt-1">
              Past emergency deployments from the RailCortex database.
            </p>
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
              placeholder="Search by Train ID or Event Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 border border-white/10 px-4 py-2 rounded-lg text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading incident history...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-danger font-semibold mb-1">Failed to load history</p>
              <p className="text-slate-500 text-sm">{error}</p>
              <p className="text-slate-600 text-xs mt-2">
                Make sure the backend is running on port 8000
              </p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-400 font-semibold">No incidents found</p>
              <p className="text-slate-600 text-sm mt-1">
                {searchQuery ? 'Try a different search term.' : 'No emergencies have been recorded yet.'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-slate-800/40 border border-white/5 hover:border-primary/30 p-5 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-white">
                        INC-{String(incident.id).padStart(4, '0')}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.LOW
                        }`}
                      >
                        {incident.severity} SEVERITY
                      </span>
                      {incident.casualties != null && (
                        <span className="text-xs text-slate-400">
                          {incident.casualties} casualt{incident.casualties !== 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDate(incident.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Train className="h-4 w-4 text-slate-500" />
                      <span>{incident.train_id || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>
                        {incident.lat != null && incident.lon != null
                          ? `${Number(incident.lat).toFixed(3)}°N, ${Number(incident.lon).toFixed(3)}°E`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-end items-center text-slate-400 group-hover:text-primary transition-colors text-xs uppercase tracking-wide">
                      {incident.event_type || 'Unknown Event'} &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
