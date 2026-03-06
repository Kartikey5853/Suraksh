import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, User, Lock } from "lucide-react";

type Section = "landing" | "user" | "admin" | null;

const TriangleNav = () => {
  const [hovered, setHovered] = useState<Section>(null);
  const [clicked, setClicked] = useState<Section>(null);
  const navigate = useNavigate();

  const handleClick = (section: Section) => {
    setClicked(section);
    setTimeout(() => {
      if (section === "landing") navigate("/landing");
      else if (section === "user") navigate("/user/login");
      else if (section === "admin") navigate("/admin/login");
    }, 600);
  };

  const getExitAnimation = () => {
    if (clicked === "landing") return { y: "-100%" };
    if (clicked === "user") return { x: "-100%" };
    if (clicked === "admin") return { x: "100%" };
    return {};
  };

  const isActive = (section: Section) => hovered === section;
  const isInactive = (section: Section) => hovered !== null && hovered !== section;

  return (
    <motion.div
      className="fixed inset-0 bg-suraksh-navy overflow-hidden cursor-default"
      animate={clicked ? getExitAnimation() : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Branding */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <TriangleLogo />
        <span className="text-lg font-display font-semibold tracking-wider uppercase text-suraksh-glow">
          Suraksh
        </span>
      </div>

      {/* SVG triangle layout */}
      <svg
        viewBox="0 0 1000 1000"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Top triangle - Landing */}
        <polygon
          points="500,0 0,500 1000,500"
          className="cursor-pointer transition-all duration-500"
          fill={isActive("landing") ? "hsl(210, 100%, 15%)" : isInactive("landing") ? "hsl(220, 20%, 10%)" : "hsl(220, 25%, 14%)"}
          stroke="hsl(210, 100%, 30%)"
          strokeWidth="0.5"
          onMouseEnter={() => setHovered("landing")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick("landing")}
        />
        {/* Left triangle - User */}
        <polygon
          points="0,500 500,1000 0,1000"
          className="cursor-pointer transition-all duration-500"
          fill={isActive("user") ? "hsl(175, 60%, 15%)" : isInactive("user") ? "hsl(220, 20%, 10%)" : "hsl(220, 25%, 14%)"}
          stroke="hsl(175, 60%, 30%)"
          strokeWidth="0.5"
          onMouseEnter={() => setHovered("user")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick("user")}
        />
        {/* Right triangle - Admin */}
        <polygon
          points="1000,500 500,1000 1000,1000"
          className="cursor-pointer transition-all duration-500"
          fill={isActive("admin") ? "hsl(215, 40%, 18%)" : isInactive("admin") ? "hsl(220, 20%, 10%)" : "hsl(220, 25%, 14%)"}
          stroke="hsl(215, 30%, 35%)"
          strokeWidth="0.5"
          onMouseEnter={() => setHovered("admin")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick("admin")}
        />
        {/* Bottom center fill */}
        <polygon
          points="0,500 1000,500 500,1000"
          fill="hsl(220, 30%, 10%)"
          stroke="none"
          className="pointer-events-none"
        />
      </svg>

      {/* Labels */}
      <TriangleLabel
        section="landing"
        isActive={isActive("landing")}
        isInactive={isInactive("landing")}
        icon={<Shield className="w-8 h-8" />}
        title="Landing"
        subtitle="Product Overview"
        position="top"
        onHover={() => setHovered("landing")}
        onLeave={() => setHovered(null)}
        onClick={() => handleClick("landing")}
      />
      <TriangleLabel
        section="user"
        isActive={isActive("user")}
        isInactive={isInactive("user")}
        icon={<User className="w-8 h-8" />}
        title="User Portal"
        subtitle="Login & Documents"
        position="left"
        onHover={() => setHovered("user")}
        onLeave={() => setHovered(null)}
        onClick={() => handleClick("user")}
      />
      <TriangleLabel
        section="admin"
        isActive={isActive("admin")}
        isInactive={isInactive("admin")}
        icon={<Lock className="w-8 h-8" />}
        title="Admin Portal"
        subtitle="System Management"
        position="right"
        onHover={() => setHovered("admin")}
        onLeave={() => setHovered(null)}
        onClick={() => handleClick("admin")}
      />
    </motion.div>
  );
};

const TriangleLogo = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7">
    <polygon points="20,4 6,34 34,34" fill="none" stroke="hsl(210,100%,50%)" strokeWidth="2" />
    <polygon points="20,12 12,30 28,30" fill="hsl(175,70%,40%)" opacity="0.6" />
  </svg>
);

interface LabelProps {
  section: Section;
  isActive: boolean;
  isInactive: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  position: "top" | "left" | "right";
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const TriangleLabel = ({
  isActive,
  isInactive,
  icon,
  title,
  subtitle,
  position,
  onHover,
  onLeave,
  onClick,
}: LabelProps) => {
  const positionClasses = {
    top: "top-[18%] left-1/2 -translate-x-1/2",
    left: "bottom-[18%] left-[12%]",
    right: "bottom-[18%] right-[12%]",
  };

  return (
    <motion.div
      className={`absolute z-10 flex flex-col items-center gap-2 select-none cursor-pointer ${positionClasses[position]}`}
      animate={{
        scale: isActive ? 1.08 : 1,
        opacity: isInactive ? 0.25 : 1,
      }}
      transition={{ duration: 0.4 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div
        className={`p-3 rounded-lg border transition-colors duration-500 ${
          isActive
            ? "border-suraksh-glow/40 bg-suraksh-glow/10"
            : "border-suraksh-steel/30 bg-suraksh-navy/50"
        }`}
      >
        <span className={`transition-colors duration-500 ${isActive ? "text-suraksh-glow" : "text-suraksh-slate"}`}>
          {icon}
        </span>
      </div>
      <h2 className={`font-display text-lg font-semibold tracking-wide transition-colors duration-500 ${
        isActive ? "text-primary-foreground" : "text-suraksh-slate"
      }`}>
        {title}
      </h2>
      <p className={`text-xs tracking-wider uppercase transition-colors duration-500 ${
        isActive ? "text-suraksh-glow" : "text-suraksh-slate/60"
      }`}>
        {subtitle}
      </p>
    </motion.div>
  );
};

export default TriangleNav;
