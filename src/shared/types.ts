export const IpcChannel = {
  CursorMoved: 'petme:cursor-moved',
  KeyPulse: 'petme:key-pulse',
  SetIgnoreMouseEvents: 'petme:set-ignore-mouse-events',
  GetInitialState: 'petme:get-initial-state',
  UpsertPets: 'petme:upsert-pets',
  SpawnPet: 'petme:spawn-pet',
  DespawnPet: 'petme:despawn-pet',
  PetUpdated: 'petme:pet-updated',
  ToggleMute: 'petme:toggle-mute',
  MoneyUpdated: 'petme:money-updated',
  BuyPet: 'petme:buy-pet',
  BuyPetResult: 'petme:buy-pet-result',
  SetPetScale: 'petme:set-pet-scale',
  PetScaleChanged: 'petme:pet-scale-changed',
  ToggleActivePet: 'petme:toggle-active-pet',
  RemovePet: 'petme:remove-pet',
  QuitApp: 'petme:quit-app'
} as const

export type PetSpecies = 'dog' | 'cat'

export type PetSkinId =
  | 'corgi'
  | 'mimi'
  | 'frankie'
  | 'sunny-retriever'
  | 'wally'
  | 'zichao-xiong'
  | 'toothless'
  | 'inosuke'
  | 'chispa'
  | 'kaiju-no-8'
  | 'tanjiro'
  | 'cockroach'

export type PetMood = 'happy' | 'content' | 'sad'

export type PetActivity =
  'idle' | 'walk' | 'follow' | 'eat' | 'poop' | 'sleep' | 'fetch' | 'petted' | 'jump' | 'review'

export interface PetOffer {
  id: PetSkinId
  species: PetSpecies
  label: string
  price: number
  tagline: string
}

export const PET_OFFERS: PetOffer[] = [
  { id: 'corgi', species: 'dog', label: 'Corgi', price: 180, tagline: 'Happy ball hunter' },
  { id: 'mimi', species: 'cat', label: 'Mimi', price: 180, tagline: 'Curious tabby cat' },
  { id: 'frankie', species: 'dog', label: 'Frankie', price: 220, tagline: 'Tiny brave dachshund' },
  {
    id: 'sunny-retriever',
    species: 'dog',
    label: 'Sunny',
    price: 240,
    tagline: 'Golden retriever energy'
  },
  { id: 'wally', species: 'dog', label: 'Wally', price: 260, tagline: 'Helpful little buddy' },
  {
    id: 'zichao-xiong',
    species: 'dog',
    label: 'Zichao Bear',
    price: 260,
    tagline: 'Soft and unbothered'
  },
  { id: 'toothless', species: 'dog', label: 'Toothless', price: 300, tagline: 'Night Fury friend' },
  { id: 'inosuke', species: 'dog', label: 'Inosuke', price: 300, tagline: 'Wild boar warrior' },
  { id: 'chispa', species: 'dog', label: 'Chispa', price: 280, tagline: 'Pocket-sized robot' },
  {
    id: 'kaiju-no-8',
    species: 'dog',
    label: 'Kaiju No. 8',
    price: 320,
    tagline: 'Monster-sized attitude'
  },
  { id: 'tanjiro', species: 'dog', label: 'Tanjiro', price: 300, tagline: 'Kind-hearted fighter' },
  {
    id: 'cockroach',
    species: 'dog',
    label: 'Cockroach',
    price: 120,
    tagline: 'Crawls absolutely anywhere'
  }
]

export interface PetSnapshot {
  id: string
  species: PetSpecies
  skin?: PetSkinId
  displayId: number
  x: number
  y: number
  facing: 1 | -1
  verticalFacing?: 1 | -1
  activity: PetActivity
  care: number
  hunger: number
  hairLength: number
  weight: number
  hasCollar: boolean
  hasShirt: boolean
  hasSleepingBag: boolean
  active: boolean
  lastTick: number
}

export interface AppSettings {
  muted: boolean
  petScale: number
}

export interface Economy {
  money: number
}

export interface PersistedState {
  pets: PetSnapshot[]
  settings: AppSettings
  economy: Economy
}

export interface CursorPoint {
  x: number
  y: number
}

export interface RoomInit {
  displayId: number
  bounds: { x: number; y: number; width: number; height: number }
  groundInset: number
  state: PersistedState
}

export interface BuyPetRequest {
  skin: PetSkinId
  displayId: number
  x: number
  y: number
  quantity: number
}

export interface BuyPetResult {
  ok: boolean
  reason?: string
  pets?: PetSnapshot[]
  money: number
}
