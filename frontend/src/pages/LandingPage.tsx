import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HorizonHeroSection } from "@/components/ui/horizon-hero-section";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl bg-black/70 backdrop-blur-sm border border-yellow-600/20 rounded-3xl px-12 py-14 shadow-[0_0_80px_rgba(212,175,55,0.1)]"
        >
          {/* Title in Samarkan */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6"
            style={{
              fontFamily: "'Samarkan', serif",
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              color: "#d4af37",
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Suraksh
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg lg:text-xl text-white/80 mb-10 leading-relaxed"
          >
            India's trusted platform for digital documents<br />and legally-binding e-agreements.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2 group/btn px-8 py-6 text-lg"
              onClick={() => navigate("/user/login")}
            >
              User Login
              <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-500 text-white border-0 gap-2 group/btn px-8 py-6 text-lg"
              onClick={() => navigate("/admin/login")}
            >
              Admin Portal
              <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Scrollable Hero Section */}
      <HorizonHeroSection />

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-6 h-6">
              <polygon points="20,4 6,34 34,34" fill="none" stroke="#d4af37" strokeWidth="2" />
              <polygon points="20,12 12,30 28,30" fill="#d4af37" opacity="0.6" />
            </svg>
            <span className="font-bold tracking-widest text-white/80 text-sm">SURAKSH</span>
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
