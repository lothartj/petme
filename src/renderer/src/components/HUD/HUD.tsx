import { useLayoutEffect, useRef, useState } from 'react'
import { PET_OFFERS } from '../../../../shared/types'
import type { PetSkinId, PetSnapshot } from '../../../../shared/types'
import { skinFor } from '../../pixel/drawPet'
import { Shop } from '../Shop/Shop'
import styles from './HUD.module.css'

const PANEL_WIDTH = 258
const EDGE_GAP = 12

interface HUDProps {
  pets: PetSnapshot[]
  onToggleActivePet: (petId: string) => void
  onRemovePet: (petId: string) => void
  money: number
  onBuyPet: (skin: PetSkinId, quantity: number) => void
  petScale: number
  onSetPetScale: (scale: number) => void
  onRegisterHitRect: (
    id: string,
    rect: { x: number; y: number; width: number; height: number } | null
  ) => void
}

interface DragState {
  offsetX: number
  offsetY: number
}

export function HUD({
  pets,
  onToggleActivePet,
  onRemovePet,
  money,
  onBuyPet,
  petScale,
  onSetPetScale,
  onRegisterHitRect
}: HUDProps): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [shopOpen, setShopOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [cashInfoOpen, setCashInfoOpen] = useState(false)
  const activeCount = pets.filter((candidate) => candidate.active).length
  const pet = pets.find((candidate) => candidate.active)
  const activeSkin = pet ? skinFor(pet.species, pet.skin) : null
  const activeName = activeSkin
    ? (PET_OFFERS.find((offer) => offer.id === activeSkin)?.label ?? activeSkin)
    : 'No pet'
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel) {
      onRegisterHitRect('hud', {
        x: position.x,
        y: position.y,
        width: panel.offsetWidth,
        height: panel.offsetHeight
      })
    }
    return () => onRegisterHitRect('hud', null)
  }, [money, onRegisterHitRect, pets, position, minimized])
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    dragRef.current = {
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const panel = panelRef.current
    const drag = dragRef.current
    if (!panel || !drag) return
    setPosition({
      x: Math.max(
        EDGE_GAP,
        Math.min(event.clientX - drag.offsetX, window.innerWidth - panel.offsetWidth - EDGE_GAP)
      ),
      y: Math.max(
        EDGE_GAP,
        Math.min(event.clientY - drag.offsetY, window.innerHeight - panel.offsetHeight - EDGE_GAP)
      )
    })
  }
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }
  return (
    <>
      <div
        ref={panelRef}
        className={styles.panel}
        style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
      >
        <div
          className={styles.dragBar}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <span className={styles.trafficLights}>
            <button
              type="button"
              className={styles.trafficDotRed}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => window.petApi.quitApp()}
              aria-label="Quit petme"
              title="Quit petme"
            />
            <button
              type="button"
              className={styles.trafficDotYellow}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? 'Expand petme' : 'Minimize petme'}
              title={minimized ? 'Expand' : 'Minimize'}
            />
            <button
              type="button"
              className={styles.trafficDotGreen}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setShopOpen((open) => !open)}
              aria-label="Toggle Pet Pocket"
              title="Toggle Pet Pocket"
            />
          </span>
          <span className={styles.liveDot} />
          <span className={styles.brand}>PETME // LIVE</span>
          <span className={styles.grip}>•••</span>
        </div>
        {!minimized && (
          <>
            <div className={styles.petSelector}>
              <div className={styles.identity}>
                <span className={styles.petName}>{activeName}</span>
                <span className={styles.petCount}>
                  {pets.length > 0 ? `${activeCount}/${pets.length} active` : 'visit the arcade'}
                </span>
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.healthBlock}>
                <div className={styles.statLabel}>
                  <span>CARE</span>
                  <span>{Math.round(pet?.care ?? 0)}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pet?.care ?? 0}%` }} />
                </div>
              </div>
              <div
                className={styles.wallet}
                onMouseEnter={() => setCashInfoOpen(true)}
                onMouseLeave={() => setCashInfoOpen(false)}
              >
                <span className={styles.coin}>$</span>
                <span>{money.toFixed(2)}</span>
                {cashInfoOpen && (
                  <div className={styles.cashTooltip}>
                    Stay active on your machine — moving your mouse or typing earns 1¢/sec. Go idle
                    for 3 seconds and it stops.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.shopButton} ${shopOpen ? styles.shopButtonOpen : ''}`}
              onClick={() => setShopOpen((open) => !open)}
            >
              <span>{shopOpen ? 'Close Pet Pocket' : 'Open Pet Pocket'}</span>
              <span className={styles.buttonArrow}>{shopOpen ? '×' : '↗'}</span>
            </button>
          </>
        )}
      </div>
      {!minimized && shopOpen && (
        <Shop
          pets={pets}
          money={money}
          onBuy={onBuyPet}
          onToggleActive={onToggleActivePet}
          onRemove={onRemovePet}
          petScale={petScale}
          onSetPetScale={onSetPetScale}
          onClose={() => setShopOpen(false)}
          onRegisterHitRect={onRegisterHitRect}
        />
      )}
    </>
  )
}
