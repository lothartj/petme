import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { IpcChannel } from '../shared/types'
import type { RoomInit } from '../shared/types'
import { loadState } from './store'

const windowsByDisplay = new Map<number, BrowserWindow>()

function createRoomWindow(display: Electron.Display): BrowserWindow {
  const { x, y, width, height } = display.bounds
  const window = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  window.setAlwaysOnTop(true, 'screen-saver')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  window.setIgnoreMouseEvents(true, { forward: true })
  const groundInset = Math.max(
    30,
    display.bounds.y + display.bounds.height - (display.workArea.y + display.workArea.height)
  )
  const init: RoomInit = {
    displayId: display.id,
    bounds: display.bounds,
    groundInset,
    state: loadState()
  }
  window.webContents.once('did-finish-load', () => {
    window.webContents.send(IpcChannel.GetInitialState, init)
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?displayId=${display.id}`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { displayId: String(display.id) }
    })
  }
  return window
}

export function openAllRooms(): void {
  for (const display of screen.getAllDisplays()) {
    if (windowsByDisplay.has(display.id)) continue
    windowsByDisplay.set(display.id, createRoomWindow(display))
  }
  screen.on('display-added', (_event, display) => {
    windowsByDisplay.set(display.id, createRoomWindow(display))
  })
  screen.on('display-removed', (_event, display) => {
    windowsByDisplay.get(display.id)?.destroy()
    windowsByDisplay.delete(display.id)
  })
}

export function getRoomWindows(): BrowserWindow[] {
  return [...windowsByDisplay.values()]
}

export function getPrimaryRoomWindow(): BrowserWindow | undefined {
  const primaryId = screen.getPrimaryDisplay().id
  return windowsByDisplay.get(primaryId) ?? getRoomWindows()[0]
}

export function broadcast(channel: string, ...args: unknown[]): void {
  for (const window of getRoomWindows()) {
    window.webContents.send(channel, ...args)
  }
}
