import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Train, ArrowRight, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate authentication for MVP
    if (username === 'admin' && password === 'admin') {
      navigate('/admin/dashboard');
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <Train className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">RailCortex Ops</h1>
          <p className="text-slate-400 text-sm">Secure Command Center Login</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative">
          
          {error && (
            <div className="absolute -top-12 left-0 right-0 bg-danger/20 border border-danger/50 text-danger text-sm font-bold px-4 py-2 rounded-lg text-center flex items-center justify-center space-x-2 animate-pulse">
              <ShieldAlert className="h-4 w-4" />
              <span>ACCESS DENIED</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operator ID</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Enter ID (admin)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Authorization Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Enter Key (admin)"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Initialize Override</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate('/dashboard')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Return to Public Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
