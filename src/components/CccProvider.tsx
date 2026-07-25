'use client'

import type { CSSProperties, ReactNode } from 'react'
import { ccc } from '@ckb-ccc/connector-react'
import { getClient } from '@/lib/ccc'

const connectorStyle = {
  '--background': '#1c1917',
  '--divider': '#44403c',
  '--btn-primary': '#292524',
  '--btn-primary-hover': '#44403c',
  '--btn-secondary': '#57534e',
  '--btn-secondary-hover': '#78716c',
  '--icon-primary': '#e7e5e4',
  '--icon-secondary': '#a8a29e',
  '--tip-color': '#a8a29e',
  color: '#e7e5e4',
} as CSSProperties

export function CccProvider({ children }: { children: ReactNode }) {
  return (
    <ccc.Provider
      name="Cell Sandbox"
      icon="/favicon.ico"
      defaultClient={getClient('testnet')}
      connectorProps={{ style: connectorStyle }}
    >
      {children}
    </ccc.Provider>
  )
}
