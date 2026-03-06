import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from "@/lib/api";

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVerifications();
      setVerifications(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadVerifications(); }, []);

  const handleApprove = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await adminApi.approveVerification(userId);
      setVerifications((prev) => prev.map((v) => v.user_id === userId ? { ...v, is_valid: true, verified_at: new Date().toISOString() } : v));
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  const handleReject = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await adminApi.rejectVerification(userId);
      setVerifications((prev) => prev.map((v) => v.user_id === userId ? { ...v, is_valid: false, verified_at: null } : v));
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Verification Management</h1>
          <Button variant="outline" size="sm" className="text-xs" onClick={loadVerifications}>Refresh</Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : verifications.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No verification submissions yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Aadhaar</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{v.user_name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{v.user_email}</td>
                    <td className="px-5 py-4 text-center text-xs text-muted-foreground">
                      {v.aadhaar_last4 === "****" ? (
                        <span className="text-yellow-400">Pending Review</span>
                      ) : (
                        <span>****{v.aadhaar_last4}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {v.is_valid ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-accent bg-accent/10 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-primary bg-primary/10 w-fit block">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" className="text-xs text-accent"
                          disabled={v.is_valid || updatingId === v.user_id}
                          onClick={() => handleApprove(v.user_id)}
                        >
                          {updatingId === v.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-xs text-destructive"
                          disabled={!v.is_valid || updatingId === v.user_id}
                          onClick={() => handleReject(v.user_id)}
                        >
                          {updatingId === v.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default VerificationManagement;
