import type { PetActivity, PetSkinId, PetSpecies } from '../../../shared/types'
import chispaSpriteUrl from '../assets/pets/chispa.webp'
import cockroachSpriteUrl from '../assets/pets/cockroach.webp'
import corgiSpriteUrl from '../assets/pets/corgi.webp'
import frankieSpriteUrl from '../assets/pets/frankie.webp'
import inosukeSpriteUrl from '../assets/pets/inosuke.webp'
import kaijuSpriteUrl from '../assets/pets/kaiju-no-8.webp'
import mimiSpriteUrl from '../assets/pets/mimi.webp'
import sunnySpriteUrl from '../assets/pets/sunny-retriever.webp'
import tanjiroSpriteUrl from '../assets/pets/tanjiro.webp'
import toothlessSpriteUrl from '../assets/pets/toothless.webp'
import wallySpriteUrl from '../assets/pets/wally.webp'
import zichaoSpriteUrl from '../assets/pets/zichao-xiong.webp'

const SOURCE_FRAME_WIDTH = 192
const SOURCE_FRAME_HEIGHT = 208
const FRAMES_PER_SECOND = 8
const RAF_RATE = 60

export const PET_WIDTH = 96
export const PET_HEIGHT = 104

interface Animation {
  row: number
  frames: number
  fixedFrame?: number
  invertMirror?: boolean
}

export const spriteUrls: Record<PetSkinId, string> = {
  corgi: corgiSpriteUrl,
  mimi: mimiSpriteUrl,
  frankie: frankieSpriteUrl,
  'sunny-retriever': sunnySpriteUrl,
  wally: wallySpriteUrl,
  'zichao-xiong': zichaoSpriteUrl,
  toothless: toothlessSpriteUrl,
  inosuke: inosukeSpriteUrl,
  chispa: chispaSpriteUrl,
  'kaiju-no-8': kaijuSpriteUrl,
  tanjiro: tanjiroSpriteUrl,
  cockroach: cockroachSpriteUrl
}

export const spriteGridRows: Record<PetSkinId, 9 | 11> = {
  corgi: 9,
  mimi: 9,
  frankie: 9,
  'sunny-retriever': 11,
  wally: 9,
  'zichao-xiong': 9,
  toothless: 11,
  inosuke: 9,
  chispa: 9,
  'kaiju-no-8': 11,
  tanjiro: 9,
  cockroach: 11
}

const sprites = new Map<PetSkinId, HTMLImageElement>()

interface FrameBounds {
  sx: number
  sy: number
  sw: number
  sh: number
}

const boundsCache = new Map<PetSkinId, FrameBounds>()
const BOUNDS_MARGIN = 14

export function skinFor(species: PetSpecies, skin?: PetSkinId): PetSkinId {
  return skin ?? (species === 'cat' ? 'mimi' : 'corgi')
}

function detectBounds(image: HTMLImageElement, skin: PetSkinId): void {
  const canvas = document.createElement('canvas')
  canvas.width = SOURCE_FRAME_WIDTH
  canvas.height = SOURCE_FRAME_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(
    image,
    0,
    0,
    SOURCE_FRAME_WIDTH,
    SOURCE_FRAME_HEIGHT,
    0,
    0,
    SOURCE_FRAME_WIDTH,
    SOURCE_FRAME_HEIGHT
  )
  const { data } = ctx.getImageData(0, 0, SOURCE_FRAME_WIDTH, SOURCE_FRAME_HEIGHT)
  let minX = SOURCE_FRAME_WIDTH
  let minY = SOURCE_FRAME_HEIGHT
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < SOURCE_FRAME_HEIGHT; y++) {
    for (let x = 0; x < SOURCE_FRAME_WIDTH; x++) {
      const alpha = data[(y * SOURCE_FRAME_WIDTH + x) * 4 + 3]
      if (alpha <= 10) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX <= minX || maxY <= minY) return
  const sx = Math.max(0, minX - BOUNDS_MARGIN)
  const sy = Math.max(0, minY - BOUNDS_MARGIN)
  const ex = Math.min(SOURCE_FRAME_WIDTH, maxX + BOUNDS_MARGIN)
  const ey = Math.min(SOURCE_FRAME_HEIGHT, maxY + BOUNDS_MARGIN)
  boundsCache.set(skin, { sx, sy, sw: ex - sx, sh: ey - sy })
}

