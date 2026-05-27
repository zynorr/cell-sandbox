'use client'

import { useSandbox } from '@/store/sandbox'
import { getScriptColor, formatCapacity } from '@/lib/ccc'

export function CellView({ index, compact }: { index: number; compact?: boolean }) {
  const cell = useSandbox((s) => s.cells[index])
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const setSelectedIndex = useSandbox((s) => s.setSelectedIndex)

  if (!cell) return null

  const isSelected = selectedIndex === index
  const outerColor = cell.lock.codeHash ? getScriptColor(cell.lock) : '#44403c'
  const innerColor = cell.type?.codeHash ? getScriptColor(cell.type) : undefined
  const dataLen = cell.data ? Math.max(0, (cell.data.length - 2) / 2) : 0

  const size = compact ? 120 : 172
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.40
  const innerR = size * 0.30
  const centerR = size * 0.19

  return (
    <div
      className={`relative cursor-pointer transition-all duration-300 select-none ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      }`}
      style={{ width: size, height: size + (compact ? 0 : 4) }}
      onClick={() => setSelectedIndex(index)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={size / 2 - 1}
            fill="none"
            stroke="rgba(59, 130, 246, 0.25)"
            strokeWidth={2}
          />
        )}

        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill={isSelected ? `${outerColor}10` : 'none'}
          stroke={outerColor}
          strokeWidth={compact ? 3 : 4}
          opacity={isSelected ? 1 : 0.75}
          filter={isSelected ? `url(#glow-${index})` : undefined}
        />

        {cell.lock.codeHash && (
          <text
            x={cx}
            y={cy - outerR - (compact ? 5 : 7)}
            textAnchor="middle"
            fill={outerColor}
            fontSize={compact ? 7 : 9}
            fontWeight={600}
            opacity={0.8}
          >
            LOCK
          </text>
        )}

        {cell.type && innerColor && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              fill={isSelected ? `${innerColor}15` : 'none'}
              stroke={innerColor}
              strokeWidth={compact ? 2 : 3}
              opacity={isSelected ? 1 : 0.7}
              filter={isSelected ? `url(#glow-${index})` : undefined}
            />
            <text
              x={cx}
              y={cy - innerR - (compact ? 2 : 3)}
              textAnchor="middle"
              fill={innerColor}
              fontSize={compact ? 6 : 8}
              fontWeight={600}
              opacity={0.8}
            >
              TYPE
            </text>
          </>
        )}

        <circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill={outerColor}
          opacity={0.08}
        />

        <text
          x={cx}
          y={cy - (compact ? 3 : 4)}
          textAnchor="middle"
          fill={isSelected ? '#f5f5f4' : '#d6d3d1'}
          fontSize={compact ? 9 : 12}
          fontWeight={700}
          fontFamily="var(--font-mono, monospace)"
        >
          {formatCapacity(cell.capacity)}
        </text>

        {dataLen > 0 && (
          <text
            x={cx}
            y={cy + (compact ? 8 : 10)}
            textAnchor="middle"
            fill="#a8a29e"
            fontSize={compact ? 6 : 8}
          >
            {dataLen} bytes
          </text>
        )}

        {cell.outPoint && (
          <text
            x={cx}
            y={cy + outerR + (compact ? 7 : 9)}
            textAnchor="middle"
            fill="#57534e"
            fontSize={compact ? 5 : 7}
            fontFamily="var(--font-mono, monospace)"
          >
            {`${cell.outPoint.txHash.slice(0, 8)}…:${cell.outPoint.index}`}
          </text>
        )}
      </svg>

      <div className="absolute -top-1 -right-1 flex gap-0.5">
        {cell.lock.codeHash && (
          <span
            className="w-2 h-2 rounded-full border border-stone-900/50"
            style={{ backgroundColor: outerColor }}
          />
        )}
        {cell.type && innerColor && (
          <span
            className="w-2 h-2 rounded-full border border-stone-900/50"
            style={{ backgroundColor: innerColor }}
          />
        )}
      </div>
    </div>
  )
}
