import assert from 'node:assert/strict'
import { tickPet } from '../src/renderer/src/state/petMachine'
import type { PetSnapshot } from '../src/shared/types'

function basePet(overrides: Partial<PetSnapshot> = {}): PetSnapshot {
  return {
    id: 'test',
    species: 'dog',
    displayId: 0,
    x: 100,
    y: 0,
    facing: 1,
    activity: 'idle',
    care: 100,
    hunger: 0,
    hairLength: 20,
    weight: 50,
    hasCollar: false,
    hasShirt: false,
    hasSleepingBag: false,
    lastTick: Date.now(),
    ...overrides
  }
}

const decayed = tickPet({
  pet: basePet(),
  dtMs: 60_000,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: null,
  ballY: null,
  ballCatchable: false
})
assert.ok(decayed.pet.care < 100, 'care should decay over time')
assert.ok(decayed.pet.hunger > 0, 'hunger should increase over time')

const fetching = tickPet({
  pet: basePet({ x: 100 }),
  dtMs: 16,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: 300,
  ballY: 700,
  ballCatchable: false
})
assert.equal(fetching.pet.activity, 'fetch', 'a thrown ball should trigger fetch mode')
assert.ok(fetching.pet.x > 100, 'fetching pet should move toward the ball')

const caughtBall = tickPet({
  pet: basePet({ x: 295 }),
  dtMs: 16,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: 300,
  ballY: 740,
  ballCatchable: true
})
assert.ok(caughtBall.fetchedBall, 'reaching a slow, grabbable ball should report it as fetched')
assert.equal(caughtBall.pet.activity, 'jump', 'catching the ball should trigger the jump animation')

const stillBouncing = tickPet({
  pet: basePet({ x: 295 }),
  dtMs: 16,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: 300,
  ballY: 740,
  ballCatchable: false
})
assert.ok(
  !stillBouncing.fetchedBall,
  'a fast-moving ball should not be caught just because it briefly touches ground level on a bounce — ' +
    'catching has to wait for it to actually slow down, or it never gets to bounce'
)
assert.equal(
  stillBouncing.pet.activity,
  'fetch',
  'the pet should keep chasing a bouncing ball, not snatch it out of a bounce'
)

const clampedLow = tickPet({
  pet: basePet({ care: 0, hunger: 100 }),
  dtMs: 60_000,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: null,
  ballY: null,
  ballCatchable: false
})
assert.equal(clampedLow.pet.care, 0, 'care should clamp at 0')
assert.equal(clampedLow.pet.hunger, 100, 'hunger should clamp at 100')

const atLeftEdge = tickPet({
  pet: basePet({ x: 10, facing: -1, activity: 'walk' }),
  dtMs: 16,
  screenWidth: 1000,
  screenHeight: 800,
  groundY: 740,
  ballX: null,
  ballY: null,
  ballCatchable: false
})
assert.ok(atLeftEdge.pet.x >= 24, 'pet should be clamped back inside the left margin')
assert.equal(atLeftEdge.pet.facing, 1, 'hitting the left edge should flip facing to walk right')

console.log('petMachine: all checks passed')
