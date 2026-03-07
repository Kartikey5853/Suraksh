import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, CheckCircle, Clock, Loader2, ScrollText, X, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import AdminLayout from "@/components/AdminLayout";
import { adminApi, agreementApi } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";

const ROLES = ["founder", "associate", "lawyer", "admin"] as const;
type Role = typeof ROLES[number];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<"overview" | "users" | "doc-requests">(() =>
    location.pathname === "/admin/users" ? "users" : "overview"
  );
  const [users, setUsers] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Send Agreement from Request modal
  const [sendingRequest, setSendingRequest] = useState<any | null>(null);
  const [agTitle, setAgTitle] = useState("");
  const [agContent, setAgContent] = useState("");
  const [sendingAg, setSendingAg] = useState(false);
  const [sendAgMsg, setSendAgMsg] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, agRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getDocumentRequests(),
        agreementApi.getAll(),
      ]);
      setUsers(uRes.data);
      setDocRequests(rRes.data);
      setAgreements(agRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      await adminApi.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  const handleToggleActive = async (userId: string) => {
    setUpdatingId(userId);
    try {
      const res = await adminApi.toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  const handleUpdateRequest = async (id: string, status: string) => {
    try {
      await adminApi.updateDocumentRequest(id, status);
      setDocRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } catch { /* ignore */ }
  };

  const handleSendAgreement = async () => {
    if (!sendingRequest || !agTitle.trim() || !agContent.trim()) return;
    setSendingAg(true);
    setSendAgMsg("");
    try {
      await adminApi.sendAgreementFromRequest(sendingRequest.id, agTitle, agContent);
      setSendAgMsg("Agreement sent successfully!");
      setDocRequests((prev) => prev.map((r) => r.id === sendingRequest.id ? { ...r, status: "approved" } : r));
      setTimeout(() => { setSendingRequest(null); setAgTitle(""); setAgContent(""); setSendAgMsg(""); }, 1500);
    } catch (err: any) {
      setSendAgMsg(err.response?.data?.detail ?? "Failed to send agreement.");
    }
    setSendingAg(false);
  };

  const pendingRequests = docRequests.filter((r) => r.status === "pending").length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const signedAgreements = agreements.filter((a) => a.is_signed);
  const pendingAgreements = agreements.filter((a) => a.status === "sent" && !a.is_signed);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">System overview and management</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["overview", "users", "doc-requests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Overview" : t === "users" ? "Users" : "Document Requests"}
            </button>
          ))}
        </div>

          {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bento-grid grid-cols-2 md:grid-cols-4 mb-8">
              <StatCard icon={Users} label="Total Users" value={String(users.length)} trend={`${activeUsers} active`} />
              <StatCard icon={FileText} label="Doc Requests" value={String(docRequests.length)} trend={`${pendingRequests} pending`} />
              <StatCard icon={CheckCircle} label="Onboarded" value={String(users.filter((u) => u.is_onboarded).length)} trend="verified" />
              <StatCard icon={ScrollText} label="Signed Agreements" value={String(signedAgreements.length)} trend={`${pendingAgreements.length} awaiting`} />
            </div>

            <div className="bento-grid lg:grid-cols-2">
              <div className="bento-card bg-card p-6">
                <GlowingEffect disabled={false} proximity={64} spread={40} />
                <div className="relative z-10">
                <h3 className="font-display font-semibold text-foreground mb-4">Users by Role</h3>
                {ROLES.map((role) => {
                  const count = users.filter((u) => u.role === role).length;
                  return (
                    <div key={role} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm capitalize text-foreground">{role}</span>
                      <span className="text-sm font-medium text-muted-foreground">{count} user{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
                </div>
              </div>

              <div className="bento-card bg-card p-6">
                <GlowingEffect disabled={false} proximity={64} spread={40} />
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Signed Agreements</h3>
                  <button onClick={() => navigate("/admin/agreements")} className="text-xs text-primary">View all</button>
                </div>
                {signedAgreements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signed agreements yet</p>
                ) : (
                  signedAgreements.slice(0, 5).map((ag) => (
                    <div key={ag.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{ag.title}</p>
                        <p className="text-xs text-muted-foreground">{ag.doc_type}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">{ag.signed_at ? new Date(ag.signed_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Users Tab ───────────────────────────── */}
        {tab === "users" && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <h3 className="font-display font-semibold text-foreground flex-1">All Users</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email…"
                    className="pl-8 h-8 text-xs w-52"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Onboarded</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users
                        .filter((u) => {
                          const q = userSearch.toLowerCase();
                          return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                        })
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">{u.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            {u.is_onboarded
                              ? <CheckCircle className="w-4 h-4 text-green-600" />
                              : <Clock className="w-4 h-4 text-muted-foreground" />
                            }
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              disabled={updatingId === u.id}
                              onClick={() => handleToggleActive(u.id)}
                            >
                              {updatingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Document Requests Tab ────────────────── */}
        {tab === "doc-requests" && (
          <motion.div key="doc-requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">All Document Requests</h3>
                <Button variant="outline" size="sm" className="text-xs" onClick={loadData}>Refresh</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Requested By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Document</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Notes / Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {docRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{r.user_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.user_email || ""}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{r.doc_type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.doc_category}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                          {r.notes ? (
                            <span className="italic text-xs">"{r.notes}"</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            r.status === "approved" ? "bg-green-500/20 text-green-400" :
                            r.status === "rejected" ? "bg-destructive/20 text-destructive" :
                            r.status === "in_review" ? "bg-primary/20 text-primary" :
                            "bg-muted text-muted-foreground"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              variant="ghost" size="sm" className="text-xs h-7"
                              onClick={() => handleUpdateRequest(r.id, "in_review")}
                              disabled={r.status === "in_review" || r.status === "approved"}
                            >
                              Review
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="text-xs h-7 text-destructive"
                              onClick={() => handleUpdateRequest(r.id, "rejected")}
                              disabled={r.status === "rejected" || r.status === "approved"}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="default" size="sm" className="text-xs h-7 gap-1"
                              onClick={() => {
                                setSendingRequest(r);
                                setAgTitle(`${r.doc_type} — ${r.user_name}`);
                                setAgContent(`This agreement is issued in response to a request from ${r.user_name} (${r.user_email}) for: ${r.doc_type}.\n\nCategory: ${r.doc_category}\n\nRequest details:\n${r.notes || "No additional notes provided."}\n\n---\n\n[Insert agreement content here]`);
                              }}
                              disabled={r.status === "approved"}
                            >
                              <Send className="w-3 h-3" /> Send for Signing
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Send Agreement Modal ─────────────────── */}
        <AnimatePresence>
          {sendingRequest && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => { setSendingRequest(null); setSendAgMsg(""); }} />
              <motion.div
                className="relative w-[85vw] max-w-[85vw] bg-card rounded-2xl border border-border shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Send Agreement for Signing</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Responding to request from <span className="font-medium text-foreground">{sendingRequest.user_name}</span> ({sendingRequest.user_email})
                    </p>
                  </div>
                  <button onClick={() => { setSendingRequest(null); setSendAgMsg(""); }}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4">
                  <p className="text-xs text-muted-foreground">Requested document</p>
                  <p className="text-sm font-medium">{sendingRequest.doc_type} · {sendingRequest.doc_category}</p>
                  {sendingRequest.notes && <p className="text-xs text-muted-foreground italic mt-1">"{sendingRequest.notes}"</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Agreement Title</Label>
                    <Input className="mt-1" value={agTitle} onChange={(e) => setAgTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Agreement Content</Label>
                    <Textarea className="mt-1 font-mono text-xs resize-none" rows={12} value={agContent} onChange={(e) => setAgContent(e.target.value)} />
                  </div>
                  {sendAgMsg && (
                    <p className={`text-sm ${sendAgMsg.includes("success") ? "text-green-600" : "text-destructive"}`}>{sendAgMsg}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 gap-1.5" disabled={sendingAg || !agTitle.trim() || !agContent.trim()} onClick={handleSendAgreement}>
                      {sendingAg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send to User for Signing
                    </Button>
                    <Button variant="outline" onClick={() => { setSendingRequest(null); setSendAgMsg(""); }}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend: string }) => (
  <div className="bento-card bg-card p-5">
    <GlowingEffect disabled={false} proximity={64} spread={40} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground italic">{trend}</span>
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  </div>
);

export default AdminDashboard;

