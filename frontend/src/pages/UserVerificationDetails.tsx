import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle, Clock, XCircle, CreditCard, Camera,
  ArrowLeft, ShieldCheck, Star, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { verificationApi } from "@/lib/api";

interface VerificationDetails {
  found: boolean;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  aadhaar_last4?: string;
  is_valid?: boolean;
  scan_score?: number | null;
  face_submitted?: boolean;
  verified_at?: string | null;
  created_at?: string | null;
  has_id_card?: boolean;
  has_face?: boolean;
}

const ScoreBadge = ({ score }: { score: number | null | undefined }) => {
  if (score == null) return <span className="text-muted-foreground text-sm">Not scanned</span>;
  const color = score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex items-center gap-1.5">
      <Star className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{score}/100</span>
    </div>
  );
};

const AuthImage = ({ url, label }: { url: string; label: string }) => {
  const token = localStorage.getItem("token");
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.blob();
      })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setError(true));
  }, [url, token]);

  if (error) return (
    <div className="w-full h-48 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
      <AlertTriangle className="w-6 h-6" />
      Image not available
    </div>
  );
  if (!src) return (
    <div className="w-full h-48 rounded-xl bg-muted/20 border border-border animate-pulse" />
  );
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <img
        src={src}
        alt={label}
        className="w-full rounded-xl border border-border object-contain max-h-64 bg-black"
      />
    </div>
  );
};

const UserVerificationDetails = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState<VerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificationApi.getMyDetails()
      .then((r) => setDetails(r.data))
      .catch(() => setDetails({ found: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold font-display">My Verification</h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : !details?.found ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <XCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">No verification submitted yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                You haven't submitted your identity documents yet.
              </p>
              <Button onClick={() => navigate("/user/identity-verification")}>
                Start Verification
              </Button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                details.is_valid
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-yellow-500/30 bg-yellow-500/10"
              }`}>
                {details.is_valid
                  ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  : <Clock className="w-5 h-5 text-yellow-400 shrink-0" />}
                <div>
                  <p className={`font-semibold text-sm ${details.is_valid ? "text-green-400" : "text-yellow-400"}`}>
                    {details.is_valid ? "Verification Approved" : "Pending Admin Review"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {details.is_valid
                      ? `Approved on ${details.verified_at ? new Date(details.verified_at).toLocaleDateString() : "—"}`
                      : "Your documents are under review by our team."}
                  </p>
                </div>
              </div>

              {/* Details card */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="text-sm font-medium text-foreground">{details.user_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-foreground">{details.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Aadhaar Last 4</p>
                    <p className="text-sm font-medium text-foreground tracking-widest">
                      XXXX XXXX {details.aadhaar_last4}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="text-sm font-medium text-foreground">
                      {details.created_at ? new Date(details.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">AI Scan Score</p>
                    <ScoreBadge score={details.scan_score} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Face Photo</p>
                    <div className="flex items-center gap-1.5">
                      <Camera className={`w-4 h-4 ${details.face_submitted ? "text-green-400" : "text-muted-foreground"}`} />
                      <span className={`text-sm ${details.face_submitted ? "text-green-400" : "text-muted-foreground"}`}>
                        {details.face_submitted ? "Submitted" : "Not submitted"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Submitted Documents</h2>
                </div>
                {details.has_id_card ? (
                  <AuthImage url={verificationApi.idImageUrl()} label="ID Card (Aadhaar)" />
                ) : (
                  <div className="w-full h-32 rounded-xl bg-muted/20 border border-border flex items-center justify-center text-sm text-muted-foreground">
                    <CreditCard className="w-5 h-5 mr-2" /> No ID card image
                  </div>
                )}
                {details.has_face ? (
                  <AuthImage url={verificationApi.faceImageUrl()} label="Face Photo" />
                ) : (
                  <div className="w-full h-32 rounded-xl bg-muted/20 border border-border flex items-center justify-center text-sm text-muted-foreground">
                    <Camera className="w-5 h-5 mr-2" /> No face photo
                  </div>
                )}
              </div>

              {!details.is_valid && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/user/identity-verification")}
                >
                  Re-submit documents
                </Button>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserVerificationDetails;
