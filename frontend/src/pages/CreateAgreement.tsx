import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus, Eye, Send, Loader2, CheckCircle, Sparkles, Scale,
  FileSearch, AlertCircle, ChevronRight, X, User, BookOpen, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import { agreementApi, adminApi } from "@/lib/api";

const DOC_TYPES = [
  "Offer Letter", "Employment Contract", "NDA", "Service Agreement",
  "Partnership Agreement", "Consulting Agreement", "Investment Agreement",
  "SAFE Agreement", "SHA", "Board Resolution", "Term Sheet", "Other",
];
const DOC_CATEGORIES = [
  "HR & Employment", "Legal Agreements", "Venture Capital", "Governance", "Compliance & KYC",
];

type Destination = "draft" | "user" | "lawyer";
type RightTab = "content" | "preview" | "keypoints" | "analysis";

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <motion.div className={`h-2 rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
};

const TEMPLATE_TYPES = ["Investment Agreement", "SAFE Agreement", "SHA", "Term Sheet", "NDA", "Board Resolution"];

const CreateAgreement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", doc_type: "NDA", doc_category: "Legal Agreements" });
  const [content, setContent] = useState(
    `AGREEMENT\n\nThis Agreement is entered into as of [DATE] between Suraksh Technologies ("Company") and [PARTY NAME] ("Party").\n\n1. SCOPE:\n[Describe the scope here.]\n\n2. TERMS:\n[Describe the terms here.]\n\n3. SIGNATURES:\nBoth parties agree to the terms outlined herein.\n\nCompany: ___________________\n\nParty: ___________________`
  );
  const [destination, setDestination] = useState<Destination>("draft");
  const [sentTo, setSentTo] = useState("");
  const [lawyerId, setLawyerId] = useState("");
  const [keyPoints, setKeyPoints] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [rightTab, setRightTab] = useState<RightTab>("preview");
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => { adminApi.getUsers().then((r) => setUsers(r.data)).catch(() => {}); }, []);

  const lawyers = users.filter((u) => u.role === "lawyer");
  const normalUsers = users.filter((u) => !["admin", "lawyer"].includes(u.role));
  const handleChange = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleLoadTemplate = async () => {
    setLoadingTemplate(true); setAiError("");
    try {
      const res = await agreementApi.getTemplate(form.doc_type, form.doc_category);
      setContent(res.data.content);
      setRightTab("content");
    } catch { setAiError("Failed to load template."); }
    setLoadingTemplate(false);
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) { setAiError("Enter a prompt first."); return; }
    setGenerating(true); setAiError("");
    try {
      const res = await agreementApi.generate({ prompt: aiPrompt, doc_type: form.doc_type, doc_category: form.doc_category, title: form.title || undefined });
      setContent(res.data.content);
      setKeyPoints(res.data.key_points);
      setRightTab("preview");
    } catch (e: any) { setAiError(e?.response?.data?.detail || "AI generation failed — check GEMINI_API_KEY in backend .env"); }
    setGenerating(false);
  };

  const handleSaveAndFinalize = async () => {
    if (!form.title) { setErrorMsg("Title is required."); return; }
    if (!content.trim()) { setErrorMsg("Content is required."); return; }
    if (destination === "user" && !sentTo) { setErrorMsg("Select a user to send to."); return; }
    if (destination === "lawyer" && !lawyerId) { setErrorMsg("Select a lawyer."); return; }
    setFinalizing(true); setErrorMsg(""); setAiError("");
    try {
      // Step 1: Save the agreement
      const saved = await agreementApi.create({
        title: form.title, content, doc_type: form.doc_type, doc_category: form.doc_category,
        sent_to: destination === "user" ? sentTo : undefined,
        send_to_lawyer: destination === "lawyer" ? lawyerId : undefined,
        key_points: keyPoints ? JSON.stringify(keyPoints) : undefined,
      });
      const agId = saved.data.id;
      setSavedId(agId);
      // Step 2: Run AI analysis and store
      const fin = await agreementApi.finalize(agId);
      setAnalysis(fin.data.analysis);
      setRightTab("analysis");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? "Failed to save & finalize.");
      setSaveStatus("error");
    }
    setFinalizing(false);
  };

  const handleSave = async () => {
    if (!form.title) { setErrorMsg("Title is required."); return; }
    if (!content.trim()) { setErrorMsg("Content is required."); return; }
    if (destination === "user" && !sentTo) { setErrorMsg("Select a user to send to."); return; }
    if (destination === "lawyer" && !lawyerId) { setErrorMsg("Select a lawyer."); return; }
    setSaveStatus("saving"); setErrorMsg("");
    try {
      const saved = await agreementApi.create({
        title: form.title, content, doc_type: form.doc_type, doc_category: form.doc_category,
        sent_to: destination === "user" ? sentTo : undefined,
        send_to_lawyer: destination === "lawyer" ? lawyerId : undefined,
        key_points: keyPoints ? JSON.stringify(keyPoints) : undefined,
      });
      setSavedId(saved.data.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) { setErrorMsg(err.response?.data?.detail ?? "Failed to save."); setSaveStatus("error"); }
  };

  return (
    <AdminLayout>
      {/* ── AI Generation Loading Overlay ──────────────────────── */}
      <AnimatePresence>
        {generating && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-6 max-w-sm text-center px-8 py-10 rounded-2xl border border-primary/30 bg-card/90 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary"
                />
                <Sparkles className="w-7 h-7 text-primary absolute inset-0 m-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">Generating with Gemini AI</p>
                <p className="text-sm text-muted-foreground">Drafting your agreement and extracting key points…</p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 8, ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">This usually takes 5–15 seconds</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Create Agreement</h1>
        <div className="grid gap-6 xl:grid-cols-2">

          {/* ── LEFT PANEL ── */}
          <div className="space-y-4">
            {/* Details */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground">Agreement Details</h3>
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g. NDA for John Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Document Type</Label>
                  <select value={form.doc_type} onChange={(e) => handleChange("doc_type", e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select value={form.doc_category} onChange={(e) => handleChange("doc_category", e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    {DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Template Button */}
              <Button
                variant="outline" size="sm" onClick={handleLoadTemplate} disabled={loadingTemplate}
                className="w-full gap-2 border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50"
              >
                {loadingTemplate ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading template…</> : <><BookOpen className="w-3.5 h-3.5" />Load Pre-built Template for {form.doc_type}</>}
              </Button>
              {TEMPLATE_TYPES.includes(form.doc_type) && (
                <p className="text-xs text-primary/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pre-built VC template available for {form.doc_type}. Click above to load it, then edit manually or use AI to fill in.
                </p>
              )}
            </div>

            {/* AI Section */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Gemini AI Assistant</h3>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Describe your agreement — AI drafts the full text</Label>
                <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="mt-1 min-h-[80px] text-sm"
                  placeholder="e.g. A 6-month NDA between Suraksh Technologies and Rahul Sharma covering our mobile app project..." />
              </div>
              {aiError && <div className="flex items-center gap-2 text-destructive text-xs"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{aiError}</div>}
              <Button onClick={handleGenerate} disabled={generating || finalizing} size="sm" className="gap-2 w-full">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate with Gemini AI</>}
              </Button>
              <p className="text-xs text-muted-foreground">AI will draft the complete agreement text + extract key points automatically.</p>
            </div>

            {/* Pipeline Destination */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Send To</h3>
              <div className="flex gap-2">
                {(["draft", "user", "lawyer"] as Destination[]).map((d) => (
                  <button key={d} onClick={() => setDestination(d)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${destination === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {d === "draft" && "Save as Draft"}
                    {d === "user" && <span className="flex items-center justify-center gap-1"><User className="w-3 h-3" />Send to User</span>}
                    {d === "lawyer" && <span className="flex items-center justify-center gap-1"><Scale className="w-3 h-3" />Send to Lawyer</span>}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {destination === "user" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Label className="text-xs">Select User</Label>
                    <select value={sentTo} onChange={(e) => setSentTo(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">— Select a user —</option>
                      {(normalUsers.length > 0 ? normalUsers : users).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email}){u.role !== "user" ? ` — ${u.role}` : ""}</option>)}
                    </select>
                  </motion.div>
                )}
                {destination === "lawyer" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    <Label className="text-xs">Select Lawyer</Label>
                    <select value={lawyerId} onChange={(e) => setLawyerId(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">— Select a lawyer —</option>
                      {lawyers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                    {lawyers.length === 0 && <p className="text-xs text-amber-600">No lawyers found. Register an admin account with role "lawyer" first.</p>}
                    <p className="text-xs text-muted-foreground">Lawyer reviews → approves → you send to user for signing.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                {destination === "user" ? "Sent to user for signing!" : destination === "lawyer" ? "Sent to lawyer for review!" : "Saved as draft."}
                {analysis && " · AI analysis stored."}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveStatus === "saving" || finalizing} className="flex-1 gap-2" variant="outline">
                {saveStatus === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> :
                 destination === "user" ? <><Send className="w-4 h-4" />Send to User</> :
                 destination === "lawyer" ? <><Scale className="w-4 h-4" />Send to Lawyer</> :
                 <><FilePlus className="w-4 h-4" />Save as Draft</>}
              </Button>
              <Button onClick={handleSaveAndFinalize} disabled={saveStatus === "saving" || finalizing} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                {finalizing ? <><Loader2 className="w-4 h-4 animate-spin" />Finalizing…</> : <><Zap className="w-4 h-4" />Save &amp; Finalize</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Save</strong> – saves the agreement as-is. &nbsp;
              <strong>Save &amp; Finalize</strong> – saves + runs AI gap analysis &amp; stores the report.
            </p>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[600px]">
            <div className="flex border-b border-border bg-muted/30">
              {(["content", "preview", "keypoints", "analysis"] as RightTab[]).map((t) => (
                <button key={t} onClick={() => setRightTab(t)} className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${rightTab === t ? "text-primary bg-card" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "keypoints" ? "Key Points" : t === "analysis" ? (<>Analysis{analysis && <span className={`ml-1 font-bold ${analysis.score >= 80 ? "text-emerald-500" : analysis.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{analysis.score}</span>}</>) : t.charAt(0).toUpperCase() + t.slice(1)}
                  {rightTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {rightTab === "content" && (
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[500px] font-mono text-sm resize-none border-0 p-0 focus-visible:ring-0" placeholder="Write or generate agreement content..." />
              )}

              {rightTab === "preview" && (
                <div className="bg-white rounded-lg p-6 min-h-[500px] shadow-inner">
                  {form.title && <h2 className="text-center font-bold text-gray-900 text-base mb-2 uppercase tracking-wide">{form.title}</h2>}
                  <div className="flex gap-2 text-xs text-gray-400 mb-4 justify-center"><span>{form.doc_type}</span><span>·</span><span>{form.doc_category}</span></div>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
                </div>
              )}

              {rightTab === "keypoints" && (
                keyPoints ? (
                  <div className="space-y-4 text-sm">
                    {keyPoints.summary && <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p><p className="text-foreground/80 leading-relaxed">{keyPoints.summary}</p></div>}
                    {keyPoints.parties?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parties</p><ul className="space-y-1">{keyPoints.parties.map((p: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{p}</li>)}</ul></div>}
                    {keyPoints.key_terms?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Terms</p><ul className="space-y-1">{keyPoints.key_terms.map((t: string, i: number) => <li key={i} className="flex items-start gap-2 text-xs"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{t}</li>)}</ul></div>}
                    {keyPoints.financial_terms && Object.values(keyPoints.financial_terms).some(Boolean) && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-xs font-semibold text-primary uppercase mb-2">Financial Terms</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {keyPoints.financial_terms.valuation && <><span className="text-muted-foreground">Valuation</span><span className="font-mono">{keyPoints.financial_terms.valuation}</span></>}
                          {keyPoints.financial_terms.investment_amount && <><span className="text-muted-foreground">Investment</span><span className="font-mono">{keyPoints.financial_terms.investment_amount}</span></>}
                          {keyPoints.financial_terms.equity_percentage && <><span className="text-muted-foreground">Equity</span><span className="font-mono">{keyPoints.financial_terms.equity_percentage}</span></>}
                          {keyPoints.financial_terms.payment_terms && <><span className="text-muted-foreground">Payment</span><span className="font-mono">{keyPoints.financial_terms.payment_terms}</span></>}
                        </div>
                      </div>
                    )}
                    {keyPoints.duration && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Duration: </span>{keyPoints.duration}</p>}
                    {keyPoints.governing_law && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Governing Law: </span>{keyPoints.governing_law}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 gap-3 text-center">
                    <Sparkles className="w-10 h-10 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">Click <strong>"Generate with Gemini AI"</strong> to auto-populate key points.</p>
                  </div>
                )
              )}

              {rightTab === "analysis" && (
                analysis ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                      <div className={`text-4xl font-bold ${analysis.score >= 80 ? "text-emerald-500" : analysis.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{analysis.score}</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Quality Score (Company View)</p>
                        <ScoreBar score={analysis.score} />
                        <p className="text-xs text-muted-foreground mt-1.5">{analysis.summary}</p>
                      </div>
                    </div>
                    {analysis.strengths?.length > 0 && <div><p className="text-xs font-semibold text-emerald-600 uppercase mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Strengths</p><ul className="space-y-1.5">{analysis.strengths.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{s}</li>)}</ul></div>}
                    {analysis.gaps?.length > 0 && <div><p className="text-xs font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Gaps Found</p><ul className="space-y-1.5">{analysis.gaps.map((g: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-amber-500 mt-0.5">⚠</span>{g}</li>)}</ul></div>}
                    {analysis.risks?.length > 0 && <div><p className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1"><X className="w-3.5 h-3.5" />Risks</p><ul className="space-y-1.5">{analysis.risks.map((r: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-red-500 mt-0.5">✗</span>{r}</li>)}</ul></div>}
                    {analysis.suggestions?.length > 0 && <div><p className="text-xs font-semibold text-primary uppercase mb-2 flex items-center gap-1"><FileSearch className="w-3.5 h-3.5" />Suggestions</p><ul className="space-y-1.5">{analysis.suggestions.map((s: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />{s}</li>)}</ul></div>}
                    <p className="text-xs text-muted-foreground italic">Analysis stored in the agreement record. Company perspective.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 gap-3 text-center">
                    <Zap className="w-10 h-10 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">Click <strong>"Save &amp; Finalize"</strong> to run AI quality analysis and store the report with the agreement.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default CreateAgreement;
