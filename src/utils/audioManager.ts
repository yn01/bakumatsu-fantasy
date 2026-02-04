import { Howl } from 'howler'

/**
 * AudioManager - Centralized audio playback system
 *
 * Features:
 * - BGM playback with looping and fade out
 * - Sound effect playback
 * - Volume control (BGM and SE independent)
 * - Audio caching for performance
 * - Cleanup and resource management
 */
export class AudioManager {
  private currentBGM: Howl | null = null
  private bgmCache: Map<string, Howl> = new Map()
  private seCache: Map<string, Howl> = new Map()

  private bgmVolume: number = 1.0
  private seVolume: number = 1.0

  constructor(bgmVol: number = 1.0, seVol: number = 1.0) {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVol))
    this.seVolume = Math.max(0, Math.min(1, seVol))
  }

  /**
   * Play background music
   * @param bgmId - BGM file ID (e.g., 'title', 'field', 'battle')
   * @param volume - Override volume (0.0-1.0)
   * @param loop - Loop playback (default: true)
   */
  async playBGM(
    bgmId: string,
    volume?: number,
    loop: boolean = true
  ): Promise<void> {
    try {
      // Stop current BGM if different
      if (this.currentBGM && this.currentBGM !== this.bgmCache.get(bgmId)) {
        this.stopBGM(500) // Fade out over 500ms
      }

      // Get or load BGM
      let bgm = this.bgmCache.get(bgmId)
      if (!bgm) {
        bgm = await this.loadAudio(`/assets/bgm/${bgmId}.mp3`, true)
        this.bgmCache.set(bgmId, bgm)
      }

      // Configure and play
      const finalVolume = volume !== undefined ? volume : this.bgmVolume
      bgm.volume(finalVolume)
      bgm.loop(loop)

      if (!bgm.playing()) {
        bgm.play()
      }

      this.currentBGM = bgm
      console.log(`[AudioManager] Playing BGM: ${bgmId} (volume: ${finalVolume})`)
    } catch (error) {
      console.error(`[AudioManager] Failed to play BGM ${bgmId}:`, error)
    }
  }

  /**
   * Stop background music
   * @param fadeDuration - Fade out duration in milliseconds (default: 0)
   */
  stopBGM(fadeDuration: number = 0): void {
    if (!this.currentBGM) return

    // Capture current BGM to avoid race condition
    const bgmToStop = this.currentBGM

    if (fadeDuration > 0) {
      bgmToStop.fade(bgmToStop.volume(), 0, fadeDuration)
      setTimeout(() => {
        bgmToStop.stop()
      }, fadeDuration)
    } else {
      bgmToStop.stop()
    }

    console.log('[AudioManager] Stopped BGM')
  }

  /**
   * Pause background music
   */
  pauseBGM(): void {
    if (this.currentBGM && this.currentBGM.playing()) {
      this.currentBGM.pause()
      console.log('[AudioManager] Paused BGM')
    }
  }

  /**
   * Resume background music
   */
  resumeBGM(): void {
    if (this.currentBGM && !this.currentBGM.playing()) {
      this.currentBGM.play()
      console.log('[AudioManager] Resumed BGM')
    }
  }

  /**
   * Play sound effect
   * @param seId - SE file ID (e.g., 'decide', 'cancel', 'cursor')
   * @param volume - Override volume (0.0-1.0)
   */
  async playSE(seId: string, volume?: number): Promise<void> {
    try {
      // Get or load SE
      let se = this.seCache.get(seId)
      if (!se) {
        se = await this.loadAudio(`/assets/se/${seId}.mp3`, false)
        this.seCache.set(seId, se)
      }

      // Configure and play
      const finalVolume = volume !== undefined ? volume : this.seVolume
      se.volume(finalVolume)
      se.play()

      console.log(`[AudioManager] Playing SE: ${seId} (volume: ${finalVolume})`)
    } catch (error) {
      console.error(`[AudioManager] Failed to play SE ${seId}:`, error)
    }
  }

  /**
   * Set BGM volume
   * @param volume - Volume level (0.0-1.0)
   */
  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume))
    if (this.currentBGM) {
      this.currentBGM.volume(this.bgmVolume)
    }
    console.log(`[AudioManager] BGM volume set to ${this.bgmVolume}`)
  }

  /**
   * Set SE volume
   * @param volume - Volume level (0.0-1.0)
   */
  setSEVolume(volume: number): void {
    this.seVolume = Math.max(0, Math.min(1, volume))
    console.log(`[AudioManager] SE volume set to ${this.seVolume}`)
  }

  /**
   * Preload BGM for faster playback
   * @param bgmId - BGM file ID
   */
  async preloadBGM(bgmId: string): Promise<void> {
    if (this.bgmCache.has(bgmId)) return

    try {
      const bgm = await this.loadAudio(`/assets/bgm/${bgmId}.mp3`, true)
      this.bgmCache.set(bgmId, bgm)
      console.log(`[AudioManager] Preloaded BGM: ${bgmId}`)
    } catch (error) {
      console.error(`[AudioManager] Failed to preload BGM ${bgmId}:`, error)
    }
  }

  /**
   * Preload SE for faster playback
   * @param seId - SE file ID
   */
  async preloadSE(seId: string): Promise<void> {
    if (this.seCache.has(seId)) return

    try {
      const se = await this.loadAudio(`/assets/se/${seId}.mp3`, false)
      this.seCache.set(seId, se)
      console.log(`[AudioManager] Preloaded SE: ${seId}`)
    } catch (error) {
      console.error(`[AudioManager] Failed to preload SE ${seId}:`, error)
    }
  }

  /**
   * Clear all cached audio
   */
  clearCache(): void {
    // Stop current BGM
    this.stopBGM()

    // Unload all cached audio
    this.bgmCache.forEach((howl) => howl.unload())
    this.seCache.forEach((howl) => howl.unload())

    this.bgmCache.clear()
    this.seCache.clear()
    this.currentBGM = null

    console.log('[AudioManager] Cleared audio cache')
  }

  /**
   * Load audio file
   * @param path - Audio file path
   * @param isMusic - Whether this is music (for HTML5 Audio) or sound effect
   * @returns Loaded Howl instance
   */
  private loadAudio(path: string, isMusic: boolean): Promise<Howl> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [path],
        html5: isMusic, // Use HTML5 Audio for music to reduce memory usage
        preload: true,
        onload: () => resolve(howl),
        onloaderror: (_id, error) => {
          console.error(`[AudioManager] Load error for ${path}:`, error)
          reject(new Error(`Failed to load audio: ${path}`))
        },
      })
    })
  }
}
