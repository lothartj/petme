import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuyPetResult, PetSkinId, PetSnapshot } from '../../../shared/types'
import { tickPet } from '../state/petMachine'
import { isCurious, useKeystrokePulse } from './useKeystrokePulse'
import { PET_HEIGHT, PET_WIDTH } from '../pixel/drawPet'
import { BALL_SIZE } from '../pixel/drawBall'

const MAX_POOPS = 8
const PERSIST_INTERVAL_MS = 4000
const PET_HOLD_MS = 900
const PLAY_HOLD_MS = 850
const PET_CARE_BOOST = 15
const FETCH_CARE_BOOST = 8
const BALL_GRAVITY = 1100
const BALL_BOUNCE = 0.68
const BALL_FRICTION = 0.88
const MAX_THROW_SPEED = 1400
const DRAG_HISTORY_WINDOW_MS = 120
const CATCH_SPEED_PX_S = 140

export interface PoopDecalState {
  id: string
  x: number
  y: number
}

export interface BallState {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  thrown: boolean
}

interface DragSample {
  x: number
  y: number
  at: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface RoomBounds {
  width: number
  height: number
}

export interface RoomSimulation {
  pets: PetSnapshot[]
  poops: PoopDecalState[]
  ball: BallState
  groundY: number
  ballHomeX: number
  muted: boolean
  money: number
  toggleActivePet: (id: string) => void
  removePet: (id: string) => void
  petScale: number
  setPetScale: (scale: number) => void
  cleanPoop: (id: string) => void
  petPet: (id: string) => void
  startDragBall: (x: number, y: number) => void
  dragBallTo: (x: number, y: number) => void
  dropBall: () => void
  buyPet: (skin: PetSkinId, quantity: number) => void
  isAlert: (pet: PetSnapshot) => boolean
  registerHitRect: (id: string, rect: Rect | null) => void
}

const EMPTY_BALL: BallState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  active: false,
  thrown: false
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampSpeed(value: number): number {
  return clamp(value, -MAX_THROW_SPEED, MAX_THROW_SPEED)
}

function rectContains(px: number, py: number, rect: Rect): boolean {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height
}

export function useRoomSimulation(displayId: number, bounds: RoomBounds): RoomSimulation {
  const [pets, setPets] = useState<PetSnapshot[]>([])
  const [poops, setPoops] = useState<PoopDecalState[]>([])
  const [ball, setBall] = useState<BallState>(EMPTY_BALL)
  const [muted, setMuted] = useState(false)
  const [money, setMoney] = useState(0)
  const [petScale, setPetScaleState] = useState(1)
  const [groundInset, setGroundInset] = useState(90)
  const groundY = bounds.height - groundInset
  const ballHomeX = bounds.width / 2 + 90
  const petsRef = useRef<PetSnapshot[]>([])
  const poopsRef = useRef<PoopDecalState[]>([])
  const ballRef = useRef<BallState>(EMPTY_BALL)
  const draggingBallRef = useRef(false)
  const ballCaughtRef = useRef(false)
  const dragHistoryRef = useRef<DragSample[]>([])
  const pettedUntilRef = useRef(new Map<string, number>())
  const playUntilRef = useRef(new Map<string, number>())
  const hitRectsRef = useRef(new Map<string, Rect>())
  const petScaleRef = useRef(1)
  const lastPulseAt = useKeystrokePulse()
  const wasIgnoringRef = useRef(true)
  const lastFrameAt = useRef<number | null>(null)
  const lastPersistAt = useRef(0)
  const registerHitRect = useCallback((id: string, rect: Rect | null) => {
    if (rect) hitRectsRef.current.set(id, rect)
    else hitRectsRef.current.delete(id)
  }, [])
  useEffect(() => {
    const offInit = window.petApi.onRoomInit((init) => {
      if (init.displayId !== displayId) return
      const initial = init.state.pets.filter((pet) => pet.displayId === displayId)
      petsRef.current = initial
      setPets(initial)
      setMuted(init.state.settings.muted)
      petScaleRef.current = init.state.settings.petScale
      setPetScaleState(init.state.settings.petScale)
      setGroundInset(init.groundInset)
      setMoney(init.state.economy.money)
    })
    const offSpawn = window.petApi.onSpawnPet((pet) => {
      if (
        pet.displayId !== displayId ||
        petsRef.current.some((existing) => existing.id === pet.id)
      ) {
        return
      }
      petsRef.current = [...petsRef.current, pet]
      setPets(petsRef.current)
    })
    const offDespawn = window.petApi.onDespawnPet((petId) => {
      petsRef.current = petsRef.current.filter((pet) => pet.id !== petId)
      setPets(petsRef.current)
    })
    const offPetUpdated = window.petApi.onPetUpdated((updated) => {
      if (!petsRef.current.some((pet) => pet.id === updated.id)) return
      petsRef.current = petsRef.current.map((pet) => (pet.id === updated.id ? updated : pet))
      setPets(petsRef.current)
    })
    const offMute = window.petApi.onToggleMute(setMuted)
    const offMoney = window.petApi.onMoneyUpdated(setMoney)
    const offBuyResult = window.petApi.onBuyPetResult((result: BuyPetResult) => {
      setMoney(result.money)
    })
    const offPetScale = window.petApi.onPetScaleChanged((scale) => {
      petScaleRef.current = scale
      setPetScaleState(scale)
    })
    return () => {
      offInit()
      offSpawn()
      offDespawn()
      offPetUpdated()
      offMute()
      offMoney()
      offBuyResult()
      offPetScale()
    }
  }, [displayId])
  useEffect(() => {
    let raf = 0
    const loop = (): void => {
      const now = performance.now()
      const dtMs = lastFrameAt.current === null ? 16 : Math.min(50, now - lastFrameAt.current)
      lastFrameAt.current = now
      const dt = dtMs / 1000
      if (ballRef.current.active && ballRef.current.thrown) {
        const radius = BALL_SIZE / 2
        const floorY = groundY - radius
        const next = {
          ...ballRef.current,
          x: ballRef.current.x + ballRef.current.vx * dt,
          y: ballRef.current.y + ballRef.current.vy * dt,
          vy: ballRef.current.vy + BALL_GRAVITY * dt
        }
        if (next.x <= radius || next.x >= bounds.width - radius) {
          next.x = clamp(next.x, radius, bounds.width - radius)
          next.vx *= -BALL_BOUNCE
        }
        if (next.y >= floorY) {
          next.y = floorY
          next.vy = Math.abs(next.vy) > 75 ? -Math.abs(next.vy) * BALL_BOUNCE : 0
          next.vx *= BALL_FRICTION
        }
        if (next.y === floorY && next.vy === 0 && Math.abs(next.vx) < 6) {
          next.vx = 0
          next.thrown = false
        }
        ballRef.current = next
        setBall(next)
      }
      const newPoops: PoopDecalState[] = []
      const wallClockNow = Date.now()
      const ballIsChaseable =
        ballRef.current.active && !draggingBallRef.current && !ballCaughtRef.current
      let liveBallX = ballIsChaseable ? ballRef.current.x : null
      let liveBallY = ballIsChaseable ? ballRef.current.y : null
      const ballCatchable =
        ballIsChaseable && Math.hypot(ballRef.current.vx, ballRef.current.vy) < CATCH_SPEED_PX_S
      petsRef.current = petsRef.current.map((pet) => {
        const petOnAxis = pet.skin === 'cockroach' ? pet : { ...pet, y: groundY }
        const pettedUntil = pettedUntilRef.current.get(pet.id) ?? 0
        if (pettedUntil > wallClockNow) return { ...petOnAxis, activity: 'petted' }
        const playUntil = playUntilRef.current.get(pet.id) ?? 0
        if (playUntil > wallClockNow) return { ...petOnAxis, activity: 'jump' }
        const result = tickPet({
          pet: petOnAxis,
          dtMs,
          screenWidth: bounds.width,
          screenHeight: bounds.height,
          groundY,
          ballX: liveBallX,
          ballY: liveBallY,
          ballCatchable
        })
        if (result.didPoop) {
          newPoops.push({ id: crypto.randomUUID(), x: result.pet.x, y: result.pet.y })
        }
        if (result.fetchedBall) {
          const caughtBall: BallState = {
            x: result.pet.x,
            y: groundY - BALL_SIZE / 2,
            vx: 0,
            vy: 0,
            active: true,
            thrown: false
          }
          ballRef.current = caughtBall
          ballCaughtRef.current = true
          setBall(caughtBall)
          liveBallX = null
          liveBallY = null
          playUntilRef.current.set(pet.id, wallClockNow + PLAY_HOLD_MS)
          return {
            ...result.pet,
            activity: 'jump',
            care: Math.min(100, result.pet.care + FETCH_CARE_BOOST)
          }
        }
        return result.pet
      })
      if (newPoops.length > 0) {
        const combined = [...poopsRef.current, ...newPoops]
        poopsRef.current =
          combined.length > MAX_POOPS ? combined.slice(combined.length - MAX_POOPS) : combined
        setPoops(poopsRef.current)
      }
      setPets(petsRef.current)
      if (now - lastPersistAt.current > PERSIST_INTERVAL_MS && petsRef.current.length > 0) {
        lastPersistAt.current = now
        window.petApi.upsertPets(petsRef.current)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [bounds.width, bounds.height, groundY])
  useEffect(() => {
    const handleMove = (event: MouseEvent): void => {
      let shouldIgnore = true
      if (draggingBallRef.current) {
        shouldIgnore = false
      } else {
        const { clientX: x, clientY: y } = event
        const scale = petScaleRef.current
        for (const pet of petsRef.current) {
          const width = PET_WIDTH * scale
          const height = PET_HEIGHT * scale
          const rect = { x: pet.x - width / 2, y: pet.y - height, width, height }
          if (rectContains(x, y, rect)) {
            shouldIgnore = false
            break
          }
        }
        if (shouldIgnore) {
          for (const rect of hitRectsRef.current.values()) {
            if (rectContains(x, y, rect)) {
              shouldIgnore = false
              break
            }
          }
        }
      }
      if (shouldIgnore !== wasIgnoringRef.current) {
        wasIgnoringRef.current = shouldIgnore
        window.petApi.setIgnoreMouseEvents(shouldIgnore)
      }
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])
  return {
    pets,
    poops,
    ball,
    groundY,
    ballHomeX,
    muted,
    money,
    toggleActivePet: (id) => window.petApi.toggleActivePet(id),
    removePet: (id) => window.petApi.removePet(id),
    petScale,
    setPetScale: (scale) => {
      petScaleRef.current = scale
      setPetScaleState(scale)
      window.petApi.setPetScale(scale)
    },
    cleanPoop: (id) => {
      poopsRef.current = poopsRef.current.filter((poop) => poop.id !== id)
      setPoops(poopsRef.current)
    },
    petPet: (id) => {
      pettedUntilRef.current.set(id, Date.now() + PET_HOLD_MS)
      petsRef.current = petsRef.current.map((pet) =>
        pet.id === id ? { ...pet, care: Math.min(100, pet.care + PET_CARE_BOOST) } : pet
      )
      setPets(petsRef.current)
    },
    startDragBall: (x, y) => {
      draggingBallRef.current = true
      ballCaughtRef.current = false
      dragHistoryRef.current = [{ x, y, at: performance.now() }]
      ballRef.current = { x, y, vx: 0, vy: 0, active: true, thrown: false }
      setBall(ballRef.current)
    },
    dragBallTo: (x, y) => {
      if (!draggingBallRef.current) return
      const now = performance.now()
      const history = [...dragHistoryRef.current, { x, y, at: now }].filter(
        (sample) => now - sample.at <= DRAG_HISTORY_WINDOW_MS
      )
      dragHistoryRef.current = history
      ballRef.current = {
        ...ballRef.current,
        x: clamp(x, BALL_SIZE / 2, bounds.width - BALL_SIZE / 2),
        y: clamp(y, BALL_SIZE / 2, bounds.height - BALL_SIZE / 2)
      }
      setBall(ballRef.current)
    },
    dropBall: () => {
      draggingBallRef.current = false
      const history = dragHistoryRef.current
      dragHistoryRef.current = []
      const oldest = history[0]
      const newest = history[history.length - 1]
      const elapsed = oldest && newest ? (newest.at - oldest.at) / 1000 : 0
      const releaseVx = elapsed > 0.02 ? clampSpeed((newest.x - oldest.x) / elapsed) : 0
      const releaseVy = elapsed > 0.02 ? clampSpeed((newest.y - oldest.y) / elapsed) : 0
      const speed = Math.hypot(releaseVx, releaseVy)
      ballRef.current = {
        ...ballRef.current,
        vx: speed < 80 ? 220 : releaseVx,
        vy: speed < 80 ? -380 : releaseVy,
        active: true,
        thrown: true
      }
      setBall(ballRef.current)
    },
    buyPet: (skin, quantity) => {
      window.petApi.buyPet({
        skin,
        displayId,
        x: bounds.width / 2,
        y: skin === 'cockroach' ? bounds.height / 2 : groundY,
        quantity
      })
    },
    isAlert: () => isCurious(lastPulseAt.current),
    registerHitRect
  }
}
