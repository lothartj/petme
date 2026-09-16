import { ElectronAPI } from '@electron-toolkit/preload'
import type { PetApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    petApi: PetApi
  }
}
