import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle, XCircle, Loader2, X, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { agreementApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/20 text-primary",
  signed: "bg-green-500/20 text-green-600",
  rejected: "bg-destructive/20 text-destructive",
  pending_lawyer_review: "bg-amber-100 text-amber-700",
  lawyer_approved: "bg-emerald-100 text-emerald-700",
  lawyer_rejected: "bg-red-100 text-red-700",
  on_hold: "bg-orange-100 text-orange-600",
  completed: "bg-green-500/20 text-green-600",
};

const LawyerDashboard = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewAg, setReviewAg] = useState<any | null>(null);
  const [reviewTab, setReviewTab] = useState<"content" | "keypoints">("content");
  const [action, setAction] = useState<"approve" | "reject" | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await agreementApi.getLawyerPending();
      setAgreements(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openReview = (ag: any) => {
    setReviewAg(ag);
    setReviewTab("content");
    setAction("");
    setNotes("");
    setError("");
  };

  const submitReview = async () => {
    if (!action) { setError("Please select Approve or Reject."); return; }
    if (action === "reject" && !notes.trim()) { setError("Please provide rejection notes."); return; }
    setSubmitting(true);
    setError("");
    try {
      await agreementApi.lawyerReview(reviewAg.id, action as "approve" | "reject", notes);
      setReviewAg(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to submit review");
    }
    setSubmitting(false);
  };

  const getKeyPoints = (ag: any) => {
    try { return typeof ag.key_points === "string" ? JSON.parse(ag.key_points) : ag.key_points; }
    catch { return null; }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Lawyer Review Dashboard</h1>
              <p className="text-sm text-muted-foreground">Agreements pending your review</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="text-xs">Refresh</Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading agreements…
            </div>
          ) : agreements.length === 0 ? (
            <div className="p-12 text-center">
              <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No agreements pending review.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pipeline Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agreements.map((ag) => (
                  <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[200px]">{ag.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_type || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[ag.pipeline_stage] || STATUS_COLORS[ag.status] || "bg-muted text-muted-foreground"}`}>
                        {(ag.pipeline_stage || ag.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReview(ag)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewAg && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setReviewAg(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-[85vw] max-w-[85vw] max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <div>
                  <h2 className="font-display font-semibold text-foreground">{reviewAg.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{reviewAg.doc_type}{reviewAg.doc_category ? ` · ${reviewAg.doc_category}` : ""}</p>
                </div>
                <button onClick={() => setReviewAg(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-4">
                {(["content", "keypoints"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReviewTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${reviewTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {t === "keypoints" ? "Key Points" : "Agreement Content"}
                  </button>
                ))}
              </div>

              <div className="px-5 pt-3 pb-2">
                {reviewTab === "content" && (
                  <pre className="text-xs font-mono bg-muted/40 rounded-xl p-4 whitespace-pre-wrap max-h-72 overflow-y-auto text-foreground">
                    {reviewAg.content || "No content available."}
                  </pre>
                )}

                {reviewTab === "keypoints" && (() => {
                  const kp = getKeyPoints(reviewAg);
                  if (!kp) return <p className="text-sm text-muted-foreground py-3">No key points extracted.</p>;
                  return (
                    <div className="space-y-3 text-sm py-1">
                      {kp.summary && <p className="text-foreground/80 leading-relaxed">{kp.summary}</p>}
                      {kp.parties?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Parties</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs text-foreground">{kp.parties.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                      {kp.key_terms?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Terms</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs text-foreground">{kp.key_terms.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
                        </div>
                      )}
                      {kp.financial_terms && Object.values(kp.financial_terms).some(Boolean) && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-xs font-semibold text-primary uppercase mb-2">Financial Terms</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {kp.financial_terms.valuation && <><span className="text-muted-foreground">Valuation</span><span className="font-mono">{kp.financial_terms.valuation}</span></>}
                            {kp.financial_terms.investment_amount && <><span className="text-muted-foreground">Investment</span><span className="font-mono">{kp.financial_terms.investment_amount}</span></>}
                            {kp.financial_terms.equity_percentage && <><span className="text-muted-foreground">Equity</span><span className="font-mono">{kp.financial_terms.equity_percentage}</span></>}
                            {kp.financial_terms.payment_terms && <><span className="text-muted-foreground">Payment</span><span className="font-mono">{kp.financial_terms.payment_terms}</span></>}
                          </div>
                        </div>
                      )}
                      {kp.duration && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Duration: </span>{kp.duration}</p>}
                      {kp.governing_law && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Governing Law: </span>{kp.governing_law}</p>}
                    </div>
                  );
                })()}
              </div>

              {/* Review decision */}
              <div className="px-5 pb-5 pt-3 border-t border-border mt-2 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Your Decision</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAction("approve")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${action === "approve" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"}`}
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${action === "reject" ? "bg-red-50 border-red-400 text-red-700" : "border-border text-muted-foreground hover:border-red-400 hover:text-red-600"}`}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
                <textarea
                  className="w-full rounded-xl border border-border bg-background text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                  placeholder={action === "reject" ? "Rejection reason (required)…" : "Optional notes for the admin…"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setReviewAg(null)}>Cancel</Button>
                  <Button size="sm" onClick={submitReview} disabled={submitting || !action}>
                    {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Submitting…</> : "Submit Review"}
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

export default LawyerDashboard;
