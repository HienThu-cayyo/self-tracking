let audioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === "undefined") return null
  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return null

  try {
    audioContext ??= new AudioContextConstructor()
    return audioContext
  } catch {
    return null
  }
}

export function prepareTimerCompletionSound() {
  const context = getAudioContext()
  if (context?.state === "suspended") void context.resume().catch(() => undefined)
}

export function playTimerCompletionSound() {
  const context = getAudioContext()
  if (!context) return

  const play = () => {
    const start = context.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const noteStart = start + index * 0.13
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.055, noteStart + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.34)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.36)
    })
  }

  if (context.state === "suspended") {
    void context
      .resume()
      .then(play)
      .catch(() => undefined)
  } else {
    play()
  }
}
