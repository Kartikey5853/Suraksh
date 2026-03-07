import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ShieldCheck, X, Clock, Calendar, Camera, Star, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from "@/lib/api";

const AdminAuthImage = ({ url, label }: { url: string; label: string }) => {
  const token = localStorage.getItem("token");
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setSrc(null); setError(false);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.blob(); })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setError(true));
  }, [url, token]);
  if (error) return (
    <div className="w-full h-36 rounded-lg bg-muted/20 border border-border flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs">
      <AlertTriangle className="w-5 h-5" /> Not available
    </div>
  );
  if (!src) return <div className="w-full h-36 rounded-lg bg-muted/20 border border-border animate-pulse" />;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <img src={src} alt={label} className="w-full rounded-lg border border-border object-contain max-h-48 bg-black" />
    </div>
  );
};

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);

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
                  <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Score</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Face</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetail(v)}>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{v.user_name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{v.user_email}</td>
                    <td className="px-5 py-4 text-center text-xs text-muted-foreground">
                      {v.aadhaar_last4 === "****" ? (
                        <span className="text-yellow-400">Pending Review</span>
                      ) : (
                        <span>****{v.aadhaar_last4}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {v.scan_score != null ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          v.scan_score >= 80 ? "bg-emerald-100 text-emerald-700" :
                          v.scan_score >= 50 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          <Star className="w-3 h-3" />{v.scan_score}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {v.face_submitted ? (
                        <Camera className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <Camera className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {v.is_valid ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-green-400 bg-green-500/20 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-primary bg-primary/10 w-fit block">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                    variant="ghost" size="sm" className="text-xs text-green-500"
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
      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    detail.is_valid ? "bg-green-500/20" : "bg-primary/10"
                  }`}>
                    {detail.is_valid
                      ? <ShieldCheck className="w-5 h-5 text-green-400" />
                      : <Clock className="w-5 h-5 text-primary" />
                    }
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-foreground">{detail.user_name}</h2>
                    <p className="text-xs text-muted-foreground">{detail.user_email}</p>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Overall Status */}
                <div className={`rounded-xl p-4 flex items-center gap-3 ${
                  detail.is_valid ? "bg-green-500/10 border border-green-500/20" : "bg-primary/5 border border-primary/20"
                }`}>
                  {detail.is_valid
                    ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    : <Clock className="w-5 h-5 text-primary shrink-0" />
                  }
                  <div>
                    <p className={`text-sm font-semibold ${ detail.is_valid ? "text-green-400" : "text-primary"}`}>
                      {detail.is_valid ? "Identity Verified" : "Pending Review"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detail.is_valid
                        ? "Aadhaar KYC has been approved."
                        : "Aadhaar document submitted, awaiting approval."}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Verification Type</p>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground">Aadhaar KYC</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Aadhaar (last 4)</p>
                    <p className="text-foreground font-mono">
                      {detail.aadhaar_last4 && detail.aadhaar_last4 !== "****"
                        ? `XXXX XXXX ${detail.aadhaar_last4}`
                        : "Pending"}
                    </p>
                  </div>
                  {detail.scan_score != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">AI Scan Accuracy</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              detail.scan_score >= 80 ? "bg-emerald-500" :
                              detail.scan_score >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${detail.scan_score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${
                          detail.scan_score >= 80 ? "text-emerald-600" :
                          detail.scan_score >= 50 ? "text-amber-600" : "text-red-600"
                        }`}>{detail.scan_score}%</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Face Photo</p>
                    <div className="flex items-center gap-1.5">
                      {detail.face_submitted
                        ? <><Camera className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400 text-xs">Submitted</span></>
                        : <><Camera className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground text-xs">Not submitted</span></>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Submitted On</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground text-xs">
                        {detail.created_at ? new Date(detail.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                  {detail.verified_at && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Verified On</p>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs">
                          {new Date(detail.verified_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Images */}
                {(detail.has_id_card || detail.has_face) && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Submitted Documents
                    </p>
                    {detail.has_id_card && (
                      <AdminAuthImage url={adminApi.userIdImageUrl(detail.user_id)} label="ID Card (Aadhaar)" />
                    )}
                    {detail.has_face && (
                      <AdminAuthImage url={adminApi.userFaceImageUrl(detail.user_id)} label="Face Photo" />
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-2"
                    disabled={detail.is_valid || updatingId === detail.user_id}
                    onClick={() => { handleApprove(detail.user_id); setDetail((prev: any) => prev ? { ...prev, is_valid: true, verified_at: new Date().toISOString() } : null); }}
                  >
                    {updatingId === detail.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {detail.is_valid ? "Already Approved" : "Approve"}
                  </Button>
                  <Button
                    variant="outline" className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                    disabled={!detail.is_valid || updatingId === detail.user_id}
                    onClick={() => { handleReject(detail.user_id); setDetail((prev: any) => prev ? { ...prev, is_valid: false, verified_at: null } : null); }}
                  >
                    {updatingId === detail.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default VerificationManagement;
