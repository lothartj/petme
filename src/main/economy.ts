import { IpcChannel } from '../shared/types'
import { addMoney } from './store'
import { broadcast } from './rooms'

const ACTIVE_WINDOW_MS = 3000
const TICK_MS = 1000

const MONEY_PER_TICK = 0.01

let lastActivityAt = Date.now()

export function noteActivity(): void {
  lastActivityAt = Date.now()
}

export function startEconomyTracking(): NodeJS.Timeout {
  return setInterval(() => {
    if (Date.now() - lastActivityAt > ACTIVE_WINDOW_MS) return
    broadcast(IpcChannel.MoneyUpdated, addMoney(MONEY_PER_TICK))
  }, TICK_MS)
}
