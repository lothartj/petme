import { useEffect, useRef } from 'react'
import {
  drawSleepingBag,
  SLEEPING_BAG_HEIGHT,
  SLEEPING_BAG_WIDTH
} from '../../pixel/drawSleepingBag'
import styles from './SleepingBag.module.css'

interface SleepingBagProps {
  x: number
  y: number
}

export function SleepingBag({ x, y }: SleepingBagProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    drawSleepingBag(ctx)
  }, [])
  return (
    <canvas
      ref={canvasRef}
      width={SLEEPING_BAG_WIDTH}
      height={SLEEPING_BAG_HEIGHT}
      className={styles.canvas}
      style={{ left: x - SLEEPING_BAG_WIDTH / 2, top: y - SLEEPING_BAG_HEIGHT }}
    />
  )
}
