import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Clock, Loader2, X, FileSignature, AlertCircle,
  Scale, Filter, ChevronRight, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { agreementApi, adminApi } from "@/lib/api";

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

const EVENT_ICONS: Record<string, string> = {
  created: "🟦",
  sent_to_lawyer: "⚖️",
  lawyer_approved: "✅",
  lawyer_rejected: "❌",
  sent_to_user: "📤",
  signed: "✍️",
  rejected_by_user: "🚫",
  put_on_hold: "⏸️",
  resumed: "▶️",
};

const EVENT_LABELS: Record<string, string> = {
  created: "Agreement created",
  sent_to_lawyer: "Sent to lawyer for review",
  lawyer_approved: "Lawyer approved",
  lawyer_rejected: "Lawyer rejected",
  sent_to_user: "Sent to user",
  signed: "Signed by user",
  rejected_by_user: "Rejected by user",
  put_on_hold: "Pipeline paused",
  resumed: "Pipeline resumed",
};

const DOC_TYPES = [
  "All Types", "Offer Letter", "Employment Contract", "NDA", "Service Agreement",
  "Partnership Agreement", "Consulting Agreement", "Investment Agreement",
  "SAFE Agreement", "SHA", "Board Resolution", "Term Sheet", "Other"
];

const ALL_STATUSES = [
  "all", "draft", "pending_lawyer_review", "lawyer_approved",
  "lawyer_rejected", "sent", "signed", "rejected", "on_hold"
];

