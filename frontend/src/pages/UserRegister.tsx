import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      navigate("/user/dashboard"); // go straight to dashboard; verification banner appears inline
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex bg-suraksh-ice">
      <div className="hidden lg:flex lg:w-1/2 bg-suraksh-navy items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <polygon points="250,30 30,470 470,470" fill="none" stroke="hsl(175,70%,40%)" strokeWidth="1" />
          </svg>
        </div>
        <motion.div className="relative z-10 text-center px-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <TriangleLogo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold text-primary-foreground mb-3">Join Suraksh</h1>
          <p className="text-suraksh-slate text-sm">Create your secure account in minutes</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">Create Account</h2>
            <p className="text-muted-foreground text-sm mt-1">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="John Doe" value={form.name} onChange={update("name")} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={update("phone")} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={form.password} onChange={update("password")} className="pl-10" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/user/login" className="text-primary font-medium hover:underline">Login</Link>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to home</button>
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

export default UserRegister;
