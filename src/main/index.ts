import { app, nativeImage, screen } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { openAllRooms } from './rooms'
import { registerIpcHandlers } from './ipc'
import { createTray } from './tray'
import { startCursorTracking } from './cursor'
import { startKeystrokeTracking } from './keyboard'
import { startEconomyTracking } from './economy'
import { ensureDefaultPet } from './store'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.petme.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  app.dock?.setIcon(nativeImage.createFromPath(join(__dirname, '../../resources/icon.png')))
  app.dock?.show()
  registerIpcHandlers()
  ensureDefaultPet(screen.getPrimaryDisplay().id)
  openAllRooms()
  createTray()
  const cursorTimer = startCursorTracking()
  const economyTimer = startEconomyTracking()
  startKeystrokeTracking()
  app.on('will-quit', () => {
    clearInterval(cursorTimer)
    clearInterval(economyTimer)
  })
})
