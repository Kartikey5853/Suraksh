import { ReactNode, useState } from "react";
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

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const user = getStoredUser();
  const role = (user?.role ?? "associate") as Role;

  const navItems = ALL_NAV.filter((item) => item.roles.includes(role));
  const handleLogout = () => { clearSession(); navigate("/"); };

  return (
    <div className="admin-theme min-h-screen bg-background">
      {/* ── Floating top nav ── */}
      <div className="px-4 pt-4">
        <header className="sticky top-4 z-50 mx-auto w-full max-w-5xl rounded-xl border border-border shadow-lg bg-background/90 supports-[backdrop-filter]:bg-background/75 backdrop-blur-lg">
          <nav className="flex items-center justify-between px-4 py-2">
            {/* Logo */}
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
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
                    "text-xs relative",
                    location.pathname === item.path && "bg-accent text-accent-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleLogout} className="hidden lg:flex gap-1.5 text-xs">
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
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                          location.pathname === item.path
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <SheetFooter>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2">
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
      <main className="p-6 md:p-8 max-w-6xl mx-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
