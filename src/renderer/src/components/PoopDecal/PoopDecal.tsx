import styles from './PoopDecal.module.css'

interface PoopDecalProps {
  x: number
  y: number
  onClean: () => void
}

export function PoopDecal({ x, y, onClean }: PoopDecalProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={styles.poop}
      style={{ left: x - 10, top: y - 10 }}
      onClick={onClean}
      title="Clean up"
    >
      💩
    </button>
  )
}
