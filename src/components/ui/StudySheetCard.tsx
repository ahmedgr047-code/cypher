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
}

export function StudySheetCard({ 
  title, 
  fileSize, 
  onDownload, 
  className 
}: StudySheetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border border-border rounded-lg",
        className
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground">{fileSize}</p>
      </div>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Download className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
