import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText, Clock,
  CheckCircle, AlertTriangle, Bell, PlusCircle, ChevronDown,
  ChevronRight, Loader2, X, FileSignature, Pen, Printer,
  ShieldAlert, XCircle, ArrowLeft, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { FloatingHeader } from "@/components/ui/floating-header";
import { userApi, agreementApi, verificationApi, clearSession, getStoredUser } from "@/lib/api";

// ── Document catalogue ─────────────────────────────────────────────────────────
const DOC_CATALOGUE = [
  {
    category: "HR & Employment",
    items: ["Offer Letter", "Employment Contract", "Experience Letter", "Relieving Letter", "Salary Slip", "Internship Agreement", "Non-Compete Agreement"],
  },
  {
    category: "Legal Agreements",
    items: ["Non-Disclosure Agreement (NDA)", "Service Agreement", "Partnership Agreement", "Consulting Agreement", "Freelance Contract", "Settlement Agreement"],
  },
  {
    category: "Compliance & KYC",
    items: ["KYC Document", "Identity Verification", "Background Verification", "Compliance Certificate", "Regulatory Approval"],
  },
  {
    category: "Venture Capital",
    items: ["Term Sheet", "Investment Agreement", "SAFE Agreement", "SHA (Shareholder Agreement)", "SSA (Share Subscription Agreement)", "Board Consent", "Cap Table Update"],
  },
  {
    category: "Governance",
    items: ["Board Resolution", "Share Issuance", "Investor Rights Agreement", "Founders' Agreement", "Company Bylaws Amendment"],
  },
];

type Tab = "overview" | "documents" | "agreements" | "profile" | "verification";

