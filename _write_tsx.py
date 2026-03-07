#!/usr/bin/env python3
"""Helper script to write frontend TSX files with complex content."""
import os

# ─── AdminAgreements.tsx ──────────────────────────────────────────────────────

admin_agreements = r"""import { useState, useEffect } from "react";
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
  signed: "bg-accent/20 text-accent",
  rejected: "bg-destructive/20 text-destructive",
  pending_lawyer_review: "bg-amber-100 text-amber-700",
  lawyer_approved: "bg-emerald-100 text-emerald-700",
  lawyer_rejected: "bg-red-100 text-red-700",
  on_hold: "bg-orange-100 text-orange-600",
  completed: "bg-accent/20 text-accent",
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

  const handleHold = async (agId: string) => {
    await agreementApi.hold(agId, "Paused by admin");
    load();
  };

  const handleResume = async (agId: string) => {
    await agreementApi.resume(agId);
    load();
  };

  const filtered = agreements.filter((a) => {
    const statusOk = statusFilter === "all" || a.status === statusFilter;
    const typeOk = typeFilter === "All Types" || a.doc_type === typeFilter;
    return statusOk && typeOk;
  });

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

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f.replace(/_/g, " ")}
                {" "}({f === "all" ? agreements.length : agreements.filter(a => a.status === f).length})
              </button>
            ))}
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="ml-auto rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
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
                    <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{ag.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_type}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{ag.sent_to_name ?? (ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : <span className="italic">—</span>)}</div>
                        {ag.lawyer_name && (
                          <div className="text-[10px] text-amber-600 mt-0.5">⚖️ {ag.lawyer_name}</div>
                        )}
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
                      <td className="px-4 py-3">
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
                                {ev.actor_name && (
                                  <p className="text-xs text-muted-foreground">by {ev.actor_name}</p>
                                )}
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

                    {/* User rejection reason callout */}
                    {timelineModal.ag.rejection_reason && (
                      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <p className="text-sm font-semibold text-destructive">Rejection Message from User</p>
                        </div>
                        <p className="text-sm text-foreground">"{timelineModal.ag.rejection_reason}"</p>
                      </div>
                    )}

                    {/* Lawyer remarks callout */}
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
                              <span key={i} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Signature snapshot */}
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
                        <><CheckCircle className="w-4 h-4 text-accent" />
                        <span className="text-sm text-accent">Signed {timelineModal.ag.signed_at ? new Date(timelineModal.ag.signed_at).toLocaleDateString() : ""}</span></>
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
"""

# ─── AdminDocuments.tsx ──────────────────────────────────────────────────────

