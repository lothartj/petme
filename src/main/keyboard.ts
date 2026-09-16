import { IpcChannel } from '../shared/types'
import { broadcast } from './rooms'
import { noteActivity } from './economy'

export async function startKeystrokeTracking(): Promise<void> {
  try {
    const { uIOhook } = await import('uiohook-napi')
    uIOhook.on('keydown', () => {
      noteActivity()
      broadcast(IpcChannel.KeyPulse)
    })
    uIOhook.start()
  } catch (error) {
    console.warn('petme: keystroke tracking disabled', error)
  }
}
