import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

const OTPVerification = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP as soon as component mounts
  useEffect(() => {
    const send = async () => {
      try {
        await authApi.sendOtp();
        setSent(true);
      } catch {
        setError("Failed to send OTP. Please try again.");
      }
    };
    send();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyOtp(code);
      navigate("/user/identity-verification");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSent(false);
    try {
      await authApi.sendOtp();
      setSent(true);
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-suraksh-ice p-8">
      <motion.div
        className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl border border-border bg-muted flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-7 h-7">
              <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
              <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">Verify Your Identity</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {sent ? "Enter the 6-digit code sent to your registered email" : "Sending OTP to your email…"}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        <div className="flex justify-center gap-3 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-display font-bold rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-all"
            />
          ))}
        </div>

        <Button onClick={handleVerify} className="w-full mb-4" disabled={loading || !sent}>
          {loading ? "Verifying…" : "Verify"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to home</button>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;

