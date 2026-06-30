import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Stroke centerline of the Homeown emblem (viewBox "0 0 126 175").
// Path runs: bottom-right corner → left across base → up left wall →
// over roof peak → down to right eave. Both ends are open (no right wall),
// which lets a draw-on animation start as a dot at the bottom-right and
// grow around the outline.
export function AnimatedEmblem({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    if (!path || !svg) return

    // Respect system preference — show completed emblem immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDashoffset = '0'
      return
    }

    // Trigger the draw animation only once the emblem enters the viewport
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        path.classList.add('animate-emblem-draw')
      },
      { threshold: 0.1 }
    )
    obs.observe(svg)
    return () => obs.disconnect()
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 126 175"
      fill="none"
      className={cn('text-brand-green', className)}
      aria-hidden="true"
    >
      {/*
        pathLength="1" normalises the path length so dasharray/dashoffset
        values are resolution-independent fractions of the total length.
        strokeDasharray="1" + strokeDashoffset="1" → path fully hidden.
        The animate-emblem-draw class animates dashoffset 1 → 0, revealing
        the path from position 0 (bottom-right corner) forward.
        strokeLinecap="round" makes the leading edge appear as a growing dot.
      */}
      <path
        ref={pathRef}
        d="M122.7 171.9 L3.4 171.9 L3.4 60 L65.7 3.1 L122.7 59.8"
        stroke="currentColor"
        strokeWidth="6.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
      />
    </svg>
  )
}
