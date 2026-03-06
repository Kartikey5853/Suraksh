import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Loader2, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { adminApi, agreementApi } from "@/lib/api";

const AdminDocuments = () => {
  const [docTab, setDocTab] = useState<"agreements" | "documents">("agreements");
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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

  const filteredAgreements = agreements.filter((a) =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.doc_type?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDocuments = documents.filter((d) =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.doc_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Document Management</h1>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">Refresh</Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDocTab("agreements")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "agreements" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Agreements ({agreements.length})
            </button>
            <button
              onClick={() => setDocTab("documents")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${docTab === "documents" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Documents ({documents.length})
            </button>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgreements.map((ag) => (
                    <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />{ag.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ag.doc_type}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ag.sent_to ? ag.sent_to.slice(0, 8) + "…" : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          ag.status === "signed" ? "bg-accent/20 text-accent" :
                          ag.status === "sent" ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>{ag.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ag.created_at ? new Date(ag.created_at).toLocaleDateString() : "—"}</td>
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
                          <span className={`text-xs capitalize ${doc.is_signed ? "text-accent" : "text-muted-foreground"}`}>{doc.is_signed ? "Signed" : doc.status}</span>
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
    </AdminLayout>
  );
};

export default AdminDocuments;
