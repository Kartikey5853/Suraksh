import { motion } from "framer-motion";
import { Shield, FileCheck, Fingerprint, Cloud, Brain, ArrowRight, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const features = [
  {
    icon: FileCheck,
    title: "Electronic Agreements",
    description: "Create, send, and sign documents digitally with legally binding e-signatures and full audit trails.",
  },
  {
    icon: Fingerprint,
    title: "Identity Verification",
    description: "Multi-factor identity verification using government ID scanning and facial recognition technology.",
  },
  {
    icon: Cloud,
    title: "Secure Cloud Storage",
    description: "Enterprise-grade encrypted storage for all your sensitive documents with role-based access control.",
  },
  {
    icon: Brain,
    title: "AI Document Analysis",
    description: "Intelligent document parsing and risk analysis powered by advanced machine learning models.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <TriangleLogo />
            <span className="font-display font-semibold tracking-wider text-foreground">SURAKSH</span>
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/user/login")}>
              User Login
            </Button>
            <Button size="sm" onClick={() => navigate("/user/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <polygon points="300,50 50,550 550,550" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="0.5" />
            <polygon points="300,100 100,500 500,500" fill="none" stroke="hsl(175,70%,40%)" strokeWidth="0.3" />
            <polygon points="300,150 150,450 450,450" fill="none" stroke="hsl(215,20%,40%)" strokeWidth="0.2" />
          </svg>
        </div>
        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Enterprise-grade security platform
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mb-6 text-5xl font-display font-bold tracking-tight text-foreground md:text-7xl"
            >
              Suraksh
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mb-8 text-xl text-muted-foreground md:text-2xl"
            >
              Secure Digital Documentation & Identity Verification
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={3}
              className="mb-10 mx-auto max-w-xl text-muted-foreground"
            >
              A unified platform for secure document management, digital signatures, and identity verification — built for enterprises that demand trust.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/user/register")} className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}>
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-card">
        <div className="container">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 variants={fadeUp} custom={0} className="mb-4 text-3xl font-display font-bold text-foreground md:text-4xl">
              Built for Security
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mx-auto max-w-lg text-muted-foreground">
              Every feature designed with trust and compliance at its core
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-border bg-muted p-2.5 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="mb-2 font-display font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="mb-4 text-2xl font-display font-bold text-foreground">Ready to secure your workflow?</h2>
            <p className="mb-8 text-muted-foreground">
              Join organizations that trust Suraksh for secure digital documentation.
            </p>
            <Button size="lg" onClick={() => navigate("/user/register")} className="gap-2">
              Create Free Account <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <TriangleLogo />
              <span className="font-display font-semibold tracking-wider text-foreground">SURAKSH</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 Suraksh. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const TriangleLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6">
    <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
    <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
  </svg>
);

export default LandingPage;
