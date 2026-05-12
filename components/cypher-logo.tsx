"use client";

import { motion } from "framer-motion";

interface CypherLogoProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function CypherLogo({ size = "md", animate = true }: CypherLogoProps) {
  const sizes = {
    sm: { container: "w-8 h-8", text: "text-lg" },
    md: { container: "w-12 h-12", text: "text-2xl" },
    lg: { container: "w-16 h-16", text: "text-3xl" },
  };

  const Logo = animate ? motion.div : "div";

  return (
    <Logo
      className={`${sizes[size].container} relative flex items-center justify-center`}
      {...(animate && {
        whileHover: { scale: 1.05 },
        transition: { type: "spring", stiffness: 400, damping: 10 },
      })}
    >
      {/* Outer geometric frame */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hexagonal border */}
        <motion.path
          d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          fill="none"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Inner accent lines */}
        <motion.path
          d="M50 15 L80 32.5 L80 67.5 L50 85 L20 67.5 L20 32.5 Z"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary/40"
          fill="none"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={animate ? { pathLength: 1 } : undefined}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        />
      </svg>

      {/* Center C letter */}
      <motion.span
        className={`${sizes[size].text} font-bold text-primary relative z-10`}
        initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        C
      </motion.span>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
    </Logo>
  );
}
