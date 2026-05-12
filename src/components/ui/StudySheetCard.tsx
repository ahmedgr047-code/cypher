"use client";

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface StudySheetCardProps {
  title: string;
  fileSize: string;
  onDownload?: () => void;
  className?: string;
  inline?: boolean;
}

export function StudySheetCard({ 
  title, 
  fileSize, 
  onDownload, 
  className,
  inline = false
}: StudySheetCardProps) {
  const CardWrapper = inline ? "div" : motion.div;
  const motionProps = inline ? {} : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  };

  return (
    <CardWrapper
      {...motionProps}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border border-red-500/20 bg-black/50 backdrop-blur-sm relative z-10",
        inline ? "inline-flex" : "flex",
        className
      )}
    >
      {/* Cypher Icon */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 border border-red-500/30">
        <span className="text-white font-bold text-sm">C</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {title}
        </h4>
        <p className="text-xs text-red-400">{fileSize}</p>
      </div>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors"
      >
        <Download className="w-3 h-3" />
      </Button>
    </CardWrapper>
  );
}
