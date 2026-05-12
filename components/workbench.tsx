"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Eye, Copy, Check, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkbenchProps {
  code?: {
    language: string;
    content: string;
  };
  dailyTokensUsed?: number;
  dailyTokensLimit?: number;
  onClose?: () => void;
}

const sampleCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.05);
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      font-size: 3rem;
      margin: 0;
      background: linear-gradient(90deg, #dc2626, #f87171);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #888;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <p>Welcome to Cypher AI</p>
  </div>
</body>
</html>`;

export function Workbench({
  code,
  dailyTokensUsed = 2450,
  dailyTokensLimit = 10000,
  onClose,
}: WorkbenchProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentCode, setCurrentCode] = useState(code?.content || sampleCode);

  useEffect(() => {
    if (code?.content) {
      setCurrentCode(code.content);
      // Switch to code tab for non-HTML code
      if (code.language !== "html" && code.language !== "HTML") {
        setActiveTab("code");
      }
    }
  }, [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenPercentage = (dailyTokensUsed / dailyTokensLimit) * 100;

  // Generate preview HTML for non-HTML code
  const getPreviewContent = () => {
    if (!code?.language || code.language === "html" || code.language === "HTML") {
      return currentCode;
    }
    
    // For other languages, create a styled display
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Monaco', 'Consolas', monospace;
      background: #0a0a0a;
      color: #e5e5e5;
      padding: 2rem;
      margin: 0;
      min-height: 100vh;
    }
    .header {
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #333;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.875rem;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">${code.language.toUpperCase()} Code Preview</div>
  <pre>${currentCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-l border-border",
        isFullscreen && "fixed inset-0 z-50 border-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border shrink-0">
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all",
              activeTab === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all",
              activeTab === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Code</span>
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full bg-background"
            >
              <iframe
                srcDoc={getPreviewContent()}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Preview"
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto"
            >
              <div className="min-h-full">
                {/* Language indicator */}
                <div className="sticky top-0 bg-secondary/80 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 text-xs text-muted-foreground border-b border-border flex items-center justify-between z-10">
                  <span className="font-mono">{code?.language || "html"}</span>
                  <span className="text-primary text-[10px] md:text-xs">Read-only</span>
                </div>

                {/* Code content */}
                <pre className="p-3 md:p-4 text-xs md:text-sm font-mono overflow-x-auto">
                  <code className="text-foreground">
                    {currentCode.split("\n").map((line, i) => (
                      <div key={i} className="flex">
                        <span className="w-8 md:w-12 text-right pr-2 md:pr-4 text-muted-foreground/50 select-none text-[10px] md:text-xs">
                          {i + 1}
                        </span>
                        <span className="flex-1">{highlightCode(line)}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Token Usage Bar */}
      <div className="px-3 md:px-4 py-2 md:py-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2">
          <span>Daily Tokens</span>
          <span>
            {dailyTokensUsed.toLocaleString()} / {dailyTokensLimit.toLocaleString()}
          </span>
        </div>
        <div className="h-1 md:h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${tokenPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              tokenPercentage > 80
                ? "bg-destructive"
                : tokenPercentage > 50
                ? "bg-yellow-500"
                : "bg-primary"
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighting helper
function highlightCode(line: string): React.ReactNode {
  // Keywords
  const keywords = ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "def", "import", "from", "export", "default", "print", "True", "False", "None", "self", "async", "await"];
  const htmlTags = ["html", "head", "body", "div", "span", "p", "h1", "h2", "h3", "style", "script", "meta", "title", "link"];
  
  let result = line;
  
  // Highlight strings
  result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="text-green-400">$&</span>');
  
  // Highlight comments
  result = result.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|#.*$)/gm, '<span class="text-muted-foreground/60">$&</span>');
  
  // Highlight HTML tags
  htmlTags.forEach(tag => {
    const regex = new RegExp(`(<\/?)(${tag})(\\s|>)`, 'gi');
    result = result.replace(regex, '$1<span class="text-primary">$2</span>$3');
  });
  
  // Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    result = result.replace(regex, '<span class="text-purple-400">$1</span>');
  });
  
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}
