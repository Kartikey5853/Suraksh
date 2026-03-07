import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldX, Clock, CheckCircle, AlertCircle, Loader2, User,
  Upload, FileImage, Camera, ChevronRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserLayout from "@/components/UserLayout";
import { verificationApi, getStoredUser } from "@/lib/api";

// ── Inline verification component when user is not yet verified ──────────────

const InlineVerify = ({ onSubmitted }: { onSubmitted: (result: any) => void }) => {
  const [step, setStep] = useState<"aadhaar" | "face" | "done">("aadhaar");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);
  const faceRef = useRef<HTMLInputElement>(null);

  const handleAadhaarNext = async () => {
    if (!aadhaarFile) return;
    setLoading(true); setError("");
    try {
      const res = await verificationApi.verifyAadhaar(aadhaarFile);
      setScanResult(res.data);
      setStep("face");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to upload Aadhaar. Please try a clearer image.");
    }
    setLoading(false);
  };

  const handleFaceSubmit = async () => {
    if (!faceFile) return;
    setLoading(true); setError("");
    try {
      await verificationApi.submitFacePhoto(faceFile);
      setStep("done");
      onSubmitted(scanResult);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to upload face photo. Please try again.");
    }
    setLoading(false);
  };

  const skipFace = () => {
    setStep("done");
    onSubmitted(scanResult);
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex items-center gap-1 font-medium ${
          step === "aadhaar" ? "text-primary" : "text-accent"
        }`}>
          {step !== "aadhaar" ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">1</span>}
          Aadhaar Upload
        </span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className={`flex items-center gap-1 font-medium ${
          step === "face" ? "text-primary" : step === "done" ? "text-accent" : "text-muted-foreground"
        }`}>
          {step === "done" ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold">2</span>}
          Face Photo
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === "aadhaar" && (
          <motion.div key="aadhaar" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            <p className="text-sm text-foreground font-medium">Step 1 — Upload Aadhaar Card</p>
            <p className="text-xs text-muted-foreground">Upload a clear photo or scan of your Aadhaar card. Gemini AI will scan it to extract your Aadhaar number automatically.</p>
            <input ref={aadhaarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAadhaarFile(e.target.files[0]); }} />
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => aadhaarRef.current?.click()}
            >
              {aadhaarFile ? (
                <><FileImage className="w-8 h-8 mx-auto mb-2 text-primary" /><p className="text-sm font-medium text-foreground">{aadhaarFile.name}</p><p className="text-xs text-muted-foreground">Click to change</p></>
              ) : (
                <><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Click to upload Aadhaar card image</p><p className="text-xs text-muted-foreground/60 mt-1">PNG or JPG recommended</p></>
              )}
            </div>
            {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
            <Button onClick={handleAadhaarNext} disabled={!aadhaarFile || loading} className="w-full gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning with Gemini AI…</> : <><ShieldCheck className="w-4 h-4" />Scan &amp; Continue</>}
            </Button>
          </motion.div>
        )}

        {step === "face" && (
          <motion.div key="face" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {scanResult && (
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-accent">Aadhaar Scanned Successfully</p>
                  <p className="text-xs text-muted-foreground">
                    Aadhaar: XXXX XXXX {scanResult.scanned_last4 || "***"} &nbsp;&middot;&nbsp;
                    {scanResult.scan_score != null && (
                      <span className={`font-semibold ${
                        scanResult.scan_score >= 80 ? "text-emerald-600" :
                        scanResult.scan_score >= 50 ? "text-amber-600" : "text-red-600"
                      }`}>
                        <Star className="w-3 h-3 inline mr-0.5" />{scanResult.scan_score}% accuracy
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            <p className="text-sm text-foreground font-medium">Step 2 — Face Photo</p>
            <p className="text-xs text-muted-foreground">Take a selfie or upload a clear photo of your face to complete identity verification. This helps match your face with your Aadhaar.</p>
            <input ref={faceRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFaceFile(e.target.files[0]); }} />
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => faceRef.current?.click()}
            >
              {faceFile ? (
                <><Camera className="w-8 h-8 mx-auto mb-2 text-primary" /><p className="text-sm font-medium text-foreground">{faceFile.name}</p><p className="text-xs text-muted-foreground">Click to retake</p></>
              ) : (
                <><Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Take selfie or upload face photo</p><p className="text-xs text-muted-foreground/60 mt-1">On mobile, this will open your camera</p></>
              )}
            </div>
            {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleFaceSubmit} disabled={!faceFile || loading} className="flex-1 gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Camera className="w-4 h-4" />Submit &amp; Complete</>}
              </Button>
              <Button variant="outline" onClick={skipFace} className="text-xs px-3">Skip for now</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────

const UserVerificationStatus = () => {
  const user = getStoredUser();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    verificationApi.getStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  const handleVerified = (scanResult: any) => {
    setJustSubmitted(true);
    setStatus((prev: any) => ({
      ...(prev || {}),
      aadhaar_submitted: true,
      scanned_last4: scanResult?.scanned_last4,
      scan_score: scanResult?.scan_score,
    }));
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center gap-2 text-muted-foreground p-8"><Loader2 className="w-5 h-5 animate-spin" />Loading verification status…</div>
      </UserLayout>
    );
  }

  const isVerified = status?.is_verified;
  const hasSubmitted = status?.aadhaar_submitted || justSubmitted;

  return (
    <UserLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">My Verification</h1>

        {/* Status Card */}
        <div className={`rounded-2xl border p-6 mb-6 flex items-start gap-4 ${
          isVerified
            ? "bg-accent/5 border-accent/30"
            : hasSubmitted
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
            : "bg-muted/40 border-border"
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isVerified ? "bg-accent/20" : hasSubmitted ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
          }`}>
            {isVerified
              ? <ShieldCheck className="w-6 h-6 text-accent" />
              : hasSubmitted
              ? <Clock className="w-6 h-6 text-amber-600" />
              : <ShieldX className="w-6 h-6 text-muted-foreground" />
            }
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {isVerified ? "Identity Verified" : hasSubmitted ? "Verification Pending" : "Not Verified"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isVerified
                ? "Your Aadhaar-based KYC verification has been approved."
                : hasSubmitted
                ? "Your Aadhaar document has been submitted and is awaiting admin review."
                : "Complete Aadhaar KYC to unlock full platform features."}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isVerified ? "bg-accent/20 text-accent" : hasSubmitted ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-muted text-muted-foreground"
          }`}>
            {isVerified ? "Verified" : hasSubmitted ? "Under Review" : "Unverified"}
          </span>
        </div>

        {/* Verification Details */}
        {(hasSubmitted || isVerified) && status && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
            <h3 className="font-display font-semibold text-foreground">Verification Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Verification Type</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Aadhaar KYC</span>
                </div>
              </div>
              {(status.aadhaar_last4 || status.scanned_last4) && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Aadhaar (last 4)</p>
                  <p className="text-foreground font-mono">XXXX XXXX {status.aadhaar_last4 || status.scanned_last4}</p>
                </div>
              )}
              {(status.scan_score != null) && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">AI Scan Accuracy</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5" />
                    <span className={`font-semibold ${
                      status.scan_score >= 80 ? "text-emerald-600" :
                      status.scan_score >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>{status.scan_score}%</span>
                  </div>
                </div>
              )}
              {status.verified_at && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Verified On</p>
                  <p className="text-foreground">{new Date(status.verified_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">Status</p>
                <div className="flex items-center gap-1.5">
                  {isVerified
                    ? <CheckCircle className="w-4 h-4 text-accent" />
                    : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  <span className={isVerified ? "text-accent font-medium" : "text-amber-600 font-medium"}>
                    {isVerified ? "Approved" : "Pending Review"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
          <h3 className="font-display font-semibold text-foreground">Account Information</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name || "—"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || "user"}</p>
            </div>
          </div>
        </div>

        {/* Inline Verify Form (when not submitted) */}
        {!hasSubmitted && !isVerified && (
          <InlineVerify onSubmitted={handleVerified} />
        )}

        {/* Pending note */}
        {hasSubmitted && !isVerified && (
          <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10 p-5">
            <p className="text-sm text-foreground">
              Your submission is being reviewed by an admin. You'll be notified once approved.
            </p>
          </div>
        )}
      </motion.div>
    </UserLayout>
  );
};

export default UserVerificationStatus;
