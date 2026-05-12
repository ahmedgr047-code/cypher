"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, User, Palette, Brain, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PersonaSettings {
  name: string;
  personality: string;
  responseStyle: 'formal' | 'casual' | 'friendly';
  expertise: 'general' | 'academic' | 'technical';
}

interface NewSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PersonaSettings) => void;
  currentSettings: PersonaSettings;
}

const defaultPersona: PersonaSettings = {
  name: 'فتيحة',
  personality: 'مساعدة ودودة ومحبة للطلاب، متخصصة في معهد الشموخ',
  responseStyle: 'friendly',
  expertise: 'academic'
};

const personaPresets = {
  فتيحة: {
    name: 'فتيحة',
    personality: 'مساعدة ودودة ومحبة للطلاب، متخصصة في معهد الشموخ',
    responseStyle: 'friendly' as const,
    expertise: 'academic' as const
  },
  أستاذ: {
    name: 'أستاذ',
    personality: 'أستاذ جامعي محترف، يشرح المفاهيم بدقة وأكاديمية',
    responseStyle: 'formal' as const,
    expertise: 'academic' as const
  },
  صديق: {
    name: 'صديق',
    personality: 'صديق مقرب يساعد بأسلوب بسيط ومباشر',
    responseStyle: 'casual' as const,
    expertise: 'general' as const
  },
  مبرمج: {
    name: 'مبرمج',
    personality: 'خبير تقني يركز على البرمجة والحلول التقنية',
    responseStyle: 'formal' as const,
    expertise: 'technical' as const
  }
};

export function NewSettingsPanel({
  isOpen,
  onClose,
  onSave,
  currentSettings
}: NewSettingsPanelProps) {
  const [settings, setSettings] = useState<PersonaSettings>(currentSettings || defaultPersona);
  const [activeTab, setActiveTab] = useState<'persona' | 'appearance'>('persona');

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const selectPreset = (preset: keyof typeof personaPresets) => {
    setSettings(personaPresets[preset]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-black border border-red-500/20 rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-400" />
              الإعدادات
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-red-500/20">
            <button
              onClick={() => setActiveTab('persona')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === 'persona'
                  ? "text-red-400 border-red-400"
                  : "text-gray-400 border-transparent hover:text-red-300"
              )}
            >
              <Brain className="w-4 h-4 ml-2" />
              الشخصية
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === 'appearance'
                  ? "text-red-400 border-red-400"
                  : "text-gray-400 border-transparent hover:text-red-300"
              )}
            >
              <Palette className="w-4 h-4 ml-2" />
              المظهر
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'persona' && (
              <motion.div
                key="persona"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Preset Selection */}
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-3">شخصية سريعة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(personaPresets).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => selectPreset(key as keyof typeof personaPresets)}
                        className={cn(
                          "p-3 rounded-lg border text-right transition-all duration-200",
                          settings.name === preset.name
                            ? "bg-red-600/20 border-red-500/50 text-white"
                            : "bg-black/50 border-red-500/20 text-gray-300 hover:bg-red-600/10 hover:border-red-500/40"
                        )}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-red-400 mt-1">{preset.personality.slice(0, 50)}...</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Persona */}
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">اسم الشخصية:</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/50 border border-red-500/20 rounded-lg px-3 py-2 text-white placeholder-red-900/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                    placeholder="أدخل اسم الشخصية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">وصف الشخصية:</label>
                  <textarea
                    value={settings.personality}
                    onChange={(e) => setSettings(prev => ({ ...prev, personality: e.target.value }))}
                    className="w-full bg-black/50 border border-red-500/20 rounded-lg px-3 py-2 text-white placeholder-red-900/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 resize-none"
                    rows={3}
                    placeholder="صف شخصية البوت..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">أسلوب الرد:</label>
                    <select
                      value={settings.responseStyle}
                      onChange={(e) => setSettings(prev => ({ ...prev, responseStyle: e.target.value as any }))}
                      className="w-full bg-black/50 border border-red-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                    >
                      <option value="formal">رسمي</option>
                      <option value="casual">عادي</option>
                      <option value="friendly">ودود</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">التخصص:</label>
                    <select
                      value={settings.expertise}
                      onChange={(e) => setSettings(prev => ({ ...prev, expertise: e.target.value as any }))}
                      className="w-full bg-black/50 border border-red-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                    >
                      <option value="general">عام</option>
                      <option value="academic">أكاديمي</option>
                      <option value="technical">تقني</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center border border-red-500/30">
                    <span className="text-white font-bold text-2xl">C</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Cypher</h3>
                  <p className="text-sm text-red-400">معهد الشموخ - أرشيف الشيتات والمناهج</p>
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-300">الألوان الحالية: أسود، أحمر، أبيض</p>
                    <p className="text-xs text-red-400 mt-1">مظهر Cyberpunk ثابت</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-red-500/20">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-red-400 hover:text-red-300"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
