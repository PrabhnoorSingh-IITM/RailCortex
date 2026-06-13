import React from 'react';
import { Train, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <Train className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              RailCortex
            </span>
          </div>
          
          {/* Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#problem" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">The Problem</a>
              <a href="#solution" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Architecture</a>
              <a href="#impact" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Impact</a>
            </div>
          </div>
          
          {/* CTA & Github */}
          <div className="flex items-center space-x-4">
            <a href="https://github.com/PrabhnoorSingh-IITM/RailCortex" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              <Github className="h-6 w-6" />
            </a>
            <Link to="/dashboard" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Launch Digital Twin
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
