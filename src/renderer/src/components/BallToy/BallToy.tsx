import { useEffect, useRef } from 'react'
import { BALL_SIZE } from '../../pixel/drawBall'
import styles from './BallToy.module.css'

const HIT_SIZE = 60

interface BallToyProps {
  x: number
  y: number
  onStartDrag: (x: number, y: number) => void
  onDragTo: (x: number, y: number) => void
  onDrop: () => void
  onRegisterHitRect: (
    id: string,
    rect: { x: number; y: number; width: number; height: number } | null
  ) => void
}

export function BallToy({
  x,
  y,
  onStartDrag,
  onDragTo,
  onDrop,
  onRegisterHitRect
}: BallToyProps): React.JSX.Element {
  const draggingRef = useRef(false)
  const left = x - HIT_SIZE / 2
  const top = y - HIT_SIZE / 2
  useEffect(() => {
    onRegisterHitRect('ballToy', { x: left, y: top, width: HIT_SIZE, height: HIT_SIZE })
    return () => onRegisterHitRect('ballToy', null)
  }, [left, top, onRegisterHitRect])
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    onStartDrag(event.clientX, event.clientY)
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) return
    onDragTo(event.clientX, event.clientY)
  }
  const finishThrow = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) return
    draggingRef.current = false
    onDrop()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }
  return (
    <div
      className={styles.hitArea}
      style={{ left, top }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishThrow}
      onPointerCancel={finishThrow}
      title="Grab and throw the ball"
    >
      <span className={styles.ball} style={{ fontSize: BALL_SIZE }}>
        ⚽
      </span>
    </div>
  )
}
