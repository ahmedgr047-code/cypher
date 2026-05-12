"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DebugPanelProps {
  onTestConnection: () => void;
  connectionStatus: 'loading' | 'success' | 'error';
  lastError?: string;
}

export function DebugPanel({ onTestConnection, connectionStatus, lastError }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="bg-black/80 border-red-500/30 text-red-400"
      >
        🔧 Debug
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-80 bg-black border border-red-500/30 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">لوحة التحكم</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-red-400 text-sm">حالة الاتصال:</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'success' ? 'bg-green-500' :
                  'bg-red-500'
                }`} />
                <span className="text-white text-sm">
                  {connectionStatus === 'loading' ? 'جاري الفحص...' :
                   connectionStatus === 'success' ? 'متصل' :
                   'فشل الاتصال'}
                </span>
              </div>
            </div>

            {lastError && (
              <div>
                <p className="text-red-400 text-sm mb-1">آخر خطأ:</p>
                <div className="bg-red-900/20 border border-red-500/20 rounded p-2">
                  <p className="text-red-300 text-xs">{lastError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={onTestConnection}
              disabled={connectionStatus === 'loading'}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {connectionStatus === 'loading' ? 'جاري الفحص...' : 'اختبار الاتصال'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
