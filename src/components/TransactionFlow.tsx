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

function TxNode({ data }: NodeProps) {
  const totalIn = Number(data.totalIn ?? 0)
  const totalOut = Number(data.totalOut ?? 0)
  const balance = totalIn - totalOut
  const fee = balance > 0 ? Math.min(balance, 0.001 * 1e8) : 0
  const change = balance - fee

  return (
    <div className="bg-stone-800/90 border border-stone-600/50 rounded-xl px-5 py-4 shadow-lg min-w-[180px] backdrop-blur-sm">
      <div className="text-[10px] font-semibold text-stone-500 mb-3 uppercase tracking-widest">
        Transaction
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-stone-300">
          <span>Inputs</span>
          <span className="font-mono">{formatCapacity(totalIn)}</span>
        </div>
        <div className="flex justify-between text-stone-300">
          <span>Outputs</span>
          <span className="font-mono">{formatCapacity(totalOut)}</span>
        </div>
        <div className="border-t border-stone-700/50 my-1.5" />
        <div className="flex justify-between text-stone-300">
          <span>Balance</span>
          <span className={`font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}{formatCapacity(balance)}
          </span>
        </div>
        {balance > 0 && (
          <>
            <div className="flex justify-between text-stone-300">
              <span>Fee (est.)</span>
              <span className="font-mono text-amber-400/80">{formatCapacity(fee)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-stone-300">
                <span>Change</span>
                <span className="font-mono text-blue-400">{formatCapacity(change)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CellFlowNode({ data }: NodeProps) {
  const index = data.cellIndex as number
  const role = data.role as string
  const isInput = role === 'input'

  return (
    <div className="flex flex-col items-center gap-2">
      {isInput ? (
        <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-stone-900" />
      ) : (
        <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-stone-900" />
      )}
      <div className="bg-stone-800/40 border border-stone-700/30 rounded-xl p-2.5 shadow-lg backdrop-blur-sm">
        <CellView index={index} compact />
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
            isInput
              ? 'bg-blue-900/20 text-blue-400 border border-blue-800/20'
              : 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/20'
          }`}
        >
          {role}
        </span>
        <span className="text-[10px] text-stone-500 font-mono">#{index}</span>
      </div>
    </div>
  )
}

const nodeTypes = { tx: TxNode, cell: CellFlowNode }

export function TransactionFlow() {
  const cells = useSandbox((s) => s.cells)
  const txInputs = useSandbox((s) => s.txInputs)
  const txOutputs = useSandbox((s) => s.txOutputs)

  const totalIn = useMemo(
    () => txInputs.reduce((sum, i) => sum + BigInt(cells[i]?.capacity ?? 0), BigInt(0)),
    [cells, txInputs]
  )
  const totalOut = useMemo(
    () => txOutputs.reduce((sum, i) => sum + BigInt(cells[i]?.capacity ?? 0), BigInt(0)),
    [cells, txOutputs]
  )

  const getN = (i: number) => i * 180

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = []
    result.push({
      id: 'tx',
      type: 'tx',
      position: { x: 280, y: Math.max(getN(txInputs.length), getN(txOutputs.length)) / 2 - 40 },
      data: { totalIn: totalIn.toString(), totalOut: totalOut.toString() },
      draggable: false,
    })

    txInputs.forEach((ci, i) => {
      result.push({
        id: `input-${ci}`,
        type: 'cell',
        position: { x: 0, y: getN(i) + 30 },
        data: { cellIndex: ci, role: 'input' },
        draggable: false,
      })
    })

    txOutputs.forEach((ci, i) => {
      result.push({
        id: `output-${ci}`,
        type: 'cell',
        position: { x: 560, y: getN(i) + 30 },
        data: { cellIndex: ci, role: 'output' },
        draggable: false,
      })
    })

    return result
  }, [txInputs, txOutputs, totalIn, totalOut])

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    txInputs.forEach((ci) => {
      result.push({
        id: `e-input-${ci}`,
        source: `input-${ci}`,
        target: 'tx',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
      })
    })
    txOutputs.forEach((ci) => {
      result.push({
        id: `e-output-${ci}`,
        source: 'tx',
        target: `output-${ci}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#22c55e', strokeWidth: 2, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
      })
    })
    return result
  }, [txInputs, txOutputs])

  return (
    <div>
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-stone-800/80 bg-stone-950/20">
        <p className="text-xs text-stone-500">Assign cells as inputs/outputs from the cell builder</p>
        <div className="flex gap-3 text-xs font-mono shrink-0">
          <span className="text-blue-400">{txInputs.length} input{txInputs.length !== 1 && 's'}</span>
          <span className="text-emerald-400">{txOutputs.length} output{txOutputs.length !== 1 && 's'}</span>
        </div>
      </div>
      <div style={{ height: 400 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.5}
          maxZoom={2}
          panOnDrag={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background color="#292524" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="[&>button]:bg-stone-800/90 [&>button]:border-stone-600/50 [&>button]:text-stone-400 [&>button]:hover:text-stone-200 [&>button]:transition-colors"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
