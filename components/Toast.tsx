'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border bg-ink-900/90 px-4 py-3 shadow-2xl backdrop-blur transition-all',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        toast.kind === 'success' && 'border-emerald-500/30',
        toast.kind === 'error' && 'border-red-500/30',
        toast.kind === 'info' && 'border-brand-500/30',
      )}
    >
      {toast.kind === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />}
      {toast.kind === 'error' && <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />}
      {toast.kind === 'info' && <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-400" />}
      <div className="flex-1 text-sm text-white">{toast.message}</div>
      <button onClick={onClose} className="text-ink-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
