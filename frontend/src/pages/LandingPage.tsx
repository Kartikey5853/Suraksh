import React from "react";
import { HorizonHeroSection } from "@/components/ui/horizon-hero-section";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Full-screen scrollable hero */}
      <HorizonHeroSection />

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Samarkan', serif", fontSize: '16px', color: '#d4af37', letterSpacing: '0.04em' }}>Suraksh</span>
          </div>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/80 transition-colors">About</a>
            <a href="#" className="hover:text-white/80 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/80 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/80 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-white/30">© 2026 Suraksh. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
