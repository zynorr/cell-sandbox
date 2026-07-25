'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useSandbox } from '@/store/sandbox'
import { CellView } from './CellView'
import { formatCapacity } from '@/lib/ccc'
import { validateOutputCells } from '@/lib/cellValidation'

function WalletInputNode({ data }: NodeProps) {
  const connected = Boolean(data.connected)
  const walletName = typeof data.walletName === 'string' ? data.walletName : ''

  return (
    <div className="relative min-w-[170px] rounded-lg border border-blue-800/40 bg-blue-950/30 px-4 py-3 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Wallet funding</p>
      <p className={`mt-1 text-xs font-medium ${connected ? 'text-stone-200' : 'text-amber-300'}`}>
        {connected ? walletName : 'Connect wallet'}
      </p>
      <p className="mt-1 text-[10px] text-stone-500">Spendable Cells selected at signing</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-stone-900 !bg-blue-500" />
    </div>
  )
}

function TxNode({ data }: NodeProps) {
  const totalOut = typeof data.totalOut === 'string' ? data.totalOut : '0'
  const hasOutputs = Boolean(data.hasOutputs)

  return (
    <div className="relative min-w-[190px] rounded-lg border border-stone-600/50 bg-stone-800/90 px-5 py-4 shadow-lg backdrop-blur-sm">
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-stone-900 !bg-blue-500" />
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Transaction
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4 text-stone-300">
          <span>Inputs</span>
          <span className="text-right font-mono text-blue-300">{hasOutputs ? 'automatic' : '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-stone-300">
          <span>Outputs</span>
          <span className="text-right font-mono">{formatCapacity(totalOut)}</span>
        </div>
        <div className="my-1.5 border-t border-stone-700/50" />
        <div className="flex items-center justify-between gap-4 text-stone-300">
          <span>Fee</span>
          <span className="text-right text-amber-300/80">{hasOutputs ? 'at signing' : '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-stone-300">
          <span>Change</span>
          <span className="text-right text-emerald-300/80">{hasOutputs ? 'to wallet' : '-'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-stone-900 !bg-emerald-500" />
    </div>
  )
}

function CellFlowNode({ data }: NodeProps) {
  const index = data.cellIndex as number

  return (
    <div className="flex flex-col items-center gap-2">
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-stone-900 !bg-emerald-500" />
      <div className="rounded-lg border border-stone-700/30 bg-stone-800/40 p-2.5 shadow-lg backdrop-blur-sm">
        <CellView index={index} compact />
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-emerald-800/20 bg-emerald-900/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          output
        </span>
        <span className="font-mono text-[10px] text-stone-500">#{index}</span>
      </div>
    </div>
  )
}

type StepState = 'complete' | 'current' | 'pending' | 'warning'

function BuildStep({ number, label, value, state }: { number: number; label: string; value: string; state: StepState }) {
  const tone = state === 'complete'
    ? 'border-emerald-700/50 bg-emerald-950/20 text-emerald-300'
    : state === 'warning'
      ? 'border-amber-700/50 bg-amber-950/20 text-amber-300'
      : state === 'current'
        ? 'border-blue-700/50 bg-blue-950/20 text-blue-300'
        : 'border-stone-800 bg-stone-950/30 text-stone-600'

  return (
    <li className={`min-w-0 border-l px-3 py-2 first:border-l-0 ${tone}`}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px]">{number}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs text-stone-400" title={value}>{value}</p>
    </li>
  )
}

const nodeTypes = { wallet: WalletInputNode, tx: TxNode, cell: CellFlowNode }

function capacityOrZero(capacity: string | undefined): bigint {
  try {
    return BigInt(capacity ?? '0')
  } catch {
    return BigInt(0)
  }
}

export function TransactionFlow() {
  const cells = useSandbox((s) => s.cells)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const wallet = useSandbox((s) => s.wallet)
  const hasOutputs = txOutputs.length > 0

  const totalOut = useMemo(
    () => txOutputs.reduce((sum, index) => sum + capacityOrZero(cells[index]?.capacity), BigInt(0)),
    [cells, txOutputs]
  )
  const outputIssues = useMemo(
    () => validateOutputCells(
      txOutputs.flatMap((index) => cells[index] ? [{ index, cell: cells[index] }] : [])
    ),
    [cells, txOutputs]
  )
  const walletWillFillIssues = !wallet.connected && outputIssues.length > 0 && outputIssues.every(
    (issue) => issue.includes('Connect a wallet to fill this lock script')
  )
  const reviewReady = hasOutputs && wallet.connected && outputIssues.length === 0
  const centerY = Math.max(50, (txOutputs.length - 1) * 90 + 50)

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = [{
      id: 'tx',
      type: 'tx',
      position: { x: 300, y: centerY },
      data: { totalOut: totalOut.toString(), hasOutputs },
      draggable: false,
    }]

    if (hasOutputs) {
      result.push({
        id: 'wallet-inputs',
        type: 'wallet',
        position: { x: 20, y: centerY + 20 },
        data: { connected: wallet.connected, walletName: wallet.walletName },
        draggable: false,
      })
    }

    txOutputs.forEach((cellIndex, outputIndex) => {
      result.push({
        id: `output-${cellIndex}`,
        type: 'cell',
        position: { x: 600, y: outputIndex * 180 + 30 },
        data: { cellIndex },
        draggable: false,
      })
    })

    return result
  }, [centerY, hasOutputs, totalOut, txOutputs, wallet.connected, wallet.walletName])

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    if (hasOutputs) {
      result.push({
        id: 'e-wallet-inputs',
        source: 'wallet-inputs',
        target: 'tx',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.65 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
      })
    }
    txOutputs.forEach((cellIndex) => {
      result.push({
        id: `e-output-${cellIndex}`,
        source: 'tx',
        target: `output-${cellIndex}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#22c55e', strokeWidth: 2, opacity: 0.65 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
      })
    })
    return result
  }, [hasOutputs, txOutputs])

  const statusText = !hasOutputs
    ? 'Add a designed Cell as an output, or choose a Build template.'
    : walletWillFillIssues
      ? 'Connect a wallet to fill the output lock and supply funding Cells.'
    : outputIssues.length > 0
      ? `${outputIssues.length} output issue${outputIssues.length === 1 ? '' : 's'} must be fixed before signing.`
      : !wallet.connected
        ? 'Outputs are selected. Connect a wallet to supply funding Cells.'
        : 'Ready to review. The wallet will calculate the fee and return change.'

  return (
    <div>
      <div className="border-b border-stone-800/80 bg-stone-950/20 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Build transaction</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">{statusText}</p>
          </div>
          <ol className="grid overflow-hidden rounded-lg border border-stone-800 sm:grid-cols-4 xl:min-w-[38rem]">
            <BuildStep number={1} label="Design" value={`${cells.length} Cell${cells.length === 1 ? '' : 's'}`} state={cells.length > 0 ? 'complete' : 'current'} />
            <BuildStep number={2} label="Outputs" value={hasOutputs ? `${txOutputs.length} selected` : 'None selected'} state={hasOutputs ? 'complete' : 'current'} />
            <BuildStep number={3} label="Wallet" value={wallet.connected ? wallet.walletName : 'Not connected'} state={wallet.connected ? 'complete' : hasOutputs ? 'current' : 'pending'} />
            <BuildStep
              number={4}
              label="Review"
              value={reviewReady ? 'Ready' : walletWillFillIssues ? 'Waiting for wallet' : outputIssues.length > 0 ? `${outputIssues.length} issue${outputIssues.length === 1 ? '' : 's'}` : 'Waiting'}
              state={reviewReady ? 'current' : outputIssues.length > 0 && !walletWillFillIssues ? 'warning' : 'pending'}
            />
          </ol>
        </div>
      </div>
      <div className="h-[260px] border-b border-stone-800/80 sm:h-[300px] lg:h-[320px] xl:h-[340px]">
        <ReactFlow
          key={`${txOutputs.join(',')}|${wallet.connected}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.5}
          maxZoom={2}
          preventScrolling={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          disableKeyboardA11y
        >
          <Background color="#292524" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="[&>button]:bg-stone-800/90 [&>button]:border-stone-600/50 [&>button]:text-stone-400 [&>button]:transition-colors [&>button]:hover:text-stone-200"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
