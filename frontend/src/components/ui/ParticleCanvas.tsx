'use client'
import { useEffect, useRef } from 'react'

interface Props {
  colors?: string[]
  count?: number
}

export function ParticleCanvas({ colors = ['#2bd2ff', '#2bff88'], count = 35 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: {
      x: number; y: number; r: number; dx: number; dy: number; color: string; opacity: number; dOpacity: number
    }[] = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       Math.random() * 2 + 0.5,
        dx:      (Math.random() - 0.5) * 0.4,
        dy:      (Math.random() - 0.5) * 0.4,
        color:   colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.1,
        dOpacity:(Math.random() - 0.5) * 0.005,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        p.opacity += p.dOpacity
        if (p.opacity <= 0.05 || p.opacity >= 0.65) p.dOpacity *= -1
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [colors, count])

  return <canvas ref={canvasRef} className="particles-canvas" />
}
