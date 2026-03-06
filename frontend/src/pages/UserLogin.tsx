import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      if (!data.is_onboarded) {
        navigate("/user/otp");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-suraksh-ice">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-suraksh-navy items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <polygon points="250,30 30,470 470,470" fill="none" stroke="hsl(175,70%,40%)" strokeWidth="1" />
            <polygon points="250,80 80,420 420,420" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="0.5" />
          </svg>
        </div>
        <motion.div
          className="relative z-10 text-center px-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <TriangleLogo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold text-primary-foreground mb-3">Suraksh</h1>
          <p className="text-suraksh-slate text-sm">Secure Digital Documentation & Identity Verification</p>
        </motion.div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <TriangleLogo className="w-6 h-6" />
              <span className="font-display font-semibold text-foreground">SURAKSH</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/user/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const TriangleLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
    <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
  </svg>
);

export default UserLogin;
