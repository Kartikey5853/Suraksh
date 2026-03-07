import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { authApi, saveSession } from "@/lib/api";

const AdminLogin = () => {
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
      const { data } = await authApi.adminLogin({ email, password });
      saveSession(data);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex">
      {/* ── Right triangle panel — EtherealShadow sapphire ── */}
      <div
        className="absolute inset-y-0 right-0 w-full lg:w-[58%] z-0"
        style={{ clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)" }}
      >
        <EtherealShadow
          color="rgba(14,165,233,0.9)"
          animation={{ scale: 80, speed: 75 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
          style={{ width: "100%", height: "100%", background: "#040f1a" }}
        />
        <div className="absolute inset-0 flex flex-col items-end justify-end p-12 pb-16 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <motion.div
            className="text-right"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex items-center justify-end gap-3 mb-4">
              <span className="text-sky-400 font-mono font-bold tracking-widest text-sm uppercase">Admin Portal</span>
              <ShieldCheck className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              Manage. Verify.<br />Control.
            </h1>
            <p className="text-sky-300/70 text-sm max-w-xs ml-auto">
              Oversee identity verification, document workflows, and platform administration.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Left panel — Login form ── */}
      <div className="relative z-10 mr-auto w-full lg:w-[55%] min-h-screen flex items-center justify-start pl-8 lg:pl-16">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-sky-900/30 p-8 shadow-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
                <span className="text-sky-400 font-mono font-bold tracking-widest text-sm uppercase">Admin Portal</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Login</h2>
              <p className="text-gray-400 text-sm mt-1">Access the administration panel</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="admin@suraksh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-sky-500/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-sky-500/60"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white border-0"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm">
              <p className="text-gray-500">
                New staff member?{" "}
                <Link to="/admin/register" className="text-sky-400 font-medium hover:underline">
                  Register with invite code
                </Link>
              </p>
              <button
                onClick={() => navigate("/")}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
