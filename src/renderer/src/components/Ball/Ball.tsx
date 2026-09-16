import { BALL_SIZE } from '../../pixel/drawBall'
import styles from './Ball.module.css'

interface BallProps {
  x: number
  y: number
  spinning: boolean
}

export function Ball({ x, y, spinning }: BallProps): React.JSX.Element {
  return (
    <span
      className={styles.ball}
      style={{
        left: x - BALL_SIZE / 2,
        top: y - BALL_SIZE / 2,
        fontSize: BALL_SIZE,
        animationPlayState: spinning ? 'running' : 'paused'
      }}
    >
      ⚽
    </span>
  )
}
