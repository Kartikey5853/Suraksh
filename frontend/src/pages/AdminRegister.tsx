import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { authApi } from "@/lib/api";

const ROLES = [
  { value: "admin",     label: "Admin" },
  { value: "lawyer",    label: "Lawyer" },
  { value: "associate", label: "Associate" },
  { value: "founder",   label: "Founder" },
];

const AdminRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", role: "associate", role_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.adminRegister(form);
      setSuccess(true);
      setTimeout(() => navigate("/admin/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Registration failed. Check your role code.");
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
          style={{ width: "100%", height: "100%", background: "#03111c" }}
        />
        <div className="absolute inset-0 flex flex-col items-end justify-end p-12 pb-16 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <motion.div
            className="text-right"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex items-center justify-end gap-3 mb-4">
              <span className="text-sky-400 font-mono font-bold tracking-widest text-sm uppercase">Admin Portal</span>
              <svg viewBox="0 0 40 40" className="w-9 h-9">
                <polygon points="20,4 6,34 34,34" fill="none" stroke="#0ea5e9" strokeWidth="2" />
                <polygon points="20,12 12,30 28,30" fill="#0284c7" opacity="0.8" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              Staff Registration.<br />Secure Access.
            </h1>
            <p className="text-sky-300/70 text-sm max-w-xs ml-auto">
              Enter your role invite code to register as a team member.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Left panel — Register form ── */}
      <div className="relative z-10 mr-auto w-full lg:w-[52%] flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Staff Registration</h2>
              <p className="text-white/50 text-sm mt-1">Enter your invite code to register</p>
            </div>

            {success ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                <p className="text-white font-medium mb-1">Registration successful!</p>
                <p className="text-white/50 text-sm">Redirecting to login…</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white/70 text-xs mb-1.5 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input id="name" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Your name"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sky-500/60 focus:bg-white/8" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-white/70 text-xs mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange}
                      placeholder="admin@example.com"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sky-500/60 focus:bg-white/8" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white/70 text-xs mb-1.5 block">Phone <span className="text-white/30">(optional)</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sky-500/60 focus:bg-white/8" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-white/70 text-xs mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input id="password" name="password" type="password" required value={form.password} onChange={handleChange}
                      placeholder="Create a password"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sky-500/60 focus:bg-white/8" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role" className="text-white/70 text-xs mb-1.5 block">Role</Label>
                  <select
                    id="role" name="role" value={form.role} onChange={handleChange}
                    className="w-full rounded-md border border-white/10 bg-white/5 text-white text-sm px-3 py-2 focus:border-sky-500/60 focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="bg-neutral-900">{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="role_code" className="text-white/70 text-xs mb-1.5 block">Invite Code</Label>
                  <Input id="role_code" name="role_code" required value={form.role_code} onChange={handleChange}
                    placeholder="Enter your invite code"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sky-500/60 focus:bg-white/8" />
                </div>

                {error && (
                  <p className="text-red-400/90 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit" disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white border-0 font-semibold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register"}
                </Button>
              </form>
            )}

            <p className="mt-5 text-center text-xs text-white/40">
              Already registered?{" "}
              <Link to="/admin/login" className="text-sky-400 hover:text-sky-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminRegister;
