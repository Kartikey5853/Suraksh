import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, CheckCircle, X, Loader2, AlertCircle, ChevronRight,
  Zap, Eye, ShieldCheck, Scale, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserLayout from "@/components/UserLayout";
import { agreementApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-primary/10 text-primary",
  signed: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-accent/10 text-accent",
};

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <motion.div className={`h-2 rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
};

const DocumentReview = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "keypoints" | "analysis">("content");
  const [finalizing, setFinalizing] = useState(false);
  const [signing, setSigning] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [signConfirm, setSignConfirm] = useState(false); // show summary confirm before signing

  const load = async () => {
    setLoading(true);
    try {
      const res = await agreementApi.getMyAgreements();
      const pending = (res.data || []).filter((a: any) => a.status === "sent" || a.pipeline_stage === "sent");
      setAgreements(pending);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAgreement = (ag: any) => {
    setSelected(ag);
    setActiveTab("content");
    setActionMsg(""); setActionErr("");
    setShowRejectInput(false); setRejectReason("");
    setSignConfirm(false);
  };

  const handleFinalize = async () => {
    if (!selected) return;
    setFinalizing(true); setActionErr("");
    try {
      const res = await agreementApi.finalizeUser(selected.id);
      const updated = res.data.agreement;
      setSelected(updated);
      setAgreements((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setActiveTab("analysis");
      setActionMsg("Personal analysis complete. Review before signing.");
    } catch (e: any) {
      setActionErr(e?.response?.data?.detail || "Analysis failed — check Gemini API key.");
    }
    setFinalizing(false);
  };

  const handleSign = async () => {
    if (!selected) return;
    // If no analysis yet, run it first and show confirmation
    if (!getUserAnalysis(selected)) {
      setFinalizing(true); setActionErr("");
      try {
        const res = await agreementApi.finalizeUser(selected.id);
        const updated = res.data.agreement;
        setSelected(updated);
        setAgreements((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      } catch { /* continue without analysis */ }
      setFinalizing(false);
    }
    setSignConfirm(true);
    setActiveTab("analysis");
  };

  const handleConfirmSign = async () => {
    if (!selected) return;
    setSigning(true); setActionErr("");
    try {
      const res = await agreementApi.signAgreement(selected.id);
      const updated = res.data.agreement;
      setSelected(updated);
      setAgreements((prev) => prev.filter((a) => a.id !== updated.id));
      setActionMsg("Agreement signed successfully!");
      setTimeout(() => { setSelected(null); load(); }, 2000);
    } catch (e: any) {
      setActionErr(e?.response?.data?.detail || "Failed to sign agreement.");
    }
    setSigning(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) { setActionErr("Provide a reason for rejection."); return; }
    setRejecting(true); setActionErr("");
    try {
      await agreementApi.rejectAgreement(selected.id, rejectReason);
      setAgreements((prev) => prev.filter((a) => a.id !== selected.id));
      setActionMsg("Agreement rejected.");
      setTimeout(() => { setSelected(null); load(); }, 2000);
    } catch (e: any) {
      setActionErr(e?.response?.data?.detail || "Failed to reject.");
    }
    setRejecting(false);
  };

  const getKeyPoints = (ag: any) => {
    try { return typeof ag.key_points === "string" ? JSON.parse(ag.key_points) : ag.key_points; }
    catch { return null; }
  };

  const getUserAnalysis = (ag: any) => {
    if (!ag) return null;
    const raw = ag.user_analysis_result;
    if (!raw) return null;
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { return null; }
  };

  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Pending Agreements</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Agreements waiting for your review and signature</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="text-xs">Refresh</Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading agreements…
          </div>
        ) : agreements.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-14 text-center">
            <ScrollText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-display font-semibold text-foreground mb-1">No pending agreements</h3>
            <p className="text-sm text-muted-foreground">Agreements sent to you for signing will appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Agreement</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agreements.map((ag) => (
                  <tr key={ag.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openAgreement(ag)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ScrollText className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-foreground leading-tight">{ag.title}</p>
                          {getUserAnalysis(ag) && (
                            <span className="text-xs text-accent flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="w-3 h-3" /> Analysed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{ag.doc_type || "—"}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{ag.created_by_name || "Suraksh Technologies"}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{ag.created_at ? new Date(ag.created_at).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" onClick={() => openAgreement(ag)} className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Review &amp; Sign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-[85vw] max-w-[85vw] max-h-[90vh] flex flex-col shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground">{selected.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{selected.doc_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] || "bg-muted text-muted-foreground"}`}>
                      {selected.status?.replace(/_/g, " ")}
                    </span>
                    {getUserAnalysis(selected) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Analysed
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1 ml-3">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-3 border-b border-border shrink-0 bg-card">
                {(["content", "keypoints", "analysis"] as const).map((t) => {
                  const ua = getUserAnalysis(selected);
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      {t === "keypoints" ? "Key Points" : t === "analysis" ? (
                        <span className="flex items-center gap-1">
                          Personal Analysis
                          {ua && <span className={`font-bold ml-1 ${ua.score >= 80 ? "text-emerald-500" : ua.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{ua.score}</span>}
                        </span>
                      ) : "Content"}
                    </button>
                  );
                })}
              </div>

              {/* Tab Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === "content" && (
                  <pre className="text-sm font-mono bg-muted/30 rounded-xl p-4 whitespace-pre-wrap leading-relaxed text-foreground max-h-[400px] overflow-y-auto">
                    {selected.content || "No content available."}
                  </pre>
                )}

                {activeTab === "keypoints" && (() => {
                  const kp = getKeyPoints(selected);
                  if (!kp) return (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No key points extracted for this agreement.
                    </div>
                  );
                  return (
                    <div className="space-y-4 text-sm">
                      {kp.summary && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                          <p className="text-foreground/80 leading-relaxed">{kp.summary}</p>
                        </div>
                      )}
                      {kp.parties?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parties</p>
                          <ul className="space-y-1">{kp.parties.map((p: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{p}</li>)}</ul>
                        </div>
                      )}
                      {kp.key_terms?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Terms</p>
                          <ul className="space-y-1">{kp.key_terms.map((t: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{t}</li>)}</ul>
                        </div>
                      )}
                      {kp.financial_terms && Object.values(kp.financial_terms).some(Boolean) && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-xs font-semibold text-primary uppercase mb-2">Financial Terms</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {kp.financial_terms.valuation && <><span className="text-muted-foreground">Valuation</span><span className="font-mono text-foreground">{kp.financial_terms.valuation}</span></>}
                            {kp.financial_terms.investment_amount && <><span className="text-muted-foreground">Investment</span><span className="font-mono text-foreground">{kp.financial_terms.investment_amount}</span></>}
                            {kp.financial_terms.equity_percentage && <><span className="text-muted-foreground">Equity</span><span className="font-mono text-foreground">{kp.financial_terms.equity_percentage}</span></>}
                            {kp.financial_terms.payment_terms && <><span className="text-muted-foreground">Payment</span><span className="font-mono text-foreground">{kp.financial_terms.payment_terms}</span></>}
                          </div>
                        </div>
                      )}
                      {kp.duration && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Duration: </span>{kp.duration}</p>}
                    </div>
                  );
                })()}

                {activeTab === "analysis" && (() => {
                  const ua = getUserAnalysis(selected);
                  if (!ua) return (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <Zap className="w-12 h-12 text-muted-foreground opacity-20" />
                      <div>
                        <h3 className="font-display font-semibold text-foreground mb-1">No personal analysis yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Run a personal analysis to understand your rights, obligations, and risks from this agreement <strong>before signing</strong>.
                        </p>
                      </div>
                      <Button onClick={handleFinalize} disabled={finalizing} className="gap-2 mt-2">
                        {finalizing ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</> : <><Zap className="w-4 h-4" />Analyse for Me</>}
                      </Button>
                    </div>
                  );
                  return (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                        <div className={`text-4xl font-bold tabular-nums ${ua.score >= 80 ? "text-emerald-500" : ua.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{ua.score}</div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fairness Score (Your Perspective)</p>
                          <ScoreBar score={ua.score} />
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ua.summary}</p>
                        </div>
                      </div>
                      {ua.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 uppercase mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />Benefits for You
                          </p>
                          <ul className="space-y-1.5">{ua.strengths.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{s}</li>)}</ul>
                        </div>
                      )}
                      {ua.gaps?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />Missing Protections for You
                          </p>
                          <ul className="space-y-1.5">{ua.gaps.map((g: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-amber-500 mt-0.5">⚠</span>{g}</li>)}</ul>
                        </div>
                      )}
                      {ua.risks?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />Personal Risks
                          </p>
                          <ul className="space-y-1.5">{ua.risks.map((r: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-red-500 mt-0.5">✗</span>{r}</li>)}</ul>
                        </div>
                      )}
                      {ua.suggestions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-primary uppercase mb-2 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5" />What to Negotiate / Watch Out For
                          </p>
                          <ul className="space-y-1.5">{ua.suggestions.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{s}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-border shrink-0 space-y-3">
                {actionMsg && (
                  <div className="flex items-center gap-2 text-accent text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />{actionMsg}
                  </div>
                )}
                {actionErr && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{actionErr}
                  </div>
                )}

                {/* Finalize button */}
                <Button
                  onClick={handleFinalize} disabled={finalizing}
                  variant="outline"
                  className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/5"
                >
                  {finalizing
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Running personal analysis…</>
                    : getUserAnalysis(selected)
                      ? <><Zap className="w-4 h-4" />Re-run Personal Analysis</>
                      : <><Zap className="w-4 h-4" />Finalise — Run Personal Analysis</>
                  }
                </Button>

                {/* Sign / Reject */}
                {selected.status === "sent" && !selected.is_signed && (
                  <>
                    {signConfirm ? (
                      // Sign confirmation panel with summary
                      <div className="space-y-3">
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                          <p className="text-xs font-semibold text-primary uppercase mb-1">⚠️ You are about to sign this agreement</p>
                          {getUserAnalysis(selected) ? (
                            <p className="text-xs text-foreground/80 leading-relaxed">{getUserAnalysis(selected)?.summary}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Please review the agreement content before signing.</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleConfirmSign} disabled={signing} className="flex-1 gap-2">
                            {signing ? <><Loader2 className="w-4 h-4 animate-spin" />Signing…</> : <><CheckCircle className="w-4 h-4" />Confirm &amp; Sign</>}
                          </Button>
                          <Button variant="outline" onClick={() => setSignConfirm(false)} className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    ) : showRejectInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection…"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none min-h-[70px] focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleReject} disabled={rejecting} size="sm" variant="destructive" className="flex-1 gap-1.5">
                            {rejecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rejecting…</> : <><X className="w-3.5 h-3.5" />Confirm Reject</>}
                          </Button>
                          <Button onClick={() => { setShowRejectInput(false); setRejectReason(""); }} size="sm" variant="outline" className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button onClick={handleSign} disabled={finalizing || signing} className="flex-1 gap-2">
                          {finalizing
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Running AI Summary…</>
                            : <><CheckCircle className="w-4 h-4" />Sign Agreement</>
                          }
                        </Button>
                        <Button onClick={() => setShowRejectInput(true)} variant="outline" className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                          <X className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {selected.is_signed && (
                  <div className="flex items-center gap-2 justify-center text-accent text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> You have already signed this agreement.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UserLayout>
  );
};

export default DocumentReview;
