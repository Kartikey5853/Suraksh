import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, ShieldCheck, FilePlus, LogOut, ScrollText
} from "lucide-react";
import { clearSession, getStoredUser } from "@/lib/api";

type Role = "admin" | "lawyer" | "associate" | "founder";

const ALL_NAV = [
  { label: "Dashboard",       icon: LayoutDashboard, path: "/admin/dashboard",        roles: ["admin","lawyer","associate","founder"] },
  { label: "Agreements",      icon: ScrollText,       path: "/admin/agreements",       roles: ["admin","lawyer","associate"] },
  { label: "Create Agreement",icon: FilePlus,         path: "/admin/create-agreement", roles: ["admin","lawyer"] },
  { label: "User Management", icon: Users,            path: "/admin/users",            roles: ["admin"] },
  { label: "Documents",       icon: FileText,         path: "/admin/documents",        roles: ["admin","lawyer","associate"] },
  { label: "Verifications",   icon: ShieldCheck,      path: "/admin/verifications",    roles: ["admin"] },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const role = (user?.role ?? "associate") as Role;

  const navItems = ALL_NAV.filter((item) => item.roles.includes(role));

  const handleLogout = () => { clearSession(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-[260px] bg-suraksh-navy border-r border-suraksh-steel/20 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-suraksh-steel/20">
          <svg viewBox="0 0 40 40" className="w-7 h-7 shrink-0">
            <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
            <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
          </svg>
          <div>
            <span className="font-display font-semibold tracking-wider text-suraksh-glow text-sm block">ADMIN</span>
            <span className="text-xs text-suraksh-slate capitalize">{role}</span>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-suraksh-steel/20 text-suraksh-glow" : "text-suraksh-slate hover:bg-suraksh-steel/10 hover:text-primary-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-suraksh-steel/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-suraksh-slate hover:bg-suraksh-steel/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
