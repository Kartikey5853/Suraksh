import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { authApi, saveSession } from "@/lib/api";

const UserRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      saveSession(data);
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex">
      {/* ── Left triangle panel — EtherealShadow emerald ── */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-[58%] z-0"
        style={{ clipPath: "polygon(0 0, 100% 0, 72% 100%, 0 100%)" }}
      >
        <EtherealShadow
          color="rgba(16,185,129,0.9)"
          animation={{ scale: 80, speed: 75 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
          style={{ width: "100%", height: "100%", background: "#061a10" }}
        />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-12 pb-16 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 40 40" className="w-9 h-9">
                <polygon points="20,4 6,34 34,34" fill="none" stroke="#10b981" strokeWidth="2" />
                <polygon points="20,12 12,30 28,30" fill="#059669" opacity="0.8" />
              </svg>
              <span className="text-emerald-400 font-mono font-bold tracking-widest text-sm uppercase">Suraksh</span>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              Join Suraksh.<br />Start Verified.
            </h1>
            <p className="text-emerald-300/70 text-sm max-w-xs">
              Create your account and get Aadhaar-verified in minutes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — Register form ── */}
      <div className="relative z-10 ml-auto w-full lg:w-[52%] flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-white/50 text-sm mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white/70 text-xs mb-1.5 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="name" type="text" required value={form.name} onChange={update("name")}
                    placeholder="Your name"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/60 focus:bg-white/8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-white/70 text-xs mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="email" type="email" required value={form.email} onChange={update("email")}
                    placeholder="you@example.com"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/60 focus:bg-white/8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-white/70 text-xs mb-1.5 block">Phone <span className="text-white/30">(optional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="phone" type="tel" value={form.phone} onChange={update("phone")}
                    placeholder="+91 98765 43210"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/60 focus:bg-white/8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-white/70 text-xs mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="password" type="password" required value={form.password} onChange={update("password")}
                    placeholder="Create a password"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/60 focus:bg-white/8"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400/90 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-white/40">
              Already have an account?{" "}
              <Link to="/user/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserRegister;
