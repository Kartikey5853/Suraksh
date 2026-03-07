import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Loader2, CheckCircle, Clock, X, Filter, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { adminApi, agreementApi } from "@/lib/api";

const DOC_TYPES = [
  "All Types", "Offer Letter", "Employment Contract", "NDA", "Service Agreement",
  "Partnership Agreement", "Consulting Agreement", "Investment Agreement",
  "SAFE Agreement", "SHA", "Board Resolution", "Term Sheet", "Other"
];

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
  pending: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
};

const EVENT_LABELS: Record<string, string> = {
  created: "Created", sent_to_lawyer: "Sent to lawyer", lawyer_approved: "Lawyer approved",
  lawyer_rejected: "Lawyer rejected", sent_to_user: "Sent to user", signed: "Signed by user",
  rejected_by_user: "Rejected by user", put_on_hold: "Paused", resumed: "Resumed",
};

const VC_TYPES = ["Investment Agreement", "SAFE Agreement", "SHA", "Term Sheet"];

const renderDocContent = (content: string) =>
  content.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    const isMainHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 100 && /[A-Z]/.test(trimmed);
    const isSubHeading = !isMainHeading && /^(\d+\.\s+[A-Z]|[A-Z][A-Z a-z]+:)/.test(trimmed) && trimmed.length < 120;
    const isBullet = /^[\s]*[-\u2022*]\s/.test(line);
    if (isMainHeading) return <h2 key={i} className="text-sm font-bold text-gray-900 mt-6 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">{trimmed}</h2>;
    if (isSubHeading) return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-4 mb-1">{trimmed}</h3>;
    if (isBullet) return <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 mb-0.5 list-disc">{trimmed.replace(/^[\s]*[-\u2022*]\s+/, '')}</li>;
    return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">{trimmed}</p>;
  });

