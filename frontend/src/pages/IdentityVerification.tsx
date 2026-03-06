import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle, Loader2, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verificationApi } from "@/lib/api";

const IdentityVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "processing" | "done" | "error">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bypassLoading, setBypassLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStep("processing");
    try {
      await verificationApi.verifyAadhaar(file);
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? "Aadhaar verification failed. Please try a clearer image.");
      setStep("error");
    }
  };

  const handleBypass = async () => {
    setBypassLoading(true);
    try {
      await verificationApi.bypassAadhaar();
      setStep("done");
    } catch (err: any) {
      setErrorMsg("Bypass failed. Please try again.");
      setStep("error");
    } finally {
      setBypassLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-suraksh-ice flex items-center justify-center p-8">
      <motion.div
        className="w-full max-w-lg bg-card rounded-2xl border border-border p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">Aadhaar Verification</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Upload your Aadhaar card to verify your identity</p>

        {step === "upload" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 mb-6 hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <>
                  <FileImage className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload your Aadhaar card image</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG or JPG, clear scan recommended</p>
                </>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!file} className="w-full mb-2">
              Verify Aadhaar
            </Button>
            <Button variant="outline" onClick={handleBypass} disabled={bypassLoading} className="w-full">
              {bypassLoading ? "Bypassing…" : "Bypass Aadhaar Verification (Testing)"}
            </Button>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-foreground font-medium">Verifying Aadhaar…</p>
            <p className="text-sm text-muted-foreground mt-1">Running OCR and checksum validation</p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-accent" />
            <p className="text-foreground font-medium">Aadhaar Verified!</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Your identity has been successfully verified</p>
            <Button onClick={() => navigate("/user/signature")} className="w-full">
              Continue to Signature Setup
            </Button>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <p className="text-destructive font-medium mb-2">Verification Failed</p>
            <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
            <Button variant="outline" onClick={() => setStep("upload")} className="w-full">
              Try Again
            </Button>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to home</button>
        </div>
      </motion.div>
    </div>
  );
};

export default IdentityVerification;