admin_documents = r"""import { useState, useEffect } from "react";
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
  signed: "bg-accent/20 text-accent",
  rejected: "bg-destructive/20 text-destructive",
  pending_lawyer_review: "bg-amber-100 text-amber-700",
  lawyer_approved: "bg-emerald-100 text-emerald-700",
  lawyer_rejected: "bg-red-100 text-red-700",
  on_hold: "bg-orange-100 text-orange-600",
  completed: "bg-accent/20 text-accent",
  pending: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
};

const AdminDocuments = () => {
  const [docTab, setDocTab] = useState<"agreements" | "documents">("agreements");
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [vcValuationFilter, setVcValuationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

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
    setDetailModal(ag);
    setTimelineEvents([]);
    setTimelineLoading(true);
    try {
      const res = await agreementApi.getTimeline(ag.id);
      const d = res.data as any;
      setTimelineEvents(d.timeline ?? []);
    } catch { /* ignore */ }
    setTimelineLoading(false);
  };

  const vcAgreements = agreements.filter(a =>
    a.doc_category === "Venture Capital" ||
    a.doc_type === "Investment Agreement" ||
    a.doc_type === "SAFE Agreement" ||
    a.doc_type === "Term Sheet" ||
    a.doc_type === "SHA"
  );

  const filteredAgreements = agreements.filter((a) => {
    const searchOk = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.doc_type?.toLowerCase().includes(search.toLowerCase());
    const typeOk = typeFilter === "All Types" || a.doc_type === typeFilter;
    const vcOk = !vcValuationFilter || (() => {
      const ft = a.key_points?.financial_terms;
      if (!ft) return false;
      const val = (ft.valuation ?? ft.investment_amount ?? "").toLowerCase();
      return val.includes(vcValuationFilter.toLowerCase());
    })();
    return searchOk && typeOk && vcOk;
  });

  const filteredDocuments = documents.filter((d) =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.doc_type?.toLowerCase().includes(search.toLowerCase())
  );

  const isVC = typeFilter === "Investment Agreement" || typeFilter === "SAFE Agreement" || typeFilter === "Term Sheet" || typeFilter === "SHA" || vcValuationFilter;

  const EVENT_LABELS: Record<string, string> = {
    created: "Created", sent_to_lawyer: "Sent to lawyer", lawyer_approved: "Lawyer approved",
    lawyer_rejected: "Lawyer rejected", sent_to_user: "Sent to user", signed: "Signed by user",
    rejected_by_user: "Rejected by user", put_on_hold: "Paused", resumed: "Resumed",
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Document Management</h1>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">Refresh</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-2">
            <button onClick={() => setDocTab("agreements")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "agreements" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              Agreements ({agreements.length})
            </button>
            <button onClick={() => setDocTab("documents")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "documents" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              Documents ({documents.length})
            </button>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-10 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {docTab === "agreements" && (
            <>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setVcValuationFilter(""); }}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground">
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {isVC && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-amber-600 font-medium">VC Valuation filter:</span>
                  <Input
                    placeholder="e.g. 1 Cr, 5M…"
                    className="h-7 w-32 text-xs"
                    value={vcValuationFilter}
                    onChange={(e) => setVcValuationFilter(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    {isVC && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Valuation</th>}
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgreements.map((ag) => (
                    <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />{ag.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ag.doc_type}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {ag.sent_to_name ?? (ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : "—")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[ag.status] ?? "bg-muted text-muted-foreground"}`}>
                          {ag.status?.replace(/_/g, " ")}
                        </span>
                        {ag.status === "rejected" && ag.rejection_reason && (
                          <div className="text-[10px] text-destructive mt-0.5 max-w-[130px] truncate" title={ag.rejection_reason}>
                            "{ag.rejection_reason}"
                          </div>
                        )}
                      </td>
                      {isVC && (
                        <td className="px-4 py-3 text-xs text-amber-700 font-medium">
                          {ag.key_points?.financial_terms?.valuation ?? ag.key_points?.financial_terms?.investment_amount ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openDetail(ag)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                    <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />{doc.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.doc_type}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{doc.owner_id ? doc.owner_id.slice(0, 8) + "…" : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {doc.is_signed ? <CheckCircle className="w-3.5 h-3.5 text-accent" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className={`text-xs capitalize ${doc.is_signed ? "text-accent" : "text-muted-foreground"}`}>
                            {doc.is_signed ? "Signed" : doc.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </motion.div>

      {/* Detail + Timeline Modal */}
      <AnimatePresence>
        {detailModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setDetailModal(null)} />
            <motion.div className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{detailModal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{detailModal.doc_type} · {detailModal.doc_category}</p>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[detailModal.status] ?? "bg-muted text-muted-foreground"}`}>
                    {detailModal.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <button onClick={() => setDetailModal(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Rejection callout */}
                {detailModal.rejection_reason && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <p className="text-sm font-semibold text-destructive">Rejection Message from User</p>
                    </div>
                    <p className="text-sm text-foreground">"{detailModal.rejection_reason}"</p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Activity Timeline</h4>
                  {timelineLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
                  ) : timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No events recorded.</p>
                  ) : (
                    <ol className="relative border-l border-border ml-2 space-y-3">
                      {timelineEvents.map((ev) => (
                        <li key={ev.id} className="ml-5">
                          <span className="absolute -left-2.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-xs">●</span>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-sm font-medium">{EVENT_LABELS[ev.event_type] ?? ev.event_type.replace(/_/g, " ")}</p>
                            {ev.actor_name && <p className="text-xs text-muted-foreground">by {ev.actor_name}</p>}
                            {ev.notes?.trim() && <p className="text-xs italic mt-0.5">"{ev.notes}"</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(ev.timestamp).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Financial terms for VC */}
                {detailModal.key_points?.financial_terms && Object.values(detailModal.key_points.financial_terms).some(Boolean) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Financial Terms</p>
                    {Object.entries(detailModal.key_points.financial_terms as Record<string,string>).map(([k, v]) =>
                      v ? <p key={k} className="text-sm"><span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span> <strong>{v}</strong></p> : null
                    )}
                  </div>
                )}

                {/* Agreement text preview */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Content</h4>
                  <div className="bg-white rounded-lg p-4 shadow-inner max-h-60 overflow-y-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{detailModal.content}</pre>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-border flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setDetailModal(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDocuments;
"""

base = r"d:\suraksh\Suraksh\frontend\src\pages"
with open(os.path.join(base, "AdminAgreements.tsx"), "w", encoding="utf-8") as f:
    f.write(admin_agreements)
    print(f"AdminAgreements.tsx: {len(admin_agreements)} chars")

with open(os.path.join(base, "AdminDocuments.tsx"), "w", encoding="utf-8") as f:
    f.write(admin_documents)
    print(f"AdminDocuments.tsx: {len(admin_documents)} chars")
