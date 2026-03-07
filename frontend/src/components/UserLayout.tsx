import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Clock, ShieldCheck, UserCircle, LogOut
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
  { label: "Pending Agreements", icon: Clock, path: "/user/pending" },
  { label: "My Verification", icon: ShieldCheck, path: "/user/verification-status" },
  { label: "Profile", icon: UserCircle, path: "/user/profile" },
];

const UserLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="user-theme min-h-screen flex bg-background">
      <aside className="w-[260px] border-r border-border bg-sidebar flex flex-col shrink-0">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
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
