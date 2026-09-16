import { useLayoutEffect, useRef, useState } from 'react'
import { PET_OFFERS } from '../../../../shared/types'
import type { PetSkinId, PetSnapshot } from '../../../../shared/types'
import { skinFor, spriteGridRows, spriteUrls } from '../../pixel/drawPet'
import styles from './Shop.module.css'

const PANEL_WIDTH = 420
const EDGE_GAP = 12
const MAX_QUANTITY = 20

interface Position {
  x: number
  y: number
}

interface DragState {
  offsetX: number
  offsetY: number
}

interface ShopProps {
  pets: PetSnapshot[]
  money: number
  onBuy: (skin: PetSkinId, quantity: number) => void
  onToggleActive: (petId: string) => void
  onRemove: (petId: string) => void
  petScale: number
  onSetPetScale: (scale: number) => void
  onClose: () => void
  onRegisterHitRect: (
    id: string,
    rect: { x: number; y: number; width: number; height: number } | null
  ) => void
}

function initialPosition(): Position {
  return {
    x: Math.max(EDGE_GAP, Math.min(292, window.innerWidth - PANEL_WIDTH - EDGE_GAP)),
    y: 18
  }
}

interface PetGroup {
  skin: PetSkinId
  label: string
  members: PetSnapshot[]
}

function groupPets(pets: PetSnapshot[]): PetGroup[] {
  const bySkin = new Map<PetSkinId, PetSnapshot[]>()
  for (const pet of pets) {
    const skin = skinFor(pet.species, pet.skin)
    const members = bySkin.get(skin) ?? []
    members.push(pet)
    bySkin.set(skin, members)
  }
  return [...bySkin.entries()].map(([skin, members]) => ({
    skin,
    label: PET_OFFERS.find((offer) => offer.id === skin)?.label ?? skin,
    members
  }))
}

