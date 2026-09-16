import { useRoomSimulation } from '../../hooks/useRoomSimulation'
import { Pet } from '../Pet/Pet'
import { PoopDecal } from '../PoopDecal/PoopDecal'
import { Ball } from '../Ball/Ball'
import { BallToy } from '../BallToy/BallToy'
import { SleepingBag } from '../SleepingBag/SleepingBag'
import { HUD } from '../HUD/HUD'
import styles from './Room.module.css'

interface RoomProps {
  displayId: number
  width: number
  height: number
}

export function Room({ displayId, width, height }: RoomProps): React.JSX.Element {
  const room = useRoomSimulation(displayId, { width, height })
  const visiblePets = room.pets.filter((pet) => pet.active)
  const hasSleepingBag = visiblePets.some((pet) => pet.hasSleepingBag)
  return (
    <div className={styles.room}>
      {visiblePets.map((pet) => (
        <Pet
          key={pet.id}
          pet={pet}
          alert={room.isAlert(pet)}
          scale={room.petScale}
          onPet={() => room.petPet(pet.id)}
        />
      ))}
      {room.poops.map((poop) => (
        <PoopDecal key={poop.id} x={poop.x} y={poop.y} onClean={() => room.cleanPoop(poop.id)} />
      ))}
      {hasSleepingBag && <SleepingBag x={room.ballHomeX - 180} y={room.groundY} />}
      {room.ball.active && room.ball.thrown ? (
        <Ball
          x={room.ball.x}
          y={room.ball.y}
          spinning={Math.hypot(room.ball.vx, room.ball.vy) > 20}
        />
      ) : (
        <BallToy
          x={room.ball.active ? room.ball.x : room.ballHomeX}
          y={room.ball.active ? room.ball.y : room.groundY - 30}
          onStartDrag={room.startDragBall}
          onDragTo={room.dragBallTo}
          onDrop={room.dropBall}
          onRegisterHitRect={room.registerHitRect}
        />
      )}
      <HUD
        pets={room.pets}
        onToggleActivePet={room.toggleActivePet}
        onRemovePet={room.removePet}
        money={room.money}
        onBuyPet={room.buyPet}
        petScale={room.petScale}
        onSetPetScale={room.setPetScale}
        onRegisterHitRect={room.registerHitRect}
      />
    </div>
  )
}
