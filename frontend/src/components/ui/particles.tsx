import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [16, 185, 129];
};

const Particles = ({
  className,
  quantity = 60,
  color = "#10b981",
  size = 1.2,
  speed = 0.4,
  opacity = 0.5,
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = hexToRgb(color);

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      radius: number; alpha: number;
      alphaDelta: number;
    };

    const particles: Particle[] = Array.from({ length: quantity }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      radius: Math.random() * size + 0.4,
      alpha: Math.random() * opacity,
      alphaDelta: (Math.random() * 0.005 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDelta;
        if (p.alpha <= 0 || p.alpha >= opacity) p.alphaDelta *= -1;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0, Math.min(1, p.alpha))})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener("resize", handleResize);
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [quantity, color, size, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none", className)}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export { Particles };
