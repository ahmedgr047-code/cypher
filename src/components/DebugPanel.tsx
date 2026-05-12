"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, WifiOff, AlertTriangle, Bug, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  onTestConnection: () => void;
  connectionStatus: 'loading' | 'success' | 'error';
  lastError?: string;
}

export function DebugPanel({ onTestConnection, connectionStatus, lastError }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              size="sm"
              className="bg-black/90 backdrop-blur-sm border-red-500/30 text-red-400 hover:bg-red-600/20 hover:border-red-500/50 transition-all duration-200 shadow-lg"
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-16 left-0 w-96 bg-black/95 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">لوحة التحكم</h3>
                  <p className="text-red-400 text-xs">System Status & Debugging</p>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>

            {/* Connection Status */}
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    connectionStatus === 'loading' ? 'bg-yellow-500/20 border border-yellow-500/40' :
                    connectionStatus === 'success' ? 'bg-green-500/20 border border-green-500/40' :
                    'bg-red-500/20 border border-red-500/40'
                  )}>
                    {connectionStatus === 'loading' ? (
                      <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />
                    ) : connectionStatus === 'success' ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">حالة الاتصال</p>
                    <p className="text-red-400 text-sm">
                      {connectionStatus === 'loading' ? 'جاري الفحص...' :
                       connectionStatus === 'success' ? 'متصل بالخادم' :
                       'فشل الاتصال'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {lastError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-900/40 border border-red-500/30 rounded-xl p-4 mb-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm mb-1">تفاصيل الخطأ</p>
                    <p className="text-red-300 text-xs leading-relaxed">{lastError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Test Button */}
            <Button
              onClick={onTestConnection}
              disabled={connectionStatus === 'loading'}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all duration-200 shadow-lg"
            >
              {connectionStatus === 'loading' ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  جاري الفحص...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  اختبار الاتصال
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
