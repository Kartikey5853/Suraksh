import React, { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, MenuIcon } from "lucide-react";
import { clearSession, getStoredUser } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Role = "admin" | "lawyer" | "associate" | "founder";

const ALL_NAV = [
  { label: "Dashboard",        path: "/admin/dashboard",        roles: ["admin","lawyer","associate","founder"] },
  { label: "Lawyer Review",    path: "/lawyer/dashboard",       roles: ["lawyer"] },
  { label: "Agreements",       path: "/admin/agreements",       roles: ["admin","associate"] },
  { label: "Create Agreement", path: "/admin/create-agreement", roles: ["admin","lawyer"] },
  { label: "User Management",  path: "/admin/users",            roles: ["admin"] },
  { label: "Documents",        path: "/admin/documents",        roles: ["admin","associate"] },
  { label: "Verifications",    path: "/admin/verifications",    roles: ["admin"] },
];

/* ── Tiny canvas-based twinkling stars ── */
function StarsCanvas({ color = "#0ea5e9" }: { color?: string }) {
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

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const user = getStoredUser();
  const role = (user?.role ?? "associate") as Role;

  const navItems = ALL_NAV.filter((item) => item.roles.includes(role));
  const handleLogout = () => { clearSession(); navigate("/"); };

  /* Click sparkle / ripple (blue) */
  useEffect(() => {
    const handleRipple = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("button") as HTMLElement | null;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const span = document.createElement("span");
      span.style.cssText = `position:absolute;border-radius:50%;background:rgba(14,165,233,0.3);pointer-events:none;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;transform:scale(0);animation:ripple-burst 0.55s ease-out forwards;`;
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
    <div className="admin-theme min-h-screen bg-background relative overflow-hidden">
      {/* Stars background (blue) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarsCanvas color="#0ea5e9" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(14,165,233,0.12)_0%,_transparent_70%)]" />
      </div>

      {/* ── Floating top nav ── */}
      <div className="px-4 pt-4 relative z-10">
        <header className="sticky top-4 z-50 mx-auto w-full max-w-5xl rounded-xl border border-border shadow-lg bg-background/90 supports-[backdrop-filter]:bg-background/75 backdrop-blur-lg">
          <nav className="flex items-center justify-between px-4 py-2">
            {/* Logo */}
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="hover:bg-accent hover:shadow-[0_0_12px_rgba(14,165,233,0.3)] flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200"
            >
              <span style={{ fontFamily: "'Samarkan', serif", fontSize: "1.35rem", letterSpacing: "0.05em", color: "hsl(var(--primary))" }}>Suraksh</span>
              {role && (
                <span className="text-[10px] text-muted-foreground capitalize ml-1 bg-muted px-1.5 py-0.5 rounded-full">
                  {role}
                </span>
              )}
            </button>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-xs relative transition-all duration-200 hover:bg-blue-100/80 hover:text-blue-700 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)]",
                    location.pathname === item.path && "bg-accent text-accent-foreground shadow-[0_0_14px_rgba(14,165,233,0.35)]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleLogout} className="hidden lg:flex gap-1.5 text-xs hover:bg-blue-100/80 hover:text-blue-700 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)] transition-all duration-200">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </Button>

              <Sheet open={open} onOpenChange={setOpen}>
                <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="lg:hidden h-8 w-8">
                  <MenuIcon className="w-4 h-4" />
                </Button>
                <SheetContent side="right" className="admin-theme w-64 flex flex-col">
                  <div className="flex-1 py-6 space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                          location.pathname === item.path
                            ? "bg-accent text-accent-foreground font-medium shadow-[0_0_14px_rgba(14,165,233,0.35)]"
                            : "text-muted-foreground hover:bg-blue-100/80 hover:text-blue-700 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <SheetFooter>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2 hover:bg-blue-100/80 hover:text-blue-700 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)] transition-all duration-200">
                      <LogOut className="w-4 h-4" /> Logout
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </header>
      </div>

      {/* ── Page content ── */}
      <main className="p-6 md:p-8 max-w-6xl mx-auto relative z-10">{children}</main>
    </div>
  );
};

export default AdminLayout;