const AdminDocuments = () => {
  const [docTab, setDocTab] = useState<"agreements" | "documents">("agreements");
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [vcValuationFilter, setVcValuationFilter] = useState("");
  const [detailAg, setDetailAg] = useState<any | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [contentTab, setContentTab] = useState<"timeline" | "content" | "keypoints">("timeline");
  const [docDetail, setDocDetail] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [agRes, docsRes] = await Promise.all([
          agreementApi.getAll(),
          adminApi.getDocuments(),
        ]);
        setAgreements(agRes.data);
        setDocuments(docsRes.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const openDetail = async (ag: any) => {
    setDetailAg(ag);
    setContentTab("timeline");
    setTimelineEvents([]);
    setTimelineLoading(true);
    try {
      const res = await agreementApi.getTimeline(ag.id);
      setTimelineEvents(res.data.timeline || []);
    } catch { /* ignore */ }
    setTimelineLoading(false);
  };

  const isVC = VC_TYPES.includes(typeFilter) || !!vcValuationFilter;

  const filteredAgreements = agreements.filter((a) => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.doc_type?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All Types" || a.doc_type === typeFilter;
    const matchVC = !vcValuationFilter || (() => {
      try {
        const kp = typeof a.key_points === "string" ? JSON.parse(a.key_points) : a.key_points;
        const val = parseFloat((kp?.financial_terms?.valuation || "").toString().replace(/[^0-9.]/g, ""));
        const filter = parseFloat(vcValuationFilter.replace(/[^0-9.]/g, ""));
        return !isNaN(val) && !isNaN(filter) && val >= filter;
      } catch { return false; }
    })();
    return matchSearch && matchType && matchVC;
  });

  const filteredDocuments = documents.filter((d) => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.doc_type?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All Types" || d.doc_type === typeFilter;
    return matchSearch && matchType;
  });

  const getKeyPoints = (ag: any) => {
    try { return typeof ag.key_points === "string" ? JSON.parse(ag.key_points) : ag.key_points; }
    catch { return null; }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Document Management</h1>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">Refresh</Button>
        </div>

        {/* Tab + search + filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-2">
            <button onClick={() => setDocTab("agreements")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "agreements" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              Agreements ({agreements.length})
            </button>
            <button onClick={() => setDocTab("documents")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "documents" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              Documents ({documents.length})
            </button>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setVcValuationFilter(""); }}
              className="h-8 rounded-lg border border-border bg-background text-sm px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {(isVC || VC_TYPES.includes(typeFilter)) && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Min valuation (₹):</span>
              <Input
                placeholder="e.g. 10000000"
                className="h-8 w-40 text-sm"
                value={vcValuationFilter}
                onChange={(e) => setVcValuationFilter(e.target.value)}
              />
              {vcValuationFilter && (
                <button onClick={() => setVcValuationFilter("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : docTab === "agreements" ? (
            filteredAgreements.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No agreements found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sent To</th>
                    {isVC && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Valuation</th>}
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgreements.map((ag) => {
                    const kp = getKeyPoints(ag);
                    const valuation = kp?.financial_terms?.valuation;
                    return (
                      <tr key={ag.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openDetail(ag)}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[180px]">{ag.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_type || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{ag.sent_to_name || (ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : "—")}</td>
                        {isVC && (
                          <td className="px-4 py-3 text-xs font-mono text-foreground">{valuation || "—"}</td>
                        )}
                        <td className="px-4 py-3">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[ag.status] || STATUS_COLORS[ag.pipeline_stage] || "bg-muted text-muted-foreground"}`}>
                              {ag.status?.replace(/_/g, " ")}
                            </span>
                            {ag.status === "rejected" && ag.rejection_reason && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                                <p className="text-xs text-destructive truncate max-w-[160px]">{ag.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(ag)}
                            className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No documents found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Owner</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDocDetail(doc)}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />{doc.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{doc.doc_type}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{doc.owner_id ? doc.owner_id.slice(0, 8) + "…" : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {doc.is_signed ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className={`text-xs capitalize ${doc.is_signed ? "text-green-600" : "text-muted-foreground"}`}>{doc.is_signed ? "Signed" : doc.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </motion.div>

      {/* Detail / Timeline Modal */}
      <AnimatePresence>
        {detailAg && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailAg(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <div>
                  <h2 className="font-display font-semibold text-foreground">{detailAg.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{detailAg.doc_type || "Agreement"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[detailAg.status] || "bg-muted text-muted-foreground"}`}>
                      {detailAg.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailAg(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rejection callout */}
              {detailAg.status === "rejected" && detailAg.rejection_reason && (
                <div className="mx-5 mt-4 flex gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-0.5">Rejection Reason</p>
                    <p className="text-xs text-destructive/90">{detailAg.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-4">
                {(["timeline", "content", "keypoints"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${contentTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {t === "keypoints" ? "Key Points" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-3">
                {/* Timeline tab */}
                {contentTab === "timeline" && (
                  timelineLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading timeline…</div>
                  ) : timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                  ) : (
                    <ol className="relative border-l border-border ml-2 space-y-4">
                      {timelineEvents.map((ev: any) => (
                        <li key={ev.id} className="ml-4">
                          <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary/40 border-2 border-primary" />
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{EVENT_LABELS[ev.event_type] || ev.event_type}</span>
                            <span className="text-xs text-muted-foreground">&mdash; {ev.actor_name || "System"}</span>
                          </div>
                          {ev.notes && <p className="text-xs text-muted-foreground">{ev.notes}</p>}
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}</p>
                        </li>
                      ))}
                    </ol>
                  )
                )}

                {/* Content tab */}
                {contentTab === "content" && (
                  <div className="bg-gray-100 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <div className="bg-white shadow-md rounded-sm mx-auto" style={{ padding: '32px 40px', fontFamily: "'Georgia','Times New Roman',serif" }}>
                      {renderDocContent(detailAg.content || "No content available.")}
                    </div>
                  </div>
                )}

                {/* Key Points tab */}
                {contentTab === "keypoints" && (() => {
                  const kp = getKeyPoints(detailAg);
                  if (!kp) return <p className="text-sm text-muted-foreground">No key points extracted.</p>;
                  return (
                    <div className="space-y-3 text-sm">
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
                            {kp.financial_terms.valuation && <><span className="text-muted-foreground">Valuation</span><span className="font-mono text-foreground">{kp.financial_terms.valuation}</span></>}
                            {kp.financial_terms.investment_amount && <><span className="text-muted-foreground">Investment</span><span className="font-mono text-foreground">{kp.financial_terms.investment_amount}</span></>}
                            {kp.financial_terms.equity_percentage && <><span className="text-muted-foreground">Equity</span><span className="font-mono text-foreground">{kp.financial_terms.equity_percentage}</span></>}
                            {kp.financial_terms.payment_terms && <><span className="text-muted-foreground">Payment</span><span className="font-mono text-foreground">{kp.financial_terms.payment_terms}</span></>}
                          </div>
                        </div>
                      )}
                      {kp.duration && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Duration: </span>{kp.duration}</p>}
                      {kp.governing_law && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Governing Law: </span>{kp.governing_law}</p>}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {docDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocDetail(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <div>
                  <h2 className="font-display font-semibold text-foreground">{docDetail.title || docDetail.doc_type}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{docDetail.doc_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[docDetail.status] || "bg-muted text-muted-foreground"}`}>
                      {docDetail.is_signed ? "Signed" : (docDetail.status || "pending")}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDocDetail(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Document Type</p>
                    <p className="text-foreground">{docDetail.doc_type || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Status</p>
                    <div className="flex items-center gap-1.5">
                      {docDetail.is_signed
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={`text-xs capitalize ${docDetail.is_signed ? "text-green-600" : "text-muted-foreground"}`}>
                        {docDetail.is_signed ? "Signed" : (docDetail.status || "pending")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Owner</p>
                    <p className="text-foreground font-mono text-xs">{docDetail.owner_id ? docDetail.owner_id.slice(0, 16) + "…" : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Date Submitted</p>
                    <p className="text-foreground">
                      {docDetail.created_at ? new Date(docDetail.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  {docDetail.signed_at && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Signed On</p>
                      <p className="text-green-600">
                        {new Date(docDetail.signed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>

                {docDetail.content && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Content</p>
                    <div className="bg-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto">
                      <div className="bg-white shadow-md rounded-sm mx-auto" style={{ padding: '28px 36px', fontFamily: "'Georgia','Times New Roman',serif" }}>
                        {renderDocContent(docDetail.content)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDocuments;
