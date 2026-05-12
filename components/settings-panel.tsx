"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState("en");
  const [persona, setPersona] = useState(
    `Name: Fatiha
Personality: Expert Tutor
Tone: Friendly and encouraging
Expertise: Programming, Web Development, Data Science
Style: Explains concepts clearly with practical examples`
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Language Setting */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <Label className="text-base font-medium">Language</Label>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )}
                  <Label className="text-base font-medium">Theme</Label>
                </div>
                <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Light</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Dark</span>
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Persona Configurator */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <Label className="text-base font-medium">
                    Persona Configurator
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {"Define your AI's identity, personality, and expertise."}
                </p>
                <Textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder={`Name: Fatiha\nPersonality: Expert Tutor\nTone: Friendly\nExpertise: Programming`}
                  className="min-h-[180px] bg-secondary/50 border-border font-mono text-sm resize-none focus:border-primary focus:ring-primary/20"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Changes are saved automatically
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:bg-secondary/50 hover:border-primary/50"
                    onClick={() =>
                      setPersona(`Name: Fatiha
Personality: Expert Tutor
Tone: Friendly and encouraging
Expertise: Programming, Web Development, Data Science
Style: Explains concepts clearly with practical examples`)
                    }
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Preview</Label>
                <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {persona.match(/Name:\s*(.+)/)?.[1] || "AI Assistant"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {persona.match(/Personality:\s*(.+)/)?.[1] ||
                          "General Assistant"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    {`"Hi! I'm ${
                      persona.match(/Name:\s*(.+)/)?.[1] || "your AI"
                    }, your ${
                      persona.match(/Personality:\s*(.+)/)?.[1]?.toLowerCase() ||
                      "assistant"
                    }. How can I help you today?"`}
                  </p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 pt-6 border-t border-border">
                <Label className="text-base font-medium text-destructive">
                  Danger Zone
                </Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    Clear Chat History
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-6 py-4">
              <Button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
