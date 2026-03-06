import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, Clock, ShieldCheck, UserCircle, LogOut
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
  { label: "My Documents", icon: FileText, path: "/user/documents" },
  { label: "Pending Agreements", icon: Clock, path: "/user/pending" },
  { label: "Verification Status", icon: ShieldCheck, path: "/user/verification" },
  { label: "Profile", icon: UserCircle, path: "/user/profile" },
];

const UserLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-[260px] bg-suraksh-navy border-r border-suraksh-steel/20 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-suraksh-steel/20">
          <svg viewBox="0 0 40 40" className="w-7 h-7 shrink-0">
            <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
            <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
          </svg>
          <span className="font-display font-semibold tracking-wider text-suraksh-glow text-sm">SURAKSH</span>
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
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-suraksh-slate hover:bg-suraksh-steel/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default UserLayout;
