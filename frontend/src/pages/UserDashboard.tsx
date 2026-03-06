import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Clock, UserCircle, LogOut,
  CheckCircle, AlertTriangle, Bell, PlusCircle, ChevronDown,
  ChevronRight, Loader2, X, FileSignature, Pen, Printer,
  ShieldAlert, XCircle, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Tab = "overview" | "documents" | "agreements" | "profile";

const navItems: { label: string; icon: any; tab: Tab }[] = [
  { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { label: "My Documents", icon: FileText, tab: "documents" },
  { label: "Pending Agreements", icon: Clock, tab: "agreements" },
  { label: "Profile", icon: UserCircle, tab: "profile" },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // data
  const [profile, setProfile] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

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
    if (!isVerified) return;
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

  const pendingAgreements = agreements.filter((a) => !a.is_signed && a.status === "sent");
  const signedAgreements = agreements.filter((a) => a.is_signed);
  const isVerified = verificationStatus?.is_verified === true;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        className="bg-suraksh-navy border-r border-suraksh-steel/20 flex flex-col shrink-0"
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 flex items-center gap-3 border-b border-suraksh-steel/20">
          <svg viewBox="0 0 40 40" className="w-7 h-7 shrink-0">
            <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
            <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
          </svg>
          {sidebarOpen && <span className="font-display font-semibold tracking-wider text-suraksh-glow text-sm">SURAKSH</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === item.tab
                  ? "bg-suraksh-steel/20 text-suraksh-glow"
                  : "text-suraksh-slate hover:bg-suraksh-steel/10 hover:text-primary-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <span className="flex-1 text-left">
                  {item.label}
                  {item.tab === "agreements" && pendingAgreements.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                      {pendingAgreements.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-suraksh-steel/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-suraksh-slate hover:bg-suraksh-steel/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Verification Banner ────────────────── */}
          {!isVerified && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-3">
              <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-300">Identity verification incomplete</p>
                <p className="text-xs text-yellow-400/80 mt-0.5">
                  {verificationStatus?.aadhaar_submitted
                    ? "Your Aadhaar is under admin review. Document requests and signing are locked until approved."
                    : "You must complete identity verification before making document requests or signing agreements."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 shrink-0"
                onClick={() => navigate("/user/verification")}
              >
                Complete Verification
              </Button>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {tab === "overview" ? "Dashboard" : tab === "documents" ? "My Documents" : tab === "agreements" ? "Pending Agreements" : "Profile"}
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
                <Button
                  size="sm"
                  onClick={() => { if (isVerified) setShowRequestModal(true); }}
                  disabled={!isVerified}
                  title={!isVerified ? "Complete identity verification first" : undefined}
                  className="gap-1.5 text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Request Document
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>

          {/* ── Overview ───────────────────────────── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <DashboardCard icon={Clock} label="Pending to Sign" value={String(pendingAgreements.length)} color="text-primary" />
                <DashboardCard icon={FileText} label="My Documents" value={String(documents.length)} color="text-foreground" />
                <DashboardCard icon={Bell} label="Doc Requests" value={String(docRequests.length)} color="text-destructive" />
                <DashboardCard icon={CheckCircle} label="Signed" value={String(signedAgreements.length)} color="text-accent" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Pending agreements preview */}
                <div className="rounded-xl border border-border bg-card p-6">
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
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">My Document Requests</h3>
                    <button
                      onClick={() => { if (isVerified) setShowRequestModal(true); }}
                      disabled={!isVerified}
                      title={!isVerified ? "Complete identity verification first" : undefined}
                      className="text-xs text-primary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
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
                              r.status === "approved" ? "bg-accent/20 text-accent" :
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
                          doc.is_signed ? "bg-accent/20 text-accent" :
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
                          disabled={!isVerified}
                          title={!isVerified ? "Complete verification first" : undefined}
                          onClick={() => { if (isVerified) setViewingAgreement(ag); }}
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
                          <CheckCircle className="w-4 h-4 text-accent" />
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
              className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh]"
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

              {/* Document content — styled as PDF-like viewer */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl shadow-inner p-8 min-h-[300px]">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {viewingAgreement.content}
                  </pre>
                </div>
              </div>

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
              <div className="p-5 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                {viewingAgreement.is_signed ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Signed on {viewingAgreement.signed_at ? new Date(viewingAgreement.signed_at).toLocaleDateString() : "—"}</span>
                      {signature && <img src={signature} alt="sig" className="h-8 ml-4 opacity-80 object-contain" />}
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => handlePrintAgreement(viewingAgreement)}>
                      <Printer className="w-3.5 h-3.5" /> Print / Download
                    </Button>
                  </div>
                ) : viewingAgreement.status === "rejected" ? (
                  <div className="text-destructive text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>Rejected{viewingAgreement.rejection_reason ? `: ${viewingAgreement.rejection_reason}`: ""}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    {signature && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span>Your signature:</span>
                        <img src={signature} alt="sig" className="h-7 object-contain opacity-70" />
                      </div>
                    )}
                    {!showRejectInput && (
                      <>
                        <Button
                          onClick={() => handleSign(viewingAgreement.id)}
                          disabled={signing || !isVerified}
                          title={!isVerified ? "Complete verification first" : undefined}
                          className="gap-1.5"
                        >
                          {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pen className="w-4 h-4" />}
                          Sign Agreement
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setShowRejectInput(true)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => { setViewingAgreement(null); setShowRejectInput(false); setRejectReason(""); }}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
    <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
  </div>
);

export default UserDashboard;
