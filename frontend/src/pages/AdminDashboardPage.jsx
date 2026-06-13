import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Train, Activity, Settings, LogOut, Radio, Database, Terminal } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isEmergencyMode, dispatchPlan, trains, wsConnected } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white font-sans selection:bg-primary/30 flex">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center space-x-3">
          <Train className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">RailCortex Ops</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className="h-5 w-5" />
            <span>Live Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('override')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'override' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Radio className="h-5 w-5" />
            <span>Manual Override</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'logs' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Database className="h-5 w-5" />
            <span>System Logs</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center space-x-3 text-danger hover:bg-danger/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1)_0%,rgba(15,23,42,1)_100%)]">
        <div className="p-10 max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
              <p className="text-slate-400">Authorized personnel only. Monitor and override autonomous systems.</p>
            </div>
            
            {isEmergencyMode && (
              <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-2 rounded-lg font-bold flex items-center space-x-2 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <ShieldAlert className="h-5 w-5" />
                <span>ACTIVE CRISIS</span>
              </div>
            )}
          </div>

          {/* Content Area Based on Active Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">System Status</h3>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isEmergencyMode ? 'bg-danger shadow-[0_0_10px_#ef4444]' : 'bg-emerald shadow-[0_0_10px_#10b981]'} animate-pulse`}></div>
                  <span className={`text-2xl font-black ${isEmergencyMode ? 'text-danger' : 'text-white'}`}>{isEmergencyMode ? 'EMERGENCY' : 'NOMINAL'}</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Active Consists</h3>
                <span className="text-3xl font-black text-primary">{trains.length}</span>
              </div>
              <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Network Status</h3>
                <span className={`text-3xl font-black ${wsConnected ? 'text-cyan' : 'text-danger'}`}>{wsConnected ? 'CONNECTED' : 'OFFLINE'}</span>
              </div>
            </div>
          )}

          {activeTab === 'override' && (
          <div className="bg-slate-900 border border-white/10 p-8 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Radio className="h-6 w-6 text-warning" />
              <h2 className="text-xl font-bold">Manual Human Override</h2>
            </div>
            <p className="text-slate-400 mb-8">
              Use this interface to pause LangGraph autonomous routing and manually dispatch medical resources.
            </p>
            
            {isEmergencyMode && dispatchPlan ? (
              <div className="bg-slate-950 border border-white/5 p-6 rounded-lg font-mono text-sm space-y-4">
                <div className="text-danger font-bold uppercase">Target: {dispatchPlan.train_id}</div>
                <div className="grid grid-cols-2 gap-4 text-slate-300">
                  <div>Auto-Allocated Ambulances: {dispatchPlan.total_ambulances}</div>
                  <div>Confidence: {dispatchPlan.confidence || 85}%</div>
                </div>
                <div className="flex space-x-4 mt-6">
                  <button className="bg-warning hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors flex-1">
                    Override AI Dispatch
                  </button>
                  <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-colors border border-white/10 flex-1">
                    View Sensor Logs
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-dashed border-white/10 p-10 rounded-lg text-center text-slate-500">
                No active emergencies. The LangGraph swarm is in standby mode.
              </div>
            )}
          </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-900 border border-white/10 p-8 rounded-xl shadow-lg h-[500px] flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <Terminal className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Raw System Logs</h2>
              </div>
              <div className="flex-1 bg-slate-950 border border-white/5 p-4 rounded-lg font-mono text-xs text-slate-400 overflow-y-auto space-y-2">
                <p><span className="text-emerald">[SYS]</span> Edge node heartbeat confirmed.</p>
                <p><span className="text-emerald">[SYS]</span> Model severity_model.pkl loaded successfully.</p>
                <p><span className="text-emerald">[SYS]</span> WebSockets bound to port 8000.</p>
                <p><span className="text-primary">[NET]</span> Stream starting for TRN-12723</p>
                <p><span className="text-primary">[NET]</span> Stream starting for TRN-22416</p>
                {isEmergencyMode && (
                  <>
                    <p className="text-danger">![ERR] Peak G-Force anomaly detected (8.4g) on TRN-001</p>
                    <p className="text-danger">![ERR] Connection lost to carriage 4 sensors.</p>
                    <p className="text-warning">[WRN] LangGraph swarm instantiated.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-slate-900 border border-white/10 p-8 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="h-6 w-6 text-slate-300" />
                <h2 className="text-xl font-bold">Admin Configuration</h2>
              </div>
              <p className="text-slate-500 italic">Configuration settings will be available when database persistence is fully wired.</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
