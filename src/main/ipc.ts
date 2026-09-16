import { app, ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../shared/types'
import type { BuyPetRequest, PetSnapshot } from '../shared/types'
import { upsertPets, buyPet, setPetScale, toggleActivePet, despawnPet } from './store'
import { broadcast } from './rooms'

export function registerIpcHandlers(): void {
  ipcMain.on(IpcChannel.SetIgnoreMouseEvents, (event, ignore: boolean) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.setIgnoreMouseEvents(ignore, { forward: true })
  })
  ipcMain.on(IpcChannel.UpsertPets, (_event, pets: PetSnapshot[]) => {
    upsertPets(pets)
  })
  ipcMain.on(IpcChannel.BuyPet, (event, request: BuyPetRequest) => {
    const result = buyPet(request.displayId, request.skin, request.x, request.y, request.quantity)
    event.sender.send(IpcChannel.BuyPetResult, result)
    if (result.ok && result.pets) {
      for (const pet of result.pets) broadcast(IpcChannel.SpawnPet, pet)
      broadcast(IpcChannel.MoneyUpdated, result.money)
    }
  })
  ipcMain.on(IpcChannel.SetPetScale, (_event, scale: number) => {
    broadcast(IpcChannel.PetScaleChanged, setPetScale(scale))
  })
  ipcMain.on(IpcChannel.ToggleActivePet, (_event, petId: string) => {
    const updated = toggleActivePet(petId)
    if (updated) broadcast(IpcChannel.PetUpdated, updated)
  })
  ipcMain.on(IpcChannel.RemovePet, (_event, petId: string) => {
    despawnPet(petId)
    broadcast(IpcChannel.DespawnPet, petId)
  })
  ipcMain.on(IpcChannel.QuitApp, () => {
    app.quit()
  })
}
