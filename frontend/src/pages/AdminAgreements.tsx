import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Loader2, X, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { agreementApi } from "@/lib/api";

const AdminAgreements = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "sent" | "signed" | "draft">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await agreementApi.getAll();
      setAgreements(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = agreements.filter((a) => filter === "all" || a.status === filter);
  const counts = {
    all: agreements.length,
    draft: agreements.filter((a) => a.status === "draft").length,
    sent: agreements.filter((a) => a.status === "sent").length,
    signed: agreements.filter((a) => a.status === "signed").length,
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Agreements</h1>
            <p className="text-sm text-muted-foreground">All agreements created and sent to users</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="text-xs">Refresh</Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "draft", "sent", "signed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sent To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((ag) => (
                    <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{ag.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ag.doc_type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : <span className="text-xs italic">Not sent</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          ag.status === "signed" ? "bg-accent/20 text-accent" :
                          ag.status === "sent" ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>{ag.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewing(ag)}>
                          View
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

      {/* Agreement Viewer Modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setViewing(null)} />
            <motion.div
              className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh]"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{viewing.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{viewing.doc_type} · {viewing.doc_category}</p>
                </div>
                <button onClick={() => setViewing(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl shadow-inner p-8">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{viewing.content}</pre>
                </div>
              </div>

              <div className="p-5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {viewing.is_signed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-sm text-accent">Signed {viewing.signed_at ? new Date(viewing.signed_at).toLocaleDateString() : ""}</span>
                      {viewing.signature_snapshot && (
                        <img src={viewing.signature_snapshot} alt="sig" className="h-8 ml-4 object-contain opacity-80" />
                      )}
                    </>
                  ) : viewing.status === "sent" ? (
                    <>
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Awaiting user signature</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize">Status: {viewing.status}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewing(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminAgreements;
