import { useEffect, useRef, useState } from 'react'
import type { PetSnapshot } from '../../../../shared/types'
import { drawPet, PET_HEIGHT, PET_WIDTH } from '../../pixel/drawPet'
import styles from './Pet.module.css'

interface PetProps {
  pet: PetSnapshot
  alert: boolean
  scale: number
  onPet: () => void
}

interface Heart {
  id: number
  offsetX: number
  delayMs: number
}

let nextHeartId = 0

export function Pet({ pet, alert, scale, onPet }: PetProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef({ pet, alert })
  const [hearts, setHearts] = useState<Heart[]>([])
  useEffect(() => {
    latest.current = { pet, alert }
  }, [pet, alert])
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const loop = (): void => {
      frame += 1
      const { pet: p, alert: a } = latest.current
      ctx.imageSmoothingEnabled = false
      drawPet(ctx, {
        species: p.species,
        skin: p.skin,
        activity: p.activity,
        facing: p.facing,
        verticalFacing: p.verticalFacing,
        frame,
        alert: a,
        care: p.care,
        weight: p.weight,
        hairLength: p.hairLength,
        hasCollar: p.hasCollar,
        hasShirt: p.hasShirt
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  const handleClick = (): void => {
    const burst = Array.from({ length: 5 }, () => ({
      id: nextHeartId++,
      offsetX: Math.round((Math.random() - 0.5) * 60),
      delayMs: Math.round(Math.random() * 150)
    }))
    setHearts((current) => [...current, ...burst])
    onPet()
  }
  const removeHeart = (id: number): void => {
    setHearts((current) => current.filter((heart) => heart.id !== id))
  }
  return (
    <div
      className={styles.wrapper}
      style={{ left: pet.x - PET_WIDTH / 2, top: pet.y - PET_HEIGHT }}
    >
      <canvas
        ref={canvasRef}
        width={PET_WIDTH}
        height={PET_HEIGHT}
        className={styles.canvas}
        style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
        onClick={handleClick}
      />
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={styles.heart}
          style={{ left: `calc(50% + ${heart.offsetX}px)`, animationDelay: `${heart.delayMs}ms` }}
          onAnimationEnd={() => removeHeart(heart.id)}
        >
          ❤
        </span>
      ))}
    </div>
  )
}
