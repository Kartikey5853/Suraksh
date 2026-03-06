import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Pen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api";

const SignatureSetup = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(220, 25%, 10%)";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let imageData: string;
      if (mode === "draw") {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("No canvas");
        imageData = canvas.toDataURL("image/png");
      } else {
        if (!uploadedFile) throw new Error("No file selected");
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }
      await userApi.saveSignature(imageData);
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to save signature. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-suraksh-ice flex items-center justify-center p-8">
      <motion.div
        className="w-full max-w-lg bg-card rounded-2xl border border-border p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">Signature Setup</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Configure your digital signature</p>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("draw")}
            className="flex-1 gap-2"
          >
            <Pen className="w-4 h-4" /> Draw
          </Button>
          <Button
            variant={mode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("upload")}
            className="flex-1 gap-2"
          >
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>

        {mode === "draw" ? (
          <div className="mb-6">
            <canvas
              ref={canvasRef}
              width={440}
              height={180}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              className="w-full h-44 border-2 border-dashed border-border rounded-xl cursor-crosshair bg-background"
            />
            <button onClick={clearCanvas} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
            />
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 mb-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploadedFile ? uploadedFile.name : "Upload signature image"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">PNG with transparent background</p>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? "Saving…" : "Save Signature & Continue"}
        </Button>
      </motion.div>
    </div>
  );
};

export default SignatureSetup;

