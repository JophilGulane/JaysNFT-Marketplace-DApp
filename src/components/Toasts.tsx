import React from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }

type ToastContextValue = {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const idRef = React.useRef(1)

  const showToast = React.useCallback((message: string, type?: Toast['type']) => {
    const id = idRef.current++
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow border text-sm ${
            t.type === 'error' ? 'bg-red-950/60 border-red-700 text-red-200' :
            t.type === 'success' ? 'bg-green-950/60 border-green-700 text-green-200' :
            'bg-gray-900/80 border-gray-700 text-gray-100'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
