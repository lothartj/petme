import type { PetSnapshot } from '../../../shared/types'

const CARE_DECAY_PER_MS = 1.2 / 60_000
const HUNGER_GAIN_PER_MS = 1.5 / 60_000
const WALK_SPEED_PX_MS = 0.045
const FETCH_SPEED_PX_MS = 0.07
const SAD_SPEED_FACTOR = 0.55
const FETCH_DISTANCE_PX = 14
const BASE_POOP_CHANCE_PER_MS = 0.02 / 60_000

export interface PetTickInput {
  pet: PetSnapshot
  dtMs: number
  screenWidth: number
  screenHeight: number
  groundY: number
  ballX: number | null
  ballY: number | null
  ballCatchable: boolean
}

export interface PetTickResult {
  pet: PetSnapshot
  didPoop: boolean
  fetchedBall: boolean
}

export function moodOf(pet: PetSnapshot): 'happy' | 'content' | 'sad' {
  if (pet.care > 66) return 'happy'
  if (pet.care > 33) return 'content'
  return 'sad'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function tickPet(input: PetTickInput): PetTickResult {
  const { dtMs, screenWidth, screenHeight, groundY, ballX, ballY, ballCatchable } = input
  const care = clamp(input.pet.care - CARE_DECAY_PER_MS * dtMs, 0, 100)
  const hungerRaw = clamp(input.pet.hunger + HUNGER_GAIN_PER_MS * dtMs, 0, 100)
  const mood = moodOf({ ...input.pet, care })
  const speed = WALK_SPEED_PX_MS * (mood === 'sad' ? SAD_SPEED_FACTOR : 1)
  let { x, y, facing, activity } = input.pet
  let verticalFacing = input.pet.verticalFacing ?? -1
  let fetchedBall = false
  const isCockroach = input.pet.skin === 'cockroach'
  if (isCockroach) {
    const dx = ballX === null ? 0 : ballX - x
    const dy = ballY === null ? 0 : ballY - y
    const ballDistance = ballX === null || ballY === null ? Infinity : Math.hypot(dx, dy)
    if (ballDistance <= FETCH_DISTANCE_PX * 1.5 && ballCatchable) {
      activity = 'jump'
      fetchedBall = true
    } else if (ballX !== null && ballY !== null) {
      activity = 'fetch'
      facing = dx >= 0 ? 1 : -1
      verticalFacing = dy >= 0 ? 1 : -1
      x += (dx / ballDistance) * FETCH_SPEED_PX_MS * dtMs
      y += (dy / ballDistance) * FETCH_SPEED_PX_MS * dtMs
    } else {
      if (Math.random() < dtMs / 2400) facing = facing === 1 ? -1 : 1
      if (Math.random() < dtMs / 2100) verticalFacing = verticalFacing === 1 ? -1 : 1
      activity = 'walk'
      x += facing * WALK_SPEED_PX_MS * 1.25 * dtMs
      y += verticalFacing * WALK_SPEED_PX_MS * 0.9 * dtMs
    }
    const margin = 24
    const top = Math.min(80, screenHeight / 3)
    if (x <= margin || x >= screenWidth - margin) {
      x = clamp(x, margin, screenWidth - margin)
      facing = x <= margin ? 1 : -1
    }
    if (y <= top || y >= groundY) {
      y = clamp(y, top, groundY)
      verticalFacing = y <= top ? 1 : -1
    }
    return {
      pet: {
        ...input.pet,
        x,
        y,
        facing,
        verticalFacing,
        activity,
        care,
        hunger: hungerRaw,
        lastTick: Date.now()
      },
      didPoop: false,
      fetchedBall
    }
  }
  const distanceToBall = ballX === null ? Infinity : Math.abs(ballX - x)
  if (ballX !== null && distanceToBall <= FETCH_DISTANCE_PX && ballCatchable) {
    activity = 'jump'
    fetchedBall = true
  } else if (ballX !== null) {
    activity = 'fetch'
    facing = ballX > x ? 1 : -1
    x += facing * FETCH_SPEED_PX_MS * dtMs
  } else if (
    activity === 'eat' ||
    activity === 'poop' ||
    activity === 'fetch' ||
    activity === 'jump'
  ) {
    activity = 'idle'
  } else if (activity === 'review') {
    if (Math.random() < dtMs / 1800) activity = 'idle'
  } else {
    const shouldReview = activity === 'idle' && Math.random() < dtMs / 9000
    const shouldWander = Math.random() < dtMs / 4000
    if (shouldReview) {
      activity = 'review'
    } else if (shouldWander) {
      activity = activity === 'walk' ? 'idle' : 'walk'
      if (activity === 'walk' && Math.random() < 0.5) facing = facing === 1 ? -1 : 1
    }
    if (activity === 'walk') x += facing * speed * dtMs
  }
  const margin = 24
  if (x < margin) {
    x = margin
    facing = 1
  } else if (x > screenWidth - margin) {
    x = screenWidth - margin
    facing = -1
  }
  const poopChance = BASE_POOP_CHANCE_PER_MS * (1 + (100 - care) / 40) * dtMs
  const didPoop = (activity === 'walk' || activity === 'idle') && Math.random() < poopChance
  return {
    pet: {
      ...input.pet,
      x,
      facing,
      activity: didPoop ? 'poop' : activity,
      care,
      hunger: hungerRaw,
      lastTick: Date.now()
    },
    didPoop,
    fetchedBall
  }
}
