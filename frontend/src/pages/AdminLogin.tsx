import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex bg-suraksh-navy">
      {/* Left - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-suraksh-glow" />
              <span className="font-display font-semibold tracking-wider text-suraksh-glow text-sm uppercase">Admin Portal</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-primary-foreground">Admin Login</h2>
            <p className="text-suraksh-slate text-sm mt-1">Access the administration panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-suraksh-slate">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-suraksh-slate" />
                <Input
                  type="email"
                  placeholder="admin@suraksh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-suraksh-steel/30 border-suraksh-steel/40 text-primary-foreground placeholder:text-suraksh-slate/50 focus:border-suraksh-glow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-suraksh-slate">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-suraksh-slate" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-suraksh-steel/30 border-suraksh-steel/40 text-primary-foreground placeholder:text-suraksh-slate/50 focus:border-suraksh-glow"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-suraksh-slate">
              New staff member?{" "}
              <Link to="/admin/register" className="text-suraksh-glow hover:underline">Register with invite code</Link>
            </p>
            <button onClick={() => navigate("/")} className="text-xs text-suraksh-slate hover:text-suraksh-glow transition-colors">← Back to home</button>
          </div>
        </motion.div>
      </div>

      {/* Right - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-suraksh-steel/10 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <polygon points="250,30 30,470 470,470" fill="none" stroke="hsl(210,100%,60%)" strokeWidth="1" />
          </svg>
        </div>
        <motion.div className="relative z-10 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ShieldCheck className="w-20 h-20 mx-auto mb-6 text-suraksh-glow/30" />
          <h2 className="text-2xl font-display font-bold text-primary-foreground/80">Administration</h2>
          <p className="text-suraksh-slate text-sm mt-2">Secure system management portal</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