export function Shop({
  pets,
  money,
  onBuy,
  onToggleActive,
  onRemove,
  petScale,
  onSetPetScale,
  onClose,
  onRegisterHitRect
}: ShopProps): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [position, setPosition] = useState<Position>(initialPosition)
  const [tab, setTab] = useState<'shop' | 'pets' | 'settings'>('shop')
  const [quantities, setQuantities] = useState<Partial<Record<PetSkinId, number>>>({})
  const [pendingCounts, setPendingCounts] = useState<Partial<Record<PetSkinId, number>>>({})
  const [cashInfoOpen, setCashInfoOpen] = useState(false)
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel) {
      onRegisterHitRect('shop', {
        x: position.x,
        y: position.y,
        width: panel.offsetWidth,
        height: panel.offsetHeight
      })
    }
    return () => onRegisterHitRect('shop', null)
  }, [money, onRegisterHitRect, pets, position, tab])
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if ((event.target as HTMLElement).closest('button, input')) return
    dragRef.current = {
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    const panel = panelRef.current
    if (!drag || !panel) return
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
  const quantityFor = (skin: PetSkinId): number => quantities[skin] ?? 1
  const adjustQuantity = (skin: PetSkinId, delta: number): void => {
    setQuantities((current) => ({
      ...current,
      [skin]: Math.min(MAX_QUANTITY, Math.max(1, quantityFor(skin) + delta))
    }))
  }
  const groups = groupPets(pets)
  const activeCountOf = (group: PetGroup): number =>
    group.members.filter((pet) => pet.active).length
  const openPetsTab = (): void => {
    setPendingCounts(Object.fromEntries(groups.map((group) => [group.skin, activeCountOf(group)])))
    setTab('pets')
  }
  const pendingCountOf = (group: PetGroup): number =>
    pendingCounts[group.skin] ?? activeCountOf(group)
  const adjustPendingCount = (group: PetGroup, delta: number): void => {
    setPendingCounts((current) => ({
      ...current,
      [group.skin]: Math.min(group.members.length, Math.max(0, pendingCountOf(group) + delta))
    }))
  }
  const pendingChangeCount = groups.filter(
    (group) => pendingCountOf(group) !== activeCountOf(group)
  ).length
  const releasePending = (): void => {
    for (const group of groups) {
      const target = pendingCountOf(group)
      const current = activeCountOf(group)
      if (target === current) continue
      if (target > current) {
        const toActivate = group.members.filter((pet) => !pet.active).slice(0, target - current)
        for (const pet of toActivate) onToggleActive(pet.id)
      } else {
        const toDeactivate = group.members.filter((pet) => pet.active).slice(0, current - target)
        for (const pet of toDeactivate) onToggleActive(pet.id)
      }
    }
  }
  const removeOneFrom = (group: PetGroup): void => {
    const target = group.members.find((pet) => !pet.active) ?? group.members[0]
    if (target) onRemove(target.id)
  }
  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
    >
      <div
        className={styles.header}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className={styles.headerGem}>$</span>
        <span>PET POCKET</span>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close pet pocket"
        >
          ×
        </button>
      </div>
      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === 'shop' ? styles.activeTab : styles.tab}
          onClick={() => setTab('shop')}
        >
          SHOP
        </button>
        <button
          type="button"
          className={tab === 'pets' ? styles.activeTab : styles.tab}
          onClick={openPetsTab}
        >
          MY PETS ({pets.length})
        </button>
        <button
          type="button"
          className={tab === 'settings' ? styles.activeTab : styles.tab}
          onClick={() => setTab('settings')}
        >
          SETTINGS
        </button>
        <div
          className={styles.balance}
          onMouseEnter={() => setCashInfoOpen(true)}
          onMouseLeave={() => setCashInfoOpen(false)}
        >
          <span>$</span> {money.toFixed(2)}
          {cashInfoOpen && (
            <div className={styles.cashTooltip}>
              Stay active on your machine — moving your mouse or typing earns 1¢/sec. Go idle for 3
              seconds and it stops.
            </div>
          )}
        </div>
      </div>
      {tab === 'shop' && (
        <div className={styles.content}>
          <div className={styles.sectionTitle}>ANIMAL &amp; COMPANION SHOP</div>
          <div className={styles.grid}>
            {PET_OFFERS.map((offer) => {
              const quantity = quantityFor(offer.id)
              const totalPrice = offer.price * quantity
              const disabled = money < totalPrice
              return (
                <div key={offer.id} className={styles.slot} title={offer.tagline}>
                  <span
                    className={styles.preview}
                    style={{
                      backgroundImage: `url(${spriteUrls[offer.id]})`,
                      backgroundSize: `800% ${spriteGridRows[offer.id] * 100}%`
                    }}
                  />
                  <span className={styles.petName}>{offer.label}</span>
                  <div className={styles.quantityRow}>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => adjustQuantity(offer.id, -1)}
                      aria-label={`Buy fewer ${offer.label}`}
                    >
                      −
                    </button>
                    <span className={styles.quantityValue}>×{quantity}</span>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => adjustQuantity(offer.id, 1)}
                      aria-label={`Buy more ${offer.label}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.buyButton}
                    disabled={disabled}
                    onClick={() => onBuy(offer.id, quantity)}
                  >
                    BUY ${totalPrice}
                  </button>
                </div>
              )
            })}
          </div>
          <div className={styles.tip}>
            Buy any quantity — only the first one shows up on your desktop, the rest wait in My
            Pets.
          </div>
        </div>
      )}
      {tab === 'pets' && (
        <div className={styles.content}>
          <div className={styles.sectionTitle}>YOUR COMPANIONS — HOW MANY ARE OUT</div>
          {groups.length === 0 ? (
            <div className={styles.empty}>No pets yet. Visit the shop!</div>
          ) : (
            <div className={styles.grid}>
              {groups.map((group) => {
                const owned = group.members.length
                const pendingCount = pendingCountOf(group)
                const changed = pendingCount !== activeCountOf(group)
                return (
                  <div
                    key={group.skin}
                    className={`${styles.slot} ${pendingCount > 0 ? styles.selected : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeOneFrom(group)}
                      aria-label={`Remove one ${group.label}`}
                      title="Remove one of these permanently"
                    >
                      ×
                    </button>
                    <span
                      className={styles.preview}
                      style={{
                        backgroundImage: `url(${spriteUrls[group.skin]})`,
                        backgroundSize: `800% ${spriteGridRows[group.skin] * 100}%`
                      }}
                    />
                    <span className={styles.petName}>{group.label}</span>
                    <span className={styles.price}>OWNED {owned}</span>
                    <div className={styles.quantityRow}>
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => adjustPendingCount(group, -1)}
                        aria-label={`Fewer ${group.label} on screen`}
                      >
                        −
                      </button>
                      <span className={styles.quantityValue}>
                        {pendingCount} out{changed ? '*' : ''}
                      </span>
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => adjustPendingCount(group, 1)}
                        aria-label={`More ${group.label} on screen`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className={styles.tip}>
            Use +/− to say how many of each should be on your desktop, then release.
          </div>
          <button
            type="button"
            className={styles.buyButton}
            disabled={pendingChangeCount === 0}
            onClick={releasePending}
          >
            {pendingChangeCount === 0 ? 'NO CHANGES' : `RELEASE (${pendingChangeCount} CHANGED)`}
          </button>
        </div>
      )}
      {tab === 'settings' && (
        <div className={styles.content}>
          <div className={styles.sectionTitle}>SETTINGS</div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Pet size</span>
            <span className={styles.settingValue}>{Math.round(petScale * 100)}%</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0.5}
            max={2}
            step={0.1}
            value={petScale}
            onChange={(event) => onSetPetScale(Number(event.target.value))}
          />
          <div className={styles.tip}>Changes every pet on your desktop, big or tiny.</div>
        </div>
      )}
    </div>
  )
}