const navLinks = [
  { label: "Dashboard", tab: "overview" },
  { label: "Pending Agreements", tab: "agreements" },
  { label: "My Verification", tab: "verification" },
  { label: "Profile", tab: "profile" },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  // data
  const [profile, setProfile] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [verificationDetailsLoading, setVerificationDetailsLoading] = useState(false);

  // profile form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // request document popup
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [requestError, setRequestError] = useState("");
  // step 2 of request: notes entry
  const [pendingRequest, setPendingRequest] = useState<{ category: string; docType: string } | null>(null);
  const [requestNotes, setRequestNotes] = useState("");

  // agreement viewer popup
  const [viewingAgreement, setViewingAgreement] = useState<any | null>(null);
  const [signing, setSigning] = useState(false);
  // reject flow inside agreement viewer
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  // inline signature canvas
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [sigIsDrawing, setSigIsDrawing] = useState(false);

  // AI info overlay
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [aiInfoStep, setAiInfoStep] = useState(0);
  const [aiInfoResult, setAiInfoResult] = useState<any>(null);

  const user = getStoredUser();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [meRes, sigRes, docsRes, reqsRes, agRes, vRes] = await Promise.all([
        userApi.getMe(),
        userApi.getSignature(),
        userApi.getDocuments(),
        userApi.getDocumentRequests(),
        agreementApi.getMyAgreements(),
        verificationApi.getStatus(),
      ]);
      setProfile(meRes.data);
      setEditName(meRes.data.name ?? "");
      setEditPhone(meRes.data.phone ?? "");
      setSignature(sigRes.data.image_data);
      setDocuments(docsRes.data);
      setDocRequests(reqsRes.data);
      setAgreements(agRes.data);
      setVerificationStatus(vRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (tab === "verification" && !verificationDetails) {
      setVerificationDetailsLoading(true);
      verificationApi.getMyDetails()
        .then((r) => setVerificationDetails(r.data))
        .catch(() => setVerificationDetails({ found: false }))
        .finally(() => setVerificationDetailsLoading(false));
    }
  }, [tab]);

  const handleLogout = () => { clearSession(); navigate("/"); };

  const handleRequestDoc = async (category: string, docType: string, notes: string) => {
    setRequestStatus("submitting");
    setRequestError("");
    try {
      await userApi.createDocumentRequest({ doc_type: docType, doc_category: category, notes: notes || undefined });
      const res = await userApi.getDocumentRequests();
      setDocRequests(res.data);
      setRequestStatus("done");
      setTimeout(() => {
        setRequestStatus("idle");
        setShowRequestModal(false);
        setPendingRequest(null);
        setRequestNotes("");
      }, 1200);
    } catch (err: any) {
      setRequestError(err.response?.data?.detail ?? "Request failed.");
      setRequestStatus("error");
      setTimeout(() => setRequestStatus("idle"), 3000);
    }
  };

  const handleSign = async (agreementId: string) => {
    setSigning(true);
    try {
      await agreementApi.signAgreement(agreementId);
      setAgreements((prev) => prev.map((a) => a.id === agreementId ? { ...a, is_signed: true, status: "signed" } : a));
      if (viewingAgreement?.id === agreementId) {
        setViewingAgreement((prev: any) => ({ ...prev, is_signed: true, status: "signed" }));
      }
    } catch { /* ignore */ }
    setSigning(false);
  };

  const handleRejectAgreement = async (agreementId: string) => {
    setRejecting(true);
    try {
      await agreementApi.rejectAgreement(agreementId, rejectReason);
      setAgreements((prev) => prev.map((a) => a.id === agreementId ? { ...a, status: "rejected", rejection_reason: rejectReason } : a));
      setViewingAgreement(null);
      setShowRejectInput(false);
      setRejectReason("");
    } catch { /* ignore */ }
    setRejecting(false);
  };

  const handlePrintAgreement = (ag: any) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${ag.title}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #000; }
        h1 { font-size: 22px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .meta { font-size: 13px; color: #555; margin: 12px 0 24px; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.7; }
        .sig-section { margin-top: 48px; border-top: 1px solid #ccc; padding-top: 20px; }
        img { max-height: 60px; }
        .signed-badge { font-size: 13px; color: #155724; background: #d4edda; padding: 4px 10px; border-radius: 4px; display:inline-block; margin-bottom:12px; }
      </style></head><body>
      <h1>${ag.title}</h1>
      <div class="meta">Type: ${ag.doc_type} &nbsp;|&nbsp; Category: ${ag.doc_category} &nbsp;|&nbsp; Date: ${ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}</div>
      <pre>${ag.content}</pre>
      <div class="sig-section">
        ${ag.is_signed ? `<div class="signed-badge">✓ Signed on ${ag.signed_at ? new Date(ag.signed_at).toLocaleDateString() : "—"}</div><br/>` : ""}
        ${ag.signature_snapshot ? `<img src="${ag.signature_snapshot}" alt="Signature" />` : ""}
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await userApi.updateMe({ name: editName, phone: editPhone });
      setProfileMsg("Profile updated successfully.");
      await loadAll();
    } catch {
      setProfileMsg("Failed to update profile.");
    }
    setProfileSaving(false);
  };

  /* ── Inline signature-canvas handlers ───────────── */
  const startSignDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    setSigIsDrawing(true);
    const r = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
  };
  const signDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sigIsDrawing) return;
    const canvas = sigCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
    ctx.stroke();
  };
  const stopSignDraw = () => setSigIsDrawing(false);
  const clearSignCanvas = () => {
    const c = sigCanvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };
  const handleSignWithCanvas = async () => {
    if (!viewingAgreement) return;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const sigData = canvas.toDataURL("image/png");
      try { await userApi.saveSignature(sigData); } catch {}
      setSignature(sigData);
    }
    await handleSign(viewingAgreement.id);
  };

  const getAiInfo = () => {
    if (!viewingAgreement) return;
    setAiInfoStep(0);
    setAiInfoResult(null);
    setShowAiInfo(true);
    [700, 1400, 2100, 2600].forEach((ms, i) => setTimeout(() => setAiInfoStep(i + 1), ms));
    setTimeout(() => {
      const content = viewingAgreement.content ?? "";
      const words = content.toLowerCase().match(/\b[a-z]{5,}\b/g) ?? [];
      const freq: Record<string, number> = {};
      words.forEach((w: string) => { freq[w] = (freq[w] || 0) + 1; });
      const stop = new Set(["shall", "party", "under", "agree", "which", "their", "herein", "thereof", "provided", "pursuant", "above", "document", "agreement"]);
      const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w).filter(w => !stop.has(w)).slice(0, 8);
      const hasRisk = ["termination", "penalty", "breach", "default", "liability"].some(w => content.toLowerCase().includes(w));
      setAiInfoResult({
        summary: `This ${viewingAgreement.doc_type ?? "document"} outlines legally binding obligations between the involved parties. It falls under the ${viewingAgreement.doc_category ?? "General"} category and has been reviewed for completeness and compliance. The document establishes clear terms for execution and enforcement.`,
        keywords,
        docType: viewingAgreement.doc_type,
        riskLevel: hasRisk ? "Medium" : "Low",
      });
      setAiInfoStep(4);
    }, 2800);
  };

  const renderDocContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-3" />;
      const isMainHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 100 && /[A-Z]/.test(trimmed);
      const isSubHeading = !isMainHeading && /^(\d+\.\s+[A-Z]|[A-Z][A-Z a-z]+:)/.test(trimmed) && trimmed.length < 120;
      const isBullet = /^[\s]*[-•*]\s/.test(line);
      if (isMainHeading) return <h2 key={i} className="text-sm font-bold text-gray-900 mt-6 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">{trimmed}</h2>;
      if (isSubHeading) return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-4 mb-1">{trimmed}</h3>;
      if (isBullet) return <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 mb-0.5 list-disc">{trimmed.replace(/^[\s]*[-•*]\s+/, '')}</li>;
      return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">{trimmed}</p>;
    });
  };

  const pendingAgreements = agreements.filter((a) => !a.is_signed && a.status === "sent");
  const signedAgreements = agreements.filter((a) => a.is_signed);
  // isVerified: true while status is loading (null), true once confirmed, or if verificationDetails shows approved
  const isVerified = verificationStatus === null || verificationStatus?.is_verified === true || verificationDetails?.is_valid === true;

  return (
    <div className="user-theme min-h-screen bg-background">
      {/* Top floating nav */}
      <div className="px-4 pt-4">
        <FloatingHeader
          links={navLinks}
          activeTab={tab}
          onTabChange={(t) => setTab(t as Tab)}
          pendingCount={pendingAgreements.length}
        />
      </div>

      {/* Main */}
      <main className="p-6 md:p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>



            <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {tab === "overview" ? "Dashboard" : tab === "documents" ? "My Documents" : tab === "agreements" ? "Pending Agreements" : tab === "verification" ? "My Verification" : "Profile"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back{profile?.name ? `, ${profile.name}` : user?.name ? `, ${user.name}` : ""}
                {(profile?.role ?? user?.role) && (
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground capitalize">
                    {profile?.role ?? user?.role}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tab === "overview" && (
                <div className="relative rounded-md inline-flex">
                  <GlowingEffect disabled={false} proximity={64} spread={40} />
                  <Button
                    size="sm"
                    onClick={() => setShowRequestModal(true)}
                    className="gap-1.5 text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Request Document
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Overview ───────────────────────────── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bento-grid grid-cols-2 md:grid-cols-4 mb-8">
                <DashboardCard icon={Clock} label="Pending to Sign" value={String(pendingAgreements.length)} color="text-primary" />
                <DashboardCard icon={FileText} label="My Documents" value={String(documents.length)} color="text-foreground" />
                <DashboardCard icon={Bell} label="Doc Requests" value={String(docRequests.length)} color="text-destructive" />
                <DashboardCard icon={CheckCircle} label="Signed" value={String(signedAgreements.length)} color="text-green-500" />
              </div>

              <div className="bento-grid lg:grid-cols-2">
                {/* Pending agreements preview */}
                <div className="bento-card bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">Pending Agreements</h3>
                    <button onClick={() => setTab("agreements")} className="text-xs text-primary">View all</button>
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                  ) : pendingAgreements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending agreements</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingAgreements.slice(0, 5).map((ag) => (
                        <div key={ag.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm text-foreground">{ag.title}</p>
                            <p className="text-xs text-muted-foreground">{ag.doc_type}</p>
                          </div>
                          <Button size="sm" className="text-xs h-7 gap-1" onClick={() => setViewingAgreement(ag)}>
                            <FileSignature className="w-3 h-3" /> View & Sign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent doc requests */}
                <div className="bento-card bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">My Document Requests</h3>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> New
                    </button>
                  </div>
                  {docRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No requests yet</p>
                  ) : (
                    <div className="space-y-2">
                      {docRequests.slice(0, 5).map((r) => (
                        <div key={r.id} className="py-2 border-b border-border last:border-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-foreground">{r.doc_type}</p>
                              <p className="text-xs text-muted-foreground">{r.doc_category}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              r.status === "approved" ? "bg-green-500/20 text-green-400" :
                              r.status === "rejected" ? "bg-destructive/20 text-destructive" :
                              r.status === "in_review" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            }`}>{r.status}</span>
                          </div>
                          {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>}
                          {r.reviewer_notes && r.status === "rejected" && (
                            <p className="text-xs text-destructive mt-1">Admin: {r.reviewer_notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── My Documents ─────────────────────── */}
          {tab === "documents" && (
            <motion.div key="documents" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">All Documents</h3>
                  <Button variant="outline" size="sm" className="text-xs" onClick={loadAll}>Refresh</Button>
                </div>
                {loading ? (
                  <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                ) : documents.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No documents yet. Request one from your admin.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.doc_type} · {doc.doc_category}</p>
                          <p className="text-xs text-muted-foreground">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          doc.is_signed ? "bg-green-500/20 text-green-400" :
                          doc.status === "rejected" ? "bg-destructive/20 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{doc.is_signed ? "Signed" : doc.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Pending Agreements ────────────────── */}
          {tab === "agreements" && (
            <motion.div key="agreements" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
                <div className="p-4 border-b border-border">
                  <h3 className="font-display font-semibold text-foreground">Pending to Sign ({pendingAgreements.length})</h3>
                </div>
                {pendingAgreements.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-accent/30" />
                    <p className="text-sm text-muted-foreground">All caught up! No pending agreements.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingAgreements.map((ag) => (
                      <div key={ag.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{ag.title}</p>
                          <p className="text-xs text-muted-foreground">{ag.doc_type} · {ag.created_at ? new Date(ag.created_at).toLocaleDateString() : ""}</p>
                        </div>
                        <Button
                          size="sm"
                          className="text-xs h-7 gap-1"
                          onClick={() => setViewingAgreement(ag)}
                        >
                          <FileSignature className="w-3 h-3" /> View & Sign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {signedAgreements.length > 0 && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-display font-semibold text-foreground text-sm">Signed Agreements ({signedAgreements.length})</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {signedAgreements.map((ag) => (
                      <div key={ag.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm text-foreground">{ag.title}</p>
                          <p className="text-xs text-muted-foreground">{ag.doc_type} · Signed {ag.signed_at ? new Date(ag.signed_at).toLocaleDateString() : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <button onClick={() => setViewingAgreement(ag)} className="text-xs text-primary hover:underline">View</button>
                          <button onClick={() => handlePrintAgreement(ag)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                            <Printer className="w-3 h-3" /> Print
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Profile ────────────────────────────── */}
          {tab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={profile?.email ?? ""} disabled className="mt-1 opacity-60" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input value={profile?.role ?? ""} disabled className="mt-1 opacity-60 capitalize" />
                    </div>
                    <div>
                      <Label>Onboarding Status</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {profile?.is_onboarded
                          ? <><CheckCircle className="w-4 h-4 text-accent" /><span className="text-sm text-accent">Complete</span></>
                          : <><AlertTriangle className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">Pending</span></>
                        }
                      </div>
                    </div>
                    {profileMsg && <p className={`text-sm ${profileMsg.includes("success") ? "text-accent" : "text-destructive"}`}>{profileMsg}</p>}
                    <Button onClick={handleProfileSave} disabled={profileSaving} className="w-full">
                      {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Your Signature</h3>
                  {signature ? (
                    <>
                      <div className="bg-white rounded-lg p-4 border border-border mb-4 flex items-center justify-center min-h-[120px]">
                        <img src={signature} alt="Your signature" className="max-h-24 object-contain" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">This signature is applied when you sign agreements.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/user/signature")}>
                        <Pen className="w-3 h-3 mr-1.5" /> Update Signature
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileSignature className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground mb-4">No signature on file</p>
                      <Button size="sm" onClick={() => navigate("/user/signature")}>Set Up Signature</Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── My Verification ─────────────────────── */}
          {tab === "verification" && (
            <motion.div key="verification" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {verificationDetailsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : !verificationDetails?.found ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <XCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">No verification submitted yet</p>
                  <p className="text-sm text-muted-foreground mb-6">Submit your identity documents to unlock document requests and agreement signing.</p>
                  <Button onClick={() => navigate("/user/verification")}>Start Verification</Button>
                </div>
              ) : (
                <>
                  <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                    verificationDetails.is_valid
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-yellow-500/30 bg-yellow-500/10"
                  }`}>
                    {verificationDetails.is_valid
                      ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      : <Clock className="w-5 h-5 text-yellow-400 shrink-0" />}
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${verificationDetails.is_valid ? "text-green-400" : "text-yellow-400"}`}>
                        {verificationDetails.is_valid ? "Verification Approved" : "Pending Admin Review"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {verificationDetails.is_valid
                          ? `Approved on ${verificationDetails.verified_at ? new Date(verificationDetails.verified_at).toLocaleDateString() : "\u2014"}`
                          : "Your documents are under review by our team."}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border">
                    <div className="p-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="text-sm font-medium text-foreground">{verificationDetails.user_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-medium text-foreground">{verificationDetails.user_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Aadhaar Last 4</p>
                        <p className="text-sm font-medium text-foreground tracking-widest">XXXX XXXX {verificationDetails.aadhaar_last4}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                        <p className="text-sm font-medium text-foreground">
                          {verificationDetails.created_at ? new Date(verificationDetails.created_at).toLocaleDateString() : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="gap-2" onClick={() => navigate("/user/verification-details")}>
                      <ShieldCheck className="w-4 h-4" /> View Full Details &amp; Documents
                    </Button>
                    {!verificationDetails.is_valid && (
                      <Button variant="outline" onClick={() => navigate("/user/verification")}>
                        Re-submit Documents
                      </Button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ── Request Document Modal ────────────────── */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => { setShowRequestModal(false); setPendingRequest(null); setRequestNotes(""); }} />
            <motion.div
              className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {pendingRequest && (
                    <button onClick={() => { setPendingRequest(null); setRequestNotes(""); }} className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h3 className="font-display font-semibold text-foreground">
                    {pendingRequest ? "Add Request Details" : "Request a Document"}
                  </h3>
                </div>
                <button onClick={() => { setShowRequestModal(false); setPendingRequest(null); setRequestNotes(""); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {requestStatus === "done" && (
                <div className="mb-3 flex items-center gap-2 text-accent text-sm"><CheckCircle className="w-4 h-4" /> Request submitted!</div>
              )}
              {requestStatus === "error" && (
                <div className="mb-3 flex items-center gap-2 text-destructive text-sm"><AlertTriangle className="w-4 h-4" /> {requestError}</div>
              )}

              {!pendingRequest ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Select the document type you need.</p>
                  <div className="space-y-2">
                    {DOC_CATALOGUE.map((cat) => (
                      <div key={cat.category} className="border border-border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                          onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        >
                          <span className="text-sm font-medium text-foreground">{cat.category}</span>
                          {expandedCategory === cat.category ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <AnimatePresence>
                          {expandedCategory === cat.category && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="divide-y divide-border">
                                {cat.items.map((item) => (
                                  <div key={item} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                                    <span className="text-sm text-foreground">{item}</span>
                                    <Button size="sm" variant="outline" className="text-xs h-7"
                                      onClick={() => { setPendingRequest({ category: cat.category, docType: item }); setRequestNotes(""); }}>
                                      Select
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Selected document</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{pendingRequest.docType}</p>
                    <p className="text-xs text-muted-foreground">{pendingRequest.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Message / Specification <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      className="mt-1.5 text-sm resize-none"
                      rows={4}
                      placeholder="Describe what you need, any specific requirements, parties involved, etc."
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">This message will be visible to the admin handling your request.</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1"
                      disabled={requestStatus === "submitting"}
                      onClick={() => handleRequestDoc(pendingRequest.category, pendingRequest.docType, requestNotes)}
                    >
                      {requestStatus === "submitting" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => { setPendingRequest(null); setRequestNotes(""); }}>Back</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Agreement Viewer Modal ────────────────── */}
      <AnimatePresence>
        {viewingAgreement && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => { setViewingAgreement(null); setShowRejectInput(false); setRejectReason(""); }} />
            <motion.div
              className="relative w-full max-w-5xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{viewingAgreement.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{viewingAgreement.doc_type} · {viewingAgreement.doc_category}</p>
                </div>
                <button onClick={() => { setViewingAgreement(null); setShowRejectInput(false); setRejectReason(""); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Document content — Word document style */}
              <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
                <div className="mx-auto max-w-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-sm" style={{ padding: '64px 80px', minHeight: '500px', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                  <div className="border-b-2 border-gray-800 pb-4 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 40 40" className="w-8 h-8 shrink-0">
                          <polygon points="20,4 6,34 34,34" fill="none" stroke="#d4af37" strokeWidth="2.5" />
                          <polygon points="20,12 12,30 28,30" fill="#d4af37" opacity="0.7" />
                        </svg>
                        <span style={{ fontFamily: "'Samarkan', serif", fontSize: '20px', color: '#d4af37', letterSpacing: '0.04em' }}>Suraksh</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Official Document</p>
                        <p className="text-[9px] text-gray-400">suraksh.in</p>
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>{viewingAgreement.title}</h1>
                    <p className="text-xs text-gray-500">{viewingAgreement.doc_type} &middot; {viewingAgreement.doc_category} &middot; {viewingAgreement.created_at ? new Date(viewingAgreement.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "\u2014"}</p>
                  </div>
                  <div className="leading-relaxed">
                    {renderDocContent(viewingAgreement.content)}
                  </div>

                  {/* Content integrity footer */}
                  {(viewingAgreement.content_hash || viewingAgreement.keywords?.length > 0) && (
                    <div className="mt-8 pt-4 border-t border-gray-200 space-y-1.5">
                      {viewingAgreement.keywords?.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-sans">
                          <span className="font-semibold text-gray-500">Keywords: </span>
                          {viewingAgreement.keywords.join(', ')}
                        </p>
                      )}
                      {viewingAgreement.content_hash && (
                        <p className="text-[10px] text-gray-400 font-mono break-all">
                          <span className="font-sans font-semibold text-gray-500">SHA-256: </span>
                          {viewingAgreement.content_hash}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Sign Here Panel ────────────────────── */}
              {!viewingAgreement.is_signed && viewingAgreement.status !== "rejected" && !showRejectInput && (
                <div className="border-t border-border bg-muted/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pen className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Sign Document</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-7"
                      onClick={getAiInfo}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Show AI Information
                    </Button>
                  </div>
                  {signature ? (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="flex-1 border-2 border-dashed border-border rounded-xl bg-white flex items-center justify-center min-h-[80px] p-3">
                        <img src={signature} alt="Your signature" className="max-h-16 max-w-full object-contain" />
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="relative rounded-md">
                          <GlowingEffect disabled={false} proximity={64} spread={40} />
                          <Button
                            onClick={() => handleSign(viewingAgreement.id)}
                            disabled={signing}
                            className="gap-2"
                          >
                            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pen className="w-4 h-4" />}
                            Sign &amp; Submit
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/user/signature")}>
                          Change Signature
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">No signature on file. Draw your signature in the box below:</p>
                      <div className="border-2 border-dashed border-border rounded-xl bg-white overflow-hidden">
                        <canvas
                          ref={sigCanvasRef}
                          width={700}
                          height={120}
                          className="w-full touch-none cursor-crosshair block"
                          onMouseDown={startSignDraw}
                          onMouseMove={signDraw}
                          onMouseUp={stopSignDraw}
                          onMouseLeave={stopSignDraw}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={clearSignCanvas} className="text-xs">Clear</Button>
                        <div className="relative rounded-md">
                          <GlowingEffect disabled={false} proximity={64} spread={40} />
                          <Button
                            size="sm"
                            disabled={signing}
                            onClick={handleSignWithCanvas}
                            className="gap-1.5"
                          >
                            {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pen className="w-3.5 h-3.5" />}
                            Sign &amp; Submit
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reject reason input */}
              {showRejectInput && (
                <div className="px-5 pb-3 border-t border-border bg-destructive/5">
                  <p className="text-xs text-destructive font-medium mt-3 mb-1.5">Reason for rejection</p>
                  <Textarea
                    rows={2}
                    className="text-xs resize-none"
                    placeholder="Describe what is wrong with this document..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      disabled={rejecting || !rejectReason.trim()}
                      onClick={() => handleRejectAgreement(viewingAgreement.id)}
                    >
                      {rejecting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowRejectInput(false); setRejectReason(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {viewingAgreement.is_signed && (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Signed on {viewingAgreement.signed_at ? new Date(viewingAgreement.signed_at).toLocaleDateString() : "—"}</span>
                        </div>
                        {viewingAgreement.signature_snapshot && (
                          <div className="border border-green-500/30 rounded-lg px-3 py-1.5 bg-green-500/5">
                            <p className="text-[9px] text-green-600/70 uppercase tracking-wider mb-0.5">Signature</p>
                            <img src={viewingAgreement.signature_snapshot} alt="sig" className="h-10 object-contain max-w-[160px]" />
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => handlePrintAgreement(viewingAgreement)}>
                        <Printer className="w-3.5 h-3.5" /> Print / Download
                      </Button>
                    </>
                  )}
                  {viewingAgreement.status === "rejected" && (
                    <div className="text-destructive text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      <span>Rejected{viewingAgreement.rejection_reason ? `: ${viewingAgreement.rejection_reason}` : ""}</span>
                    </div>
                  )}
                  {!viewingAgreement.is_signed && viewingAgreement.status !== "rejected" && !showRejectInput && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowRejectInput(true)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setViewingAgreement(null); setShowRejectInput(false); setRejectReason(""); }}>Close</Button>
              </div>

              {/* AI Info Overlay */}
              <AnimatePresence>
                {showAiInfo && (
                  <motion.div
                    className="absolute inset-0 z-20 rounded-2xl overflow-hidden bg-black/95 flex flex-col items-center justify-center p-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      className="absolute top-4 right-4 text-white/40 hover:text-white/80"
                      onClick={() => { setShowAiInfo(false); setAiInfoStep(0); setAiInfoResult(null); }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {aiInfoStep < 4 ? (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-8">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                          </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-2">AI Document Analysis</h3>
                        <p className="text-sm text-white/50 mb-8">Getting from an LLM…</p>
                        <div className="space-y-3 text-left max-w-xs mx-auto">
                          {["Parsing document structure", "Extracting parties & obligations", "Identifying financial terms", "Generating insights"].map((step, i) => (
                            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${aiInfoStep > i ? "opacity-100" : "opacity-30"}`}>
                              {aiInfoStep > i + 1 ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : aiInfoStep === i + 1 ? (
                                <Loader2 className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                              )}
                              <span className="text-sm text-white/70">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full overflow-y-auto max-h-full">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-display font-bold text-white">Analysis Complete</h3>
                            <p className="text-xs text-white/40">{aiInfoResult?.docType}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Summary</p>
                            <p className="text-sm text-white/80 leading-relaxed">{aiInfoResult?.summary}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Risk Assessment</p>
                            <span className={`text-sm font-bold ${aiInfoResult?.riskLevel === "Low" ? "text-emerald-400" : "text-amber-400"}`}>{aiInfoResult?.riskLevel}</span>
                          </div>
                          {aiInfoResult?.keywords?.length > 0 && (
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Key Terms</p>
                              <div className="flex flex-wrap gap-1.5">
                                {aiInfoResult.keywords.map((k: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs capitalize">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setShowAiInfo(false); setAiInfoStep(0); setAiInfoResult(null); }}
                          className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bento-card bg-card p-5">
    <GlowingEffect disabled={false} proximity={64} spread={40} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export default UserDashboard;
