import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { authApi, saveSession } from "@/lib/api";

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      saveSession(data);
      navigate("/user/otp");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              <span style={{ fontFamily: "'Samarkan', serif", fontSize: '22px', color: '#10b981', letterSpacing: '0.05em' }}>Suraksh</span>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              Secure Identity.<br />Digital Agreements.
            </h1>
            <p className="text-emerald-300/70 text-sm max-w-xs">
              India's trusted platform for legally binding e-agreements and Aadhaar-verified identity.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — Login form ── */}
      <div className="relative z-10 ml-auto w-full lg:w-[55%] min-h-screen flex items-center justify-end pr-8 lg:pr-16">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-emerald-900/30 p-8 shadow-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 lg:hidden">
                <span style={{ fontFamily: "'Samarkan', serif", fontSize: '18px', color: '#10b981', letterSpacing: '0.05em' }}>Suraksh</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/60" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="password" type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/60" />
                </div>
              </div>

              {error && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</p>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm">
              <p className="text-gray-500">
                Don&apos;t have an account?{" "}
                <Link to="/user/register" className="text-emerald-400 font-medium hover:underline">Register</Link>
              </p>
              <button onClick={() => navigate("/")} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                ← Back to home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserLogin;