function getSprite(skin: PetSkinId): HTMLImageElement {
  const cached = sprites.get(skin)
  if (cached) return cached
  const image = new Image()
  image.decoding = 'async'
  image.addEventListener('load', () => detectBounds(image, skin), { once: true })
  image.src = spriteUrls[skin]
  sprites.set(skin, image)
  return image
}

function animationFor(activity: PetActivity, alert: boolean, care: number): Animation {
  if (activity === 'walk' || activity === 'follow') {
    return { row: 1, frames: 8 }
  }
  if (activity === 'petted') return { row: 3, frames: 4 }
  if (activity === 'jump') return { row: 4, frames: 5 }
  if (activity === 'poop') return { row: 5, frames: 8 }
  if (activity === 'sleep') return { row: 0, frames: 1, fixedFrame: 3 }
  if (activity === 'fetch') return { row: 7, frames: 6, invertMirror: true }
  if (activity === 'eat' || activity === 'review') return { row: 8, frames: 6 }
  if (care < 34) return { row: 5, frames: 8 }
  if (alert) return { row: 6, frames: 6 }
  return { row: 0, frames: 6 }
}

export interface DrawPetOptions {
  species: PetSpecies
  skin?: PetSkinId
  activity: PetActivity
  facing: 1 | -1
  verticalFacing?: 1 | -1
  frame: number
  alert: boolean
  care: number
  weight: number
  hairLength: number
  hasCollar: boolean
  hasShirt: boolean
}

function drawAccessories(
  ctx: CanvasRenderingContext2D,
  activity: PetActivity,
  facing: 1 | -1,
  hasCollar: boolean,
  hasShirt: boolean
): void {
  const moving = activity === 'walk' || activity === 'follow' || activity === 'fetch'
  if (hasShirt) {
    ctx.save()
    ctx.globalAlpha = 0.82
    ctx.fillStyle = '#2e86de'
    if (moving) {
      const x = facing === 1 ? 30 : 42
      ctx.fillRect(x, 68, 24, 9)
    } else {
      ctx.fillRect(35, 70, 26, 9)
    }
    ctx.restore()
  }
  if (hasCollar) {
    const x = moving ? (facing === 1 ? 58 : 34) : 47
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(x - 5, 57, 10, 3)
    ctx.fillStyle = '#f4c542'
    ctx.fillRect(x - 1, 60, 3, 3)
  }
}

export function drawPet(ctx: CanvasRenderingContext2D, options: DrawPetOptions): void {
  const { species, activity, facing, verticalFacing, frame, alert, care, hasCollar, hasShirt } =
    options
  const image = getSprite(skinFor(species, options.skin))
  ctx.clearRect(0, 0, PET_WIDTH, PET_HEIGHT)
  if (!image.complete || image.naturalWidth === 0) return
  const animation = animationFor(activity, alert, care)
  const slowedFrame = Math.floor((frame * FRAMES_PER_SECOND) / RAF_RATE)
  const column = animation.fixedFrame ?? slowedFrame % animation.frames
  ctx.imageSmoothingEnabled = false
  ctx.save()
  const shouldMirror = animation.invertMirror ? facing === 1 : facing === -1
  if (shouldMirror) {
    ctx.translate(PET_WIDTH, 0)
    ctx.scale(-1, 1)
  }
  if (verticalFacing === 1) {
    ctx.translate(0, PET_HEIGHT)
    ctx.scale(1, -1)
  }
  const bounds = boundsCache.get(skinFor(species, options.skin))
  const sourceX = column * SOURCE_FRAME_WIDTH + (bounds?.sx ?? 0)
  const sourceY = animation.row * SOURCE_FRAME_HEIGHT + (bounds?.sy ?? 0)
  const sourceWidth = bounds?.sw ?? SOURCE_FRAME_WIDTH
  const sourceHeight = bounds?.sh ?? SOURCE_FRAME_HEIGHT
  const scale = Math.min(PET_WIDTH / sourceWidth, PET_HEIGHT / sourceHeight)
  const destWidth = sourceWidth * scale
  const destHeight = sourceHeight * scale
  const destX = (PET_WIDTH - destWidth) / 2
  const destY = PET_HEIGHT - destHeight
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destX,
    destY,
    destWidth,
    destHeight
  )
  ctx.restore()
  drawAccessories(ctx, activity, facing, hasCollar, hasShirt)
}