const AdminAgreements = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timelineModal, setTimelineModal] = useState<{ ag: any; events: any[] } | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [vcOnly, setVcOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "valuation">("date");
  const [keywordSearch, setKeywordSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await agreementApi.getAll();
      setAgreements(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openTimeline = async (agId: string) => {
    setTimelineLoading(true);
    setTimelineModal({ ag: null, events: [] });
    try {
      const res = await agreementApi.getTimeline(agId);
      const d = res.data as any;
      setTimelineModal({ ag: d.agreement, events: d.timeline });
    } catch {
      setTimelineModal(null);
    }
    setTimelineLoading(false);
  };

  const handleHold = async (agId: string) => { await agreementApi.hold(agId, "Paused by admin"); load(); };
  const handleResume = async (agId: string) => { await agreementApi.resume(agId); load(); };

  const VC_TYPES = new Set(["Term Sheet", "Investment Agreement", "SAFE Agreement", "SHA", "SHA (Shareholder Agreement)", "SSA", "SSA (Share Subscription Agreement)", "Board Consent", "Cap Table Update", "Board Resolution"]);

  const extractValuation = (ag: any): number => {
    const ft = ag.key_points?.financial_terms ?? {};
    const raw = ft.valuation ?? ft.investment_amount ?? ft.deal_size ?? "";
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  let filtered = agreements.filter((a) => {
    const statusOk = statusFilter === "all" || a.status === statusFilter;
    const typeOk = typeFilter === "All Types" || a.doc_type === typeFilter;
    const vcOk = !vcOnly || VC_TYPES.has(a.doc_type);
    const kwLower = keywordSearch.toLowerCase().trim();
    const kwOk = !kwLower || (
      a.title?.toLowerCase().includes(kwLower) ||
      (a.keywords ?? []).some((k: string) => k.includes(kwLower)) ||
      a.doc_type?.toLowerCase().includes(kwLower) ||
      a.content?.toLowerCase().includes(kwLower)
    );
    return statusOk && typeOk && vcOk && kwOk;
  });
  if (sortBy === "valuation") {
    filtered = [...filtered].sort((a, b) => extractValuation(b) - extractValuation(a));
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Agreements</h1>
            <p className="text-sm text-muted-foreground">Full pipeline — draft → lawyer review → user signature</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="text-xs">Refresh</Button>
        </div>

        {/* Filters */}\n        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f.replace(/_/g, " ")} ({f === "all" ? agreements.length : agreements.filter(a => a.status === f).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => setVcOnly(v => !v)}
            className={`ml-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border ${
              vcOnly ? "bg-amber-500/20 text-amber-600 border-amber-500/40" : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
            Venture Capital
          </button>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "valuation")}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground">
            <option value="date">Sort: Date</option>
            <option value="valuation">Sort: Valuation</option>
          </select>
          <div className="w-full mt-2 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-muted-foreground shrink-0"><path d="M9 3a6 6 0 100 12A6 6 0 009 3zM1 9a8 8 0 1116 0A8 8 0 011 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input
              type="text"
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              placeholder="Search by keyword, title, content…"
              className="flex-1 bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/50"
            />
            {keywordSearch && (
              <button onClick={() => setKeywordSearch("")} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <FileSignature className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No agreements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Recipient / Lawyer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((ag) => (
                    <tr key={ag.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openTimeline(ag.id)}>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium text-foreground truncate">{ag.title}</div>
                        {ag.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ag.keywords.slice(0, 3).map((k: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary/80">{k}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_type}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{ag.sent_to_name ?? (ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : <span className="italic">—</span>)}</div>
                        {ag.lawyer_name && <div className="text-[10px] text-amber-600 mt-0.5">⚖️ {ag.lawyer_name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[ag.status] ?? "bg-muted text-muted-foreground"}`}>
                          {ag.status?.replace(/_/g, " ")}
                        </span>
                        {ag.status === "rejected" && ag.rejection_reason && (
                          <div className="text-[10px] text-destructive mt-0.5 max-w-[140px] truncate" title={ag.rejection_reason}>
                            "{ag.rejection_reason}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {(ag.pipeline_stage ?? "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => openTimeline(ag.id)}>
                            <ChevronRight className="w-3 h-3" />Timeline
                          </Button>
                          {ag.pipeline_stage === "on_hold" ? (
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleResume(ag.id)}>Resume</Button>
                          ) : ag.pipeline_stage !== "completed" && ag.pipeline_stage !== "rejected" && ag.pipeline_stage !== "lawyer_review" ? (
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => handleHold(ag.id)}>Hold</Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Timeline Modal */}
      <AnimatePresence>
        {timelineModal !== null && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setTimelineModal(null)} />
            <motion.div
              className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              {timelineLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading timeline…
                </div>
              ) : timelineModal?.ag && (
                <>
                  <div className="flex items-start justify-between p-5 border-b border-border">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{timelineModal.ag.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {timelineModal.ag.doc_type} · {timelineModal.ag.doc_category}
                      </p>
                      <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[timelineModal.ag.status] ?? "bg-muted text-muted-foreground"}`}>
                        {timelineModal.ag.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <button onClick={() => setTimelineModal(null)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Timeline events */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Activity Timeline</h4>
                      {timelineModal.events.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No events recorded yet.</p>
                      ) : (
                        <ol className="relative border-l border-border ml-2 space-y-4">
                          {timelineModal.events.map((ev) => (
                            <li key={ev.id} className="ml-5">
                              <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-card border border-border text-xs">
                                {EVENT_ICONS[ev.event_type] ?? "●"}
                              </span>
                              <div className="bg-muted/30 rounded-lg p-3">
                                <p className="text-sm font-medium text-foreground">
                                  {EVENT_LABELS[ev.event_type] ?? ev.event_type.replace(/_/g, " ")}
                                </p>
                                {ev.actor_name && <p className="text-xs text-muted-foreground">by {ev.actor_name}</p>}
                                {ev.notes && ev.notes.trim() && (
                                  <p className="text-xs text-foreground/80 mt-1 italic">"{ev.notes}"</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(ev.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    {/* User rejection reason */}
                    {timelineModal.ag.rejection_reason && (
                      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <p className="text-sm font-semibold text-destructive">Rejection Message from User</p>
                        </div>
                        <p className="text-sm text-foreground">"{timelineModal.ag.rejection_reason}"</p>
                      </div>
                    )}

                    {/* Lawyer remarks */}
                    {timelineModal.ag.lawyer_notes && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Scale className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-semibold text-amber-700">
                            Lawyer Remarks
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] capitalize ${timelineModal.ag.lawyer_status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {timelineModal.ag.lawyer_status}
                            </span>
                          </p>
                        </div>
                        <p className="text-sm text-foreground">"{timelineModal.ag.lawyer_notes}"</p>
                        {timelineModal.ag.lawyer_reviewed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed on {new Date(timelineModal.ag.lawyer_reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI Key Points */}
                    {timelineModal.ag.key_points && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">AI-Extracted Key Points</h4>
                        {timelineModal.ag.key_points.summary && (
                          <p className="text-sm text-foreground mb-2">{timelineModal.ag.key_points.summary}</p>
                        )}
                        {timelineModal.ag.key_points.financial_terms &&
                          Object.values(timelineModal.ag.key_points.financial_terms).some(Boolean) && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                            <p className="font-semibold text-amber-700 mb-1">Financial Terms</p>
                            {Object.entries(timelineModal.ag.key_points.financial_terms as Record<string,string>).map(([k, v]) =>
                              v ? (
                                <p key={k}>
                                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                                  <strong>{v}</strong>
                                </p>
                              ) : null
                            )}
                          </div>
                        )}
                        {timelineModal.ag.key_points.key_terms?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {timelineModal.ag.key_points.key_terms.map((t: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Keywords + Hash */}
                    {timelineModal.ag.keywords?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Extracted Keywords</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {timelineModal.ag.keywords.map((k: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{k}</span>
                          ))}
                        </div>
                        {timelineModal.ag.content_hash && (
                          <p className="text-[9px] text-muted-foreground mt-2 font-mono break-all opacity-40" title="SHA-256 content hash">
                            SHA-256: {timelineModal.ag.content_hash}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Signature */}
                    {timelineModal.ag.is_signed && timelineModal.ag.signature_snapshot && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Signature</h4>
                        <img src={timelineModal.ag.signature_snapshot} alt="signature" className="h-14 object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {timelineModal.ag.is_signed ? (
                        <><CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Signed {timelineModal.ag.signed_at ? new Date(timelineModal.ag.signed_at).toLocaleDateString() : ""}</span></>
                      ) : timelineModal.ag.status === "sent" ? (
                        <><Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Awaiting user signature</span></>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTimelineModal(null)}>Close</Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminAgreements;
