import React, { ReactNode, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Clock, ShieldCheck, UserCircle, LogOut
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
  { label: "Pending Agreements", icon: Clock, path: "/user/pending" },
  { label: "My Verification", icon: ShieldCheck, path: "/user/verification-status" },
  { label: "Profile", icon: UserCircle, path: "/user/profile" },
];

/* ── Tiny canvas-based twinkling stars ── */
function StarsCanvas({ color = "#10b981" }: { color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf: number;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.6 + 0.2,
      o: Math.random() * Math.PI * 2,
    }));
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      stars.forEach((s) => {
        const a = 0.3 + 0.7 * ((Math.sin(t * 0.001 * s.s + s.o) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = a;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [color]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

const UserLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  /* Click sparkle / ripple (green) */
  useEffect(() => {
    const handleRipple = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("button") as HTMLElement | null;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const span = document.createElement("span");
      span.style.cssText = `position:absolute;border-radius:50%;background:rgba(16,185,129,0.3);pointer-events:none;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;transform:scale(0);animation:ripple-burst 0.55s ease-out forwards;`;
      const prev = btn.style.position;
      if (!prev || prev === "static") btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(span);
      span.addEventListener("animationend", () => span.remove(), { once: true });
    };
    document.addEventListener("click", handleRipple);
    return () => document.removeEventListener("click", handleRipple);
  }, []);

  return (
    <div className="user-theme min-h-screen flex bg-background relative overflow-hidden">
      {/* Stars background (green) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarsCanvas color="#10b981" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
      </div>

      <aside className="w-[260px] border-r border-border bg-sidebar/90 backdrop-blur-sm flex flex-col shrink-0 relative z-10">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <span style={{ fontFamily: "'Samarkan', serif", fontSize: "1.4rem", letterSpacing: "0.05em", color: "hsl(var(--sidebar-primary))" }}>Suraksh</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-[0_0_14px_rgba(16,185,129,0.35)]"
                    : "text-sidebar-foreground/70 hover:bg-green-100/80 hover:text-green-700 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-green-100/80 hover:text-green-700 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-200"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 relative z-10">{children}</main>
    </div>
  );
};

export default UserLayout;
