import React from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gray-900/90 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
