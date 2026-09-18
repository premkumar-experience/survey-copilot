'use client'

/**
 * Circular Survey Health score (§25). Colour and label follow the grade the
 * backend computed from actual issues — never randomised.
 */

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import type { HealthGrade } from '@/types/ai'

const GRADE_STYLE: Record<HealthGrade, { stroke: string; text: string }> = {
  excellent: { stroke: 'var(--success)', text: 'text-success' },
  good: { stroke: 'var(--brand-bright)', text: 'text-brand-bright' },
  fair: { stroke: 'var(--warning)', text: 'text-warning' },
  poor: { stroke: 'var(--critical)', text: 'text-critical' }
}

export function HealthDial({
  score,
  grade,
  size = 96
}: {
  score: number
  grade: HealthGrade
  size?: number
}) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const style = GRADE_STYLE[grade]

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Survey health ${score} out of 100, ${grade}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={style.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference * (1 - score / 100)
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight">{score}</span>
        <span className={cn('text-[10px] font-semibold uppercase', style.text)}>
          {grade}
        </span>
      </div>
    </div>
  )
}
