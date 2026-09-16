const PX = 4
export const SLEEPING_BAG_WIDTH = 12 * PX
export const SLEEPING_BAG_HEIGHT = 5 * PX

export function drawSleepingBag(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, SLEEPING_BAG_WIDTH, SLEEPING_BAG_HEIGHT)
  const px = (gx: number, gy: number, w: number, h: number, color: string): void => {
    ctx.fillStyle = color
    ctx.fillRect(gx * PX, gy * PX, w * PX, h * PX)
  }
  px(0, 1, 12, 4, '#2e86de')
  px(0, 1, 12, 1, '#1b4f7a')
  px(1, 2, 10, 2, '#a9d4f5')
  px(9, 0, 3, 2, '#2e86de')
  px(10, 1, 1, 1, '#1b4f7a')
}
