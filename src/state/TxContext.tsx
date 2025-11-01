import React from 'react'

type TxContextValue = {
  version: number
  invalidate: () => void
}

const TxContext = React.createContext<TxContextValue | undefined>(undefined)

export function TxProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = React.useState(0)
  const invalidate = React.useCallback(() => setVersion(v => v + 1), [])
  const value = React.useMemo(() => ({ version, invalidate }), [version, invalidate])
  return <TxContext.Provider value={value}>{children}</TxContext.Provider>
}

export function useTxInvalidation() {
  const ctx = React.useContext(TxContext)
  if (!ctx) throw new Error('useTxInvalidation must be used within TxProvider')
  return ctx
}
