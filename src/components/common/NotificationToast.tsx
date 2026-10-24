'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, ShieldAlert, Info, X } from 'lucide-react'

export interface ToastProps {
  type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO'
  title: string
  message: string
  onClose: () => void
}

export function NotificationToast({ type, title, message, onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-5 duration-300 ${
        type === 'SUCCESS'
          ? 'border-emerald-500/40 bg-slate-900/95 text-emerald-300'
          : type === 'WARNING'
          ? 'border-amber-500/40 bg-slate-900/95 text-amber-300'
          : type === 'DANGER'
          ? 'border-rose-500/40 bg-slate-900/95 text-rose-300'
          : 'border-blue-500/40 bg-slate-900/95 text-blue-300'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {type === 'SUCCESS' && <CheckCircle className="size-5 text-emerald-400" />}
        {type === 'WARNING' && <AlertTriangle className="size-5 text-amber-400" />}
        {type === 'DANGER' && <ShieldAlert className="size-5 text-rose-400" />}
        {type === 'INFO' && <Info className="size-5 text-blue-400" />}
      </div>

      <div className="flex-1 text-xs">
        <h5 className="font-bold text-white mb-0.5">{title}</h5>
        <p className="text-slate-300 leading-relaxed text-[11px]">{message}</p>
      </div>

      <button
        onClick={onClose}
        className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
