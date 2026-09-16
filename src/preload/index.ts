import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '../shared/types'
import type {
  BuyPetRequest,
  BuyPetResult,
  CursorPoint,
  PetSnapshot,
  RoomInit
} from '../shared/types'

const petApi = {
  onRoomInit: (callback: (init: RoomInit) => void): (() => void) => {
    const listener = (_event: unknown, init: RoomInit): void => callback(init)
    ipcRenderer.on(IpcChannel.GetInitialState, listener)
    return () => ipcRenderer.removeListener(IpcChannel.GetInitialState, listener)
  },
  onCursorMoved: (callback: (point: CursorPoint) => void): (() => void) => {
    const listener = (_event: unknown, point: CursorPoint): void => callback(point)
    ipcRenderer.on(IpcChannel.CursorMoved, listener)
    return () => ipcRenderer.removeListener(IpcChannel.CursorMoved, listener)
  },
  onKeyPulse: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on(IpcChannel.KeyPulse, listener)
    return () => ipcRenderer.removeListener(IpcChannel.KeyPulse, listener)
  },
  onSpawnPet: (callback: (pet: PetSnapshot) => void): (() => void) => {
    const listener = (_event: unknown, pet: PetSnapshot): void => callback(pet)
    ipcRenderer.on(IpcChannel.SpawnPet, listener)
    return () => ipcRenderer.removeListener(IpcChannel.SpawnPet, listener)
  },
  onDespawnPet: (callback: (petId: string) => void): (() => void) => {
    const listener = (_event: unknown, petId: string): void => callback(petId)
    ipcRenderer.on(IpcChannel.DespawnPet, listener)
    return () => ipcRenderer.removeListener(IpcChannel.DespawnPet, listener)
  },
  onPetUpdated: (callback: (pet: PetSnapshot) => void): (() => void) => {
    const listener = (_event: unknown, pet: PetSnapshot): void => callback(pet)
    ipcRenderer.on(IpcChannel.PetUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.PetUpdated, listener)
  },
  onToggleMute: (callback: (muted: boolean) => void): (() => void) => {
    const listener = (_event: unknown, muted: boolean): void => callback(muted)
    ipcRenderer.on(IpcChannel.ToggleMute, listener)
    return () => ipcRenderer.removeListener(IpcChannel.ToggleMute, listener)
  },
  onMoneyUpdated: (callback: (money: number) => void): (() => void) => {
    const listener = (_event: unknown, money: number): void => callback(money)
    ipcRenderer.on(IpcChannel.MoneyUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.MoneyUpdated, listener)
  },
  onBuyPetResult: (callback: (result: BuyPetResult) => void): (() => void) => {
    const listener = (_event: unknown, result: BuyPetResult): void => callback(result)
    ipcRenderer.on(IpcChannel.BuyPetResult, listener)
    return () => ipcRenderer.removeListener(IpcChannel.BuyPetResult, listener)
  },
  onPetScaleChanged: (callback: (scale: number) => void): (() => void) => {
    const listener = (_event: unknown, scale: number): void => callback(scale)
    ipcRenderer.on(IpcChannel.PetScaleChanged, listener)
    return () => ipcRenderer.removeListener(IpcChannel.PetScaleChanged, listener)
  },
  setIgnoreMouseEvents: (ignore: boolean): void => {
    ipcRenderer.send(IpcChannel.SetIgnoreMouseEvents, ignore)
  },
  upsertPets: (pets: PetSnapshot[]): void => {
    ipcRenderer.send(IpcChannel.UpsertPets, pets)
  },
  buyPet: (request: BuyPetRequest): void => {
    ipcRenderer.send(IpcChannel.BuyPet, request)
  },
  setPetScale: (scale: number): void => {
    ipcRenderer.send(IpcChannel.SetPetScale, scale)
  },
  toggleActivePet: (petId: string): void => {
    ipcRenderer.send(IpcChannel.ToggleActivePet, petId)
  },
  removePet: (petId: string): void => {
    ipcRenderer.send(IpcChannel.RemovePet, petId)
  },
  quitApp: (): void => {
    ipcRenderer.send(IpcChannel.QuitApp)
  }
}

contextBridge.exposeInMainWorld('petApi', petApi)

export type PetApi = typeof petApi
