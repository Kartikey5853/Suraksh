import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen bg-suraksh-dark flex items-center justify-center p-8">
      <motion.div
        className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Staff Registration</h2>
            <p className="text-sm text-muted-foreground">Enter your role invite code to register</p>
          </div>
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-accent" />
            <p className="text-foreground font-medium">Registration successful!</p>
            <p className="text-sm text-muted-foreground">Redirecting to login…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="role_code">Role Invite Code</Label>
              <Input
                id="role_code"
                name="role_code"
                value={form.role_code}
                onChange={handleChange}
                required
                placeholder="e.g. ADM-2025"
                className="mt-1 font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground mt-1">Provided by your organisation admin</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Register
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/admin/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AdminRegister;
