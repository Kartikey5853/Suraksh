import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ScrollText, Eye, Search, Loader2, CheckCircle, X, AlertCircle,
  ChevronRight, Zap, ShieldCheck,
} from "lucide-react";
import UserLayout from "@/components/UserLayout";
import { agreementApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  signed: "text-accent bg-accent/10",
  sent: "text-primary bg-primary/10",
  rejected: "text-destructive bg-destructive/10",
  draft: "text-muted-foreground bg-muted",
  completed: "text-accent bg-accent/10",
};

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <motion.div className={`h-2 rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
};

const DocumentHistory = () => {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailAg, setDetailAg] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<"content" | "keypoints" | "analysis">("content");

  useEffect(() => {
    setLoading(true);
    agreementApi.getMyAgreements()
      .then((r) => setAgreements(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agreements.filter((a) =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.doc_type?.toLowerCase().includes(search.toLowerCase())
  );

  const getKeyPoints = (ag: any) => {
    try { return typeof ag.key_points === "string" ? JSON.parse(ag.key_points) : ag.key_points; }
    catch { return null; }
  };
  const getUserAnalysis = (ag: any) => {
    if (!ag?.user_analysis_result) return null;
    try { return typeof ag.user_analysis_result === "string" ? JSON.parse(ag.user_analysis_result) : ag.user_analysis_result; }
    catch { return null; }
  };

  const openDetail = (ag: any) => { setDetailAg(ag); setDetailTab("content"); };

  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Agreements</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All agreements sent to you by Suraksh Technologies</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search agreements…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center gap-2 text-muted-foreground text-sm justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {search ? "No agreements match your search." : "No agreements yet. Your sent agreements will appear here."}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Agreement</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ag) => (
                  <tr key={ag.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ScrollText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{ag.title}</p>
                          {getUserAnalysis(ag) && (
                            <span className="text-xs text-accent flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="w-3 h-3" />Analysis ready
                            </span>
                          )}
                          {ag.rejection_reason && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 text-destructive" />
                              <p className="text-xs text-destructive truncate max-w-[200px]">{ag.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{ag.doc_type || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[ag.status] || "text-muted-foreground bg-muted"}`}>
                        {ag.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {ag.created_at ? new Date(ag.created_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(ag)} title="View details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {ag.status === "sent" && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate("/user/pending")}>
                            Review &amp; Sign
                          </Button>
                        )}
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
        {detailAg && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailAg(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-[85vw] max-w-[85vw] max-h-[90vh] flex flex-col shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
                <div>
                  <h2 className="font-display font-semibold text-foreground">{detailAg.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{detailAg.doc_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[detailAg.status] || "text-muted-foreground bg-muted"}`}>
                      {detailAg.status?.replace(/_/g, " ")}
                    </span>
                    {getUserAnalysis(detailAg) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />Analysed
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setDetailAg(null)} className="text-muted-foreground hover:text-foreground p-1 ml-3">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rejection note */}
              {detailAg.rejection_reason && (
                <div className="mx-5 mt-4 flex gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 shrink-0">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-0.5">Rejection Reason</p>
                    <p className="text-xs text-destructive/90">{detailAg.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-3 border-b border-border shrink-0">
                {(["content", "keypoints", "analysis"] as const).map((t) => {
                  const ua = getUserAnalysis(detailAg);
                  return (
                    <button
                      key={t}
                      onClick={() => setDetailTab(t)}
                      className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${detailTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      {t === "keypoints" ? "Key Points" : t === "analysis" ? (
                        <span className="flex items-center gap-1">
                          My Analysis
                          {ua && <span className={`font-bold ml-1 ${ua.score >= 80 ? "text-emerald-500" : ua.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{ua.score}</span>}
                        </span>
                      ) : "Content"}
                    </button>
                  );
                })}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {detailTab === "content" && (
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                    {detailAg.content || "No content available."}
                  </pre>
                )}

                {detailTab === "keypoints" && (() => {
                  const kp = getKeyPoints(detailAg);
                  if (!kp) return <p className="text-sm text-muted-foreground py-4 text-center">No key points extracted for this agreement.</p>;
                  return (
                    <div className="space-y-4 text-sm">
                      {kp.summary && <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p><p className="text-foreground/80 leading-relaxed">{kp.summary}</p></div>}
                      {kp.parties?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parties</p><ul className="space-y-1">{kp.parties.map((p: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{p}</li>)}</ul></div>}
                      {kp.key_terms?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Terms</p><ul className="space-y-1">{kp.key_terms.map((t: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{t}</li>)}</ul></div>}
                      {kp.financial_terms && Object.values(kp.financial_terms).some(Boolean) && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-xs font-semibold text-primary uppercase mb-2">Financial Terms</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {kp.financial_terms.valuation && <><span className="text-muted-foreground">Valuation</span><span className="font-mono text-foreground">{kp.financial_terms.valuation}</span></>}
                            {kp.financial_terms.investment_amount && <><span className="text-muted-foreground">Investment</span><span className="font-mono text-foreground">{kp.financial_terms.investment_amount}</span></>}
                            {kp.financial_terms.equity_percentage && <><span className="text-muted-foreground">Equity</span><span className="font-mono text-foreground">{kp.financial_terms.equity_percentage}</span></>}
                          </div>
                        </div>
                      )}
                      {kp.duration && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Duration: </span>{kp.duration}</p>}
                    </div>
                  );
                })()}

                {detailTab === "analysis" && (() => {
                  const ua = getUserAnalysis(detailAg);
                  if (!ua) return (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                      <Zap className="w-10 h-10 text-muted-foreground opacity-20" />
                      <p className="text-sm text-muted-foreground">No personal analysis available yet.</p>
                      <p className="text-xs text-muted-foreground">Go to <strong>Pending Agreements</strong> and click "Finalise — Run Personal Analysis" to generate a personal analysis for this agreement.</p>
                      {detailAg.status === "sent" && (
                        <Button size="sm" variant="outline" onClick={() => { setDetailAg(null); navigate("/user/pending"); }} className="gap-1.5 mt-1">
                          <Eye className="w-3.5 h-3.5" />Go to Pending Agreements
                        </Button>
                      )}
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                        <div className={`text-4xl font-bold tabular-nums ${ua.score >= 80 ? "text-emerald-500" : ua.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{ua.score}</div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fairness Score (Your View)</p>
                          <ScoreBar score={ua.score} />
                          <p className="text-xs text-muted-foreground mt-1.5">{ua.summary}</p>
                        </div>
                      </div>
                      {ua.strengths?.length > 0 && <div><p className="text-xs font-semibold text-emerald-600 uppercase mb-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Benefits for You</p><ul className="space-y-1">{ua.strengths.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-emerald-500">✓</span>{s}</li>)}</ul></div>}
                      {ua.gaps?.length > 0 && <div><p className="text-xs font-semibold text-amber-600 uppercase mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Missing Protections</p><ul className="space-y-1">{ua.gaps.map((g: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-amber-500">⚠</span>{g}</li>)}</ul></div>}
                      {ua.risks?.length > 0 && <div><p className="text-xs font-semibold text-red-600 uppercase mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Risks</p><ul className="space-y-1">{ua.risks.map((r: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-red-500">✗</span>{r}</li>)}</ul></div>}
                      {ua.suggestions?.length > 0 && <div><p className="text-xs font-semibold text-primary uppercase mb-1 flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />What to Watch</p><ul className="space-y-1">{ua.suggestions.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{s}</li>)}</ul></div>}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border shrink-0">
                {detailAg.status === "sent" && (
                  <Button className="w-full gap-2" onClick={() => { setDetailAg(null); navigate("/user/pending"); }}>
                    <Eye className="w-4 h-4" />Review &amp; Sign in Pending Agreements
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UserLayout>
  );
};

export default DocumentHistory;
