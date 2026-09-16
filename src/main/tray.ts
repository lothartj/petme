import { Tray, Menu, nativeImage, app, screen } from 'electron'
import { join } from 'node:path'
import { IpcChannel } from '../shared/types'
import type { PetSpecies } from '../shared/types'
import { toggleMute, spawnPet, despawnPet, loadState } from './store'
import { getPrimaryRoomWindow, broadcast } from './rooms'

let tray: Tray | null = null
let selectedSpecies: PetSpecies = 'dog'

function spawnOnPrimary(): void {
  const window = getPrimaryRoomWindow()
  if (!window) return
  const [width, height] = window.getSize()
  const displayId = screen.getPrimaryDisplay().id
  const pet = spawnPet(displayId, selectedSpecies, width / 2, height - 40)
  window.webContents.send(IpcChannel.SpawnPet, pet)
}

function despawnLatest(): void {
  const state = loadState()
  const last = state.pets.at(-1)
  if (!last) return
  despawnPet(last.id)
  broadcast(IpcChannel.DespawnPet, last.id)
}

function buildMenu(): Menu {
  const state = loadState()
  return Menu.buildFromTemplate([
    { label: `Pets on screen: ${state.pets.length}`, enabled: false },
    { type: 'separator' },
    { label: 'Spawn Pet', click: spawnOnPrimary },
    { label: 'Despawn Last Pet', click: despawnLatest, enabled: state.pets.length > 0 },
    { type: 'separator' },
    {
      label: 'Species',
      submenu: [
        {
          label: 'Dog',
          type: 'radio',
          checked: selectedSpecies === 'dog',
          click: () => (selectedSpecies = 'dog')
        },
        {
          label: 'Cat',
          type: 'radio',
          checked: selectedSpecies === 'cat',
          click: () => (selectedSpecies = 'cat')
        }
      ]
    },
    {
      label: 'Muted',
      type: 'checkbox',
      checked: state.settings.muted,
      click: () => broadcast(IpcChannel.ToggleMute, toggleMute())
    },
    { type: 'separator' },
    { label: 'Quit petme', click: () => app.quit() }
  ])
}

export function createTray(): Tray {
  const icon = nativeImage
    .createFromPath(join(__dirname, '../../resources/icon.png'))
    .resize({ width: 18, height: 18 })
  tray = new Tray(icon)
  tray.setToolTip('petme')
  tray.setContextMenu(buildMenu())
  tray.on('click', () => tray?.setContextMenu(buildMenu()))
  return tray
}
