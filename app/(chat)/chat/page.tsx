"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInterface } from "@/components/chat-interface";
import { Workbench } from "@/components/workbench";
import { useIsMobile } from "@/hooks/use-mobile";

interface CodeBlock {
  language: string;
  content: string;
}

export default function ChatPage() {
  const [generatedCode, setGeneratedCode] = useState<CodeBlock | undefined>();
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();

  const handleCodeGenerated = (code: CodeBlock) => {
    setGeneratedCode(code);
    setIsWorkbenchOpen(true);
  };

  const handleExpandCode = (code: CodeBlock) => {
    setGeneratedCode(code);
    setIsWorkbenchOpen(true);
  };

  const handleCloseWorkbench = () => {
    setIsWorkbenchOpen(false);
  };

  // Handle drag for resizing panels
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      if (isMobile) {
        // Vertical split on mobile (top-bottom)
        const containerHeight = window.innerHeight;
        const newPosition = (e.clientY / containerHeight) * 100;
        setSplitPosition(Math.min(Math.max(newPosition, 20), 80));
      } else {
        // Horizontal split on desktop (side-by-side)
        const containerWidth = window.innerWidth;
        const newPosition = (e.clientX / containerWidth) * 100;
        setSplitPosition(Math.min(Math.max(newPosition, 25), 75));
      }
    },
    [isDragging, isMobile]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];

      if (isMobile) {
        const containerHeight = window.innerHeight;
        const newPosition = (touch.clientY / containerHeight) * 100;
        setSplitPosition(Math.min(Math.max(newPosition, 20), 80));
      } else {
        const containerWidth = window.innerWidth;
        const newPosition = (touch.clientX / containerWidth) * 100;
        setSplitPosition(Math.min(Math.max(newPosition, 25), 75));
      }
    },
    [isDragging, isMobile]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Reset split position when switching between mobile and desktop
  useEffect(() => {
    setSplitPosition(50);
  }, [isMobile]);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile: Top-Bottom Layout, Desktop: Side-by-Side Layout */}
      
      {/* Workbench Panel (slides in from top on mobile, right on desktop) */}
      <AnimatePresence>
        {isWorkbenchOpen && (
          <>
            {/* Desktop: Side-by-side with workbench on right */}
            {!isMobile && (
              <>
                {/* Chat Panel */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: `${splitPosition}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="h-full min-w-0 flex flex-col"
                >
                  <ChatInterface
                    onCodeGenerated={handleCodeGenerated}
                    onExpandCode={handleExpandCode}
                    persona={{ name: "Fatiha", personality: "Expert Tutor" }}
                  />
                </motion.div>

                {/* Drag Divider */}
                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  className="w-1 bg-border hover:bg-primary/50 cursor-col-resize relative group transition-colors z-10"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center">
                    <div className="w-1 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary/70 transition-colors" />
                  </div>
                </div>

                {/* Workbench Panel */}
                <motion.div
                  initial={{ width: 0, opacity: 0, x: 100 }}
                  animate={{ 
                    width: `${100 - splitPosition}%`, 
                    opacity: 1, 
                    x: 0 
                  }}
                  exit={{ width: 0, opacity: 0, x: 100 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="h-full min-w-0"
                >
                  <Workbench
                    code={generatedCode}
                    dailyTokensUsed={2450}
                    dailyTokensLimit={10000}
                    onClose={handleCloseWorkbench}
                  />
                </motion.div>
              </>
            )}

            {/* Mobile: Top-Bottom layout */}
            {isMobile && (
              <div className="flex flex-col h-full w-full">
                {/* Workbench at top */}
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -50 }}
                  animate={{ 
                    height: `${splitPosition}%`, 
                    opacity: 1, 
                    y: 0 
                  }}
                  exit={{ height: 0, opacity: 0, y: -50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full min-h-0 overflow-hidden"
                >
                  <Workbench
                    code={generatedCode}
                    dailyTokensUsed={2450}
                    dailyTokensLimit={10000}
                    onClose={handleCloseWorkbench}
                  />
                </motion.div>

                {/* Mobile Drag Handle */}
                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  className="h-3 bg-card border-y border-border cursor-row-resize flex items-center justify-center active:bg-secondary"
                >
                  <div className="w-12 h-1 rounded-full bg-muted-foreground/40" />
                </div>

                {/* Chat at bottom */}
                <motion.div
                  initial={{ height: "100%" }}
                  animate={{ height: `${100 - splitPosition - 2}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full min-h-0 flex flex-col"
                >
                  <ChatInterface
                    onCodeGenerated={handleCodeGenerated}
                    onExpandCode={handleExpandCode}
                    persona={{ name: "Fatiha", personality: "Expert Tutor" }}
                  />
                </motion.div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Full-screen Chat when Workbench is closed */}
      {!isWorkbenchOpen && (
        <div className="flex-1 h-full">
          <ChatInterface
            onCodeGenerated={handleCodeGenerated}
            onExpandCode={handleExpandCode}
            persona={{ name: "Fatiha", personality: "Expert Tutor" }}
          />
        </div>
      )}

    </div>
  );
}
