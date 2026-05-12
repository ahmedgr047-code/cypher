"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Play, Copy, Download, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlock {
  language: string;
  content: string;
  id: string;
}

interface WorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  codeBlocks: CodeBlock[];
  onRunCode?: (code: string, language: string) => void;
}

export default function Workbench({ isOpen, onClose, codeBlocks, onRunCode }: WorkbenchProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || codeBlocks.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-0 left-0 right-0 h-96 bg-black border-t border-red-500/30 z-50 lg:h-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-500/20 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-red-400 font-semibold flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Workbench
            </h3>
            <div className="flex gap-1">
              {codeBlocks.map((block, index) => (
                <button
                  key={block.id}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-all duration-200",
                    activeTab === index
                      ? "bg-red-600 text-white"
                      : "bg-red-900/30 text-red-400 hover:bg-red-800/40"
                  )}
                >
                  {block.language}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="h-full bg-black/90 p-4 overflow-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                <code>{codeBlocks[activeTab]?.content}</code>
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-red-500/20 bg-black/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onRunCode?.(codeBlocks[activeTab].content, codeBlocks[activeTab].language)}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-500/30"
              >
                <Play className="w-3 h-3 ml-1" />
                تشغيل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(codeBlocks[activeTab].content, codeBlocks[activeTab].id)}
                className="text-red-400 hover:text-red-300"
              >
                {copiedId === codeBlocks[activeTab].id ? (
                  <span className="text-xs">تم النسخ!</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3 ml-1" />
                    نسخ
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(
                  codeBlocks[activeTab].content,
                  `code.${codeBlocks[activeTab].language}`
                )}
                className="text-red-400 hover:text-red-300"
              >
                <Download className="w-3 h-3 ml-1" />
                تحميل
              </Button>
            </div>
            <div className="text-xs text-red-500/60">
              {codeBlocks[activeTab].language} • {codeBlocks[activeTab].content.length} حرف
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
