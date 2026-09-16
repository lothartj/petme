import { useEffect, useRef } from 'react'

const CURIOUS_WINDOW_MS = 900

export function useKeystrokePulse(): React.RefObject<number> {
  const lastPulseAt = useRef(0)
  useEffect(() => {
    return window.petApi.onKeyPulse(() => {
      lastPulseAt.current = Date.now()
    })
  }, [])
  return lastPulseAt
}

export function isCurious(lastPulseAt: number): boolean {
  return Date.now() - lastPulseAt < CURIOUS_WINDOW_MS
}
