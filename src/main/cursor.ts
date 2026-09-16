import { screen } from 'electron'
import { IpcChannel } from '../shared/types'
import { broadcast } from './rooms'
import { noteActivity } from './economy'

const POLL_MS = 20

export function startCursorTracking(): NodeJS.Timeout {
  let lastPoint = screen.getCursorScreenPoint()
  return setInterval(() => {
    const point = screen.getCursorScreenPoint()
    if (point.x !== lastPoint.x || point.y !== lastPoint.y) noteActivity()
    lastPoint = point
    broadcast(IpcChannel.CursorMoved, point)
  }, POLL_MS)
}
