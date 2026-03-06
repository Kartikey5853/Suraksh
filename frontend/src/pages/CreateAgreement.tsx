import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FilePlus, Eye, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import { agreementApi, adminApi } from "@/lib/api";

const DOC_TYPES = [
  "Offer Letter", "Employment Contract", "NDA", "Service Agreement",
  "Partnership Agreement", "Consulting Agreement", "Investment Agreement",
  "SAFE Agreement", "SHA", "Board Resolution", "Term Sheet", "Other"
];

const DOC_CATEGORIES = [
  "HR & Employment", "Legal Agreements", "Venture Capital", "Governance", "Compliance & KYC"
];

const CreateAgreement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    doc_type: "NDA",
    doc_category: "Legal Agreements",
    sent_to: "",
    content: `AGREEMENT\n\nThis Agreement is entered into as of [DATE] between Suraksh Technologies ("Company") and [PARTY NAME] ("Party").\n\n1. SCOPE:\n[Describe the scope here.]\n\n2. TERMS:\n[Describe the terms here.]\n\n3. SIGNATURES:\nBoth parties agree to the terms outlined herein.\n\nCompany: ___________________\n\nParty: ___________________`,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    adminApi.getUsers().then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title || !form.content) { setErrorMsg("Title and content are required."); return; }
    setStatus("saving");
    setErrorMsg("");
    try {
      await agreementApi.create({
        title: form.title,
        content: form.content,
        doc_type: form.doc_type,
        doc_category: form.doc_category,
        sent_to: form.sent_to || undefined,
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? "Failed to save agreement.");
      setStatus("error");
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Create Agreement</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — form */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display font-semibold text-foreground">Agreement Details</h3>

              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g. NDA for John Doe" className="mt-1" />
              </div>

              <div>
                <Label>Document Type *</Label>
                <select
                  value={form.doc_type}
                  onChange={(e) => handleChange("doc_type", e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <Label>Category</Label>
                <select
                  value={form.doc_category}
                  onChange={(e) => handleChange("doc_category", e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label>Send To User (optional)</Label>
                <select
                  value={form.sent_to}
                  onChange={(e) => handleChange("sent_to", e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">— Save as draft (don't send yet) —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.sent_to ? "Agreement will be sent immediately on save." : "You can send it later from the Agreements page."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-3">Agreement Content *</h3>
              <Textarea
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                className="min-h-[250px] font-mono text-sm"
                placeholder="Write the full agreement text here..."
              />
            </div>

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            {status === "saved" && (
              <div className="flex items-center gap-2 text-accent text-sm">
                <CheckCircle className="w-4 h-4" />
                {form.sent_to ? "Agreement saved and sent to user!" : "Agreement saved as draft."}
              </div>
            )}

            <Button onClick={handleSave} disabled={status === "saving"} className="w-full gap-2">
              {status === "saving" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : form.sent_to ? (
                <><Send className="w-4 h-4" /> Save & Send to User</>
              ) : (
                <><FilePlus className="w-4 h-4" /> Save as Draft</>
              )}
            </Button>
          </div>

          {/* Right — preview */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Preview</h3>
              {form.title && <span className="text-xs text-muted-foreground ml-auto">{form.doc_type} · {form.doc_category}</span>}
            </div>
            <div className="bg-white rounded-lg p-6 min-h-[400px] shadow-inner">
              {form.title && (
                <h2 className="text-center font-bold text-gray-900 text-base mb-4 uppercase tracking-wide">{form.title}</h2>
              )}
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{form.content}</pre>
              {form.sent_to && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Will be sent to: {users.find((u) => u.id === form.sent_to)?.name ?? form.sent_to}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default CreateAgreement;
