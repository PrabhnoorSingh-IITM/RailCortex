import React from 'react';
import { Github, PlayCircle, ShieldCheck, Mail, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & About */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4">RAILCORTEX</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              A Dual-Mode Cyber-Physical System. Predictive analytics for routine delays, and an autonomous Agentic Swarm for emergency response.
            </p>
            <p className="text-primary font-semibold text-sm">
              Built for FAR AWAY 2026
            </p>
          </div>

          {/* Team Info */}
          <div className="col-span-1 md:col-span-1">
            <h4 className="text-lg font-bold text-white mb-4">Team NexyByte</h4>
            <ul className="text-slate-400 text-sm space-y-2 mb-4">
              <li>Prabhnoor Singh</li>
              <li>Riya Mahajan</li>
              <li>Harshit</li>
              <li>Mehakpreet Kaur</li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              * See GitHub repo and git tree for individual contributions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-1">
            <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
            <ul className="text-slate-400 text-sm space-y-3">
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center space-x-2">
                  <PlayCircle className="h-4 w-4" /> <span>Live Dashboard</span>
                </Link>
              </li>
              <li>
                <a href="#architecture" className="hover:text-primary transition-colors flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4" /> <span>System Architecture</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@nexybyte.example.com" className="hover:text-primary transition-colors flex items-center space-x-2">
                  <Mail className="h-4 w-4" /> <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Actions & Stack */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start md:items-end">
            <a 
              href="https://github.com/PrabhnoorSingh-IITM/RailCortex" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-surface hover:bg-slate-800 px-6 py-3 rounded-lg text-white font-semibold transition-colors border border-white/10 w-full justify-center md:w-auto mb-6"
            >
              <Github className="h-5 w-5" />
              <span>View Source Code</span>
            </a>
            
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Powered By</p>
              <div className="flex flex-wrap justify-start md:justify-end gap-2 text-xs text-slate-400 font-mono">
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">React</span>
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">Python</span>
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">LangGraph</span>
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">Leaflet</span>
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">KiCad</span>
                <span className="bg-slate-900 px-2 py-1 rounded border border-white/5">OpenAI</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Team NexyByte. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Hackathon Submission Version 1.0.0</p>
        </div>
        
      </div>
    </footer>
  );
}
