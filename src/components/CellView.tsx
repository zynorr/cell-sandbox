'use client'

import { useSandbox } from '@/store/sandbox'
import { formatCapacity } from '@/lib/ccc'

export function CellView({ index, compact }: { index: number; compact?: boolean }) {
  const cell = useSandbox((s) => s.cells[index])
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const setSelectedIndex = useSandbox((s) => s.setSelectedIndex)

  if (!cell) return null

  const isSelected = selectedIndex === index
  const lockColor = cell.lock.codeHash ? '#60a5fa' : '#57534e'
  const typeColor = cell.type?.codeHash ? '#fbbf24' : undefined
  const dataLen = cell.data ? Math.max(0, (cell.data.length - 2) / 2) : 0

  const size = compact ? 120 : 172
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.40
  const innerR = size * 0.30
  const centerR = size * 0.19

  return (
    <div
      className={`relative cursor-pointer select-none rounded-md transition-colors ${
        isSelected ? 'bg-white/[0.035]' : 'hover:bg-white/[0.02]'
      }`}
      style={{ width: size, height: size + (compact ? 0 : 4) }}
      onClick={() => setSelectedIndex(index)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelectedIndex(index)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select Cell #${index}`}
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
            stroke="rgba(231, 229, 228, 0.3)"
            strokeWidth={2}
          />
        )}

        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill={isSelected ? 'rgba(96, 165, 250, 0.05)' : 'none'}
          stroke={lockColor}
          strokeWidth={compact ? 3 : 4}
          opacity={isSelected ? 1 : 0.75}
          filter={isSelected ? `url(#glow-${index})` : undefined}
        />

        {cell.lock.codeHash && (
          <text
            x={cx}
            y={cy - outerR - (compact ? 5 : 7)}
            textAnchor="middle"
              fill={lockColor}
            fontSize={compact ? 7 : 9}
            fontWeight={600}
            opacity={0.8}
          >
            LOCK
          </text>
        )}

        {cell.type && typeColor && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              fill={isSelected ? 'rgba(251, 191, 36, 0.06)' : 'none'}
              stroke={typeColor}
              strokeWidth={compact ? 2 : 3}
              opacity={isSelected ? 1 : 0.7}
              filter={isSelected ? `url(#glow-${index})` : undefined}
            />
            <text
              x={cx}
              y={cy - innerR - (compact ? 2 : 3)}
              textAnchor="middle"
              fill={typeColor}
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
          fill="#34d399"
          opacity={dataLen > 0 ? 0.16 : 0.06}
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
            title="Lock script"
            style={{ backgroundColor: lockColor }}
          />
        )}
        {cell.type && typeColor && (
          <span
            className="w-2 h-2 rounded-full border border-stone-900/50"
            title="Type script"
            style={{ backgroundColor: typeColor }}
          />
        )}
      </div>
    </div>
  )
}
