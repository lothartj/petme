import Store from 'electron-store'
import { randomUUID } from 'node:crypto'
import type {
  BuyPetResult,
  PersistedState,
  PetSkinId,
  PetSnapshot,
  PetSpecies
} from '../shared/types'
import { PET_OFFERS } from '../shared/types'

const CARE_DECAY_PER_MIN = 1.2
const HUNGER_GAIN_PER_MIN = 1.5
const HAIR_GROWTH_PER_MIN = 0.4

const defaults: PersistedState = {
  pets: [],
  settings: { muted: false, petScale: 1 },
  economy: { money: 0 }
}

const store = new Store<PersistedState>({ defaults })

function applyDecay(pet: PetSnapshot, now: number): PetSnapshot {
  const minutesElapsed = Math.max(0, (now - pet.lastTick) / 60_000)
  const wellFed = pet.hunger < 40
  return {
    ...pet,
    care: Math.max(0, pet.care - CARE_DECAY_PER_MIN * minutesElapsed),
    hunger: Math.min(100, pet.hunger + HUNGER_GAIN_PER_MIN * minutesElapsed),
    hairLength: Math.min(100, pet.hairLength + HAIR_GROWTH_PER_MIN * minutesElapsed),
    weight: wellFed
      ? Math.min(100, pet.weight + 0.1 * minutesElapsed)
      : Math.max(0, pet.weight - 0.05 * minutesElapsed),
    lastTick: now
  }
}

export function loadState(): PersistedState {
  const now = Date.now()
  const state = store.store
  state.pets = state.pets.map((pet) =>
    applyDecay(pet.active === undefined ? { ...pet, active: true } : pet, now)
  )
  store.set('pets', state.pets)
  if (state.settings.petScale === undefined) {
    state.settings = { ...state.settings, petScale: 1 }
    store.set('settings', state.settings)
  }
  return state
}

export function upsertPets(updates: PetSnapshot[]): void {
  const byId = new Map(store.get('pets').map((pet) => [pet.id, pet]))
  for (const pet of updates) byId.set(pet.id, pet)
  store.set('pets', [...byId.values()])
}

export function spawnPet(
  displayId: number,
  species: PetSpecies,
  x: number,
  y: number,
  skin?: PetSkinId,
  active = false
): PetSnapshot {
  const pet: PetSnapshot = {
    id: randomUUID(),
    species,
    skin,
    displayId,
    x,
    y,
    facing: 1,
    activity: 'idle',
    care: 100,
    hunger: 0,
    hairLength: 20,
    weight: 50,
    hasCollar: false,
    hasShirt: false,
    hasSleepingBag: false,
    active,
    lastTick: Date.now()
  }
  const pets = [...store.get('pets'), pet]
  store.set('pets', pets)
  return pet
}

export function ensureDefaultPet(displayId: number): void {
  if (store.get('pets').length > 0) return
  spawnPet(displayId, 'dog', 200, 0, undefined, true)
}

export function despawnPet(petId: string): void {
  store.set(
    'pets',
    store.get('pets').filter((pet) => pet.id !== petId)
  )
}

export function toggleActivePet(petId: string): PetSnapshot | undefined {
  const pet = store.get('pets').find((candidate) => candidate.id === petId)
  if (!pet) return undefined
  const updated = { ...pet, active: !pet.active }
  upsertPets([updated])
  return updated
}

export function toggleMute(): boolean {
  const muted = !store.get('settings').muted
  store.set('settings', { ...store.get('settings'), muted })
  return muted
}

export function setPetScale(scale: number): number {
  const clamped = Math.round(Math.max(0.5, Math.min(2, scale)) * 100) / 100
  store.set('settings', { ...store.get('settings'), petScale: clamped })
  return clamped
}

export function getMoney(): number {
  return store.get('economy').money
}

export function addMoney(delta: number): number {
  const money = Math.round((getMoney() + delta) * 100) / 100
  store.set('economy', { money })
  return money
}

export function buyPet(
  displayId: number,
  skin: PetSkinId,
  x: number,
  y: number,
  quantity: number
): BuyPetResult {
  const offer = PET_OFFERS.find((candidate) => candidate.id === skin)
  const money = getMoney()
  if (!offer) return { ok: false, reason: 'Pet not found', money }
  const totalCost = offer.price * quantity
  if (money < totalCost) return { ok: false, reason: 'Not enough coins', money }
  const pets = Array.from({ length: quantity }, (_unused, index) =>
    spawnPet(displayId, offer.species, x, y, skin, index === 0)
  )
  const remaining = addMoney(-totalCost)
  return { ok: true, pets, money: remaining }
}
