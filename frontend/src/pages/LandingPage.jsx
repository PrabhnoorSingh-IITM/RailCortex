import React from 'react';
import NavBar from '../components/landing/NavBar';
import HeroSection from '../components/landing/HeroSection';
import ProblemScroll from '../components/landing/ProblemScroll';
import DualModeReveal from '../components/landing/DualModeReveal';
import ArchitecturePreview from '../components/landing/ArchitecturePreview';
import MathSection from '../components/landing/MathSection';
import MetricsSection from '../components/landing/MetricsSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <NavBar />
      <HeroSection />
      <ProblemScroll />
      <DualModeReveal />
      <ArchitecturePreview />
      <MathSection />
      <MetricsSection />
      <Footer />
    </div>
  );
}

