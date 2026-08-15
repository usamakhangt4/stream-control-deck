import {useState, useEffect, useRef, useCallback} from "react"
import OBSWebSocket, {EventSubscription} from "obs-websocket-js"

export interface OBSAudioInput {
  inputName: string
  inputMuted: boolean
  inputVolumeDb: number
  peakLevel?: number // Normalized dB percentage (0 to 100%)
}

export interface OBSSceneItem {
  sceneItemId: number
  sourceName: string
  sceneItemEnabled: boolean
}

export interface OBSStats {
  fps: number
  cpuUsage: number
  memoryUsageMb: number
  bitrateKbps: number
  outputActive: boolean
  outputSkippedFrames: number
  outputTotalFrames: number
  outputCongestion: number
}

export function useOBS() {
  const obsRef = useRef<OBSWebSocket | null>(null)

  const lastBytesRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentScene, setCurrentScene] = useState<string>("")
  const [scenes, setScenes] = useState<string[]>([])
  const [audioInputs, setAudioInputs] = useState<OBSAudioInput[]>([])
  const [sceneItems, setSceneItems] = useState<OBSSceneItem[]>([])
  const [stats, setStats] = useState<OBSStats>({
    fps: 60,
    cpuUsage: 0,
    memoryUsageMb: 0,
    bitrateKbps: 0,
    outputActive: false,
    outputSkippedFrames: 0,
    outputTotalFrames: 0,
    outputCongestion: 0,
  })

  // Poll live telemetry & stream status from OBS
  const pollTelemetry = useCallback(async () => {
    if (!obsRef.current || !isConnected) return
    try {
      const statsRes = await obsRef.current.call("GetStats")
      const streamRes = await obsRef.current.call("GetStreamStatus")

      let calculatedBitrateKbps = 0
      const now = Date.now()

      if (streamRes.outputActive) {
        if (lastTimeRef.current > 0 && lastBytesRef.current > 0) {
          const timeDeltaSec = (now - lastTimeRef.current) / 1000
          const bytesDelta = streamRes.outputBytes - lastBytesRef.current
          if (timeDeltaSec > 0 && bytesDelta >= 0) {
            calculatedBitrateKbps = Math.round((bytesDelta * 8) / (timeDeltaSec * 1000))
          }
        }
        lastBytesRef.current = streamRes.outputBytes
        lastTimeRef.current = now
      } else {
        lastBytesRef.current = 0
        lastTimeRef.current = 0
      }

      setStats({
        fps: Math.round(statsRes.activeFps || 0),
        cpuUsage: Math.round(statsRes.cpuUsage || 0),
        memoryUsageMb: Math.round(statsRes.memoryUsage || 0),
        bitrateKbps: calculatedBitrateKbps,
        outputActive: streamRes.outputActive,
        outputSkippedFrames: streamRes.outputSkippedFrames || 0,
        outputTotalFrames: streamRes.outputTotalFrames || 0,
        outputCongestion: streamRes.outputCongestion || 0,
      })
      setIsStreaming(streamRes.outputActive)
    } catch {
      // Ignore telemetry errors during scene switching
    }
  }, [isConnected])

  const refreshSceneItems = useCallback(async (sceneName: string) => {
    if (!obsRef.current || !sceneName) return
    try {
      const res = await obsRef.current.call("GetSceneItemList", {sceneName})
      const items = res.sceneItems.map((item: any) => ({
        sceneItemId: item.sceneItemId,
        sourceName: item.sourceName as string,
        sceneItemEnabled: item.sceneItemEnabled as boolean,
      }))
      setSceneItems(items)
    } catch (err) {
      console.error("Failed to fetch scene items:", err)
    }
  }, [])

  const refreshOBSState = useCallback(async () => {
    if (!obsRef.current) return
    try {
      const sceneListRes = await obsRef.current.call("GetSceneList")
      const sceneNames = sceneListRes.scenes.map((s: any) => s.sceneName as string)
      setScenes(sceneNames)
      setCurrentScene(sceneListRes.currentProgramSceneName)

      if (sceneListRes.currentProgramSceneName) {
        refreshSceneItems(sceneListRes.currentProgramSceneName)
      }

      const inputsRes = await obsRef.current.call("GetInputList")
      const audioList: OBSAudioInput[] = []

      for (const input of inputsRes.inputs) {
        try {
          const muteRes = await obsRef.current.call("GetInputMute", {
            inputName: input.inputName as string,
          })
          const volRes = await obsRef.current.call("GetInputVolume", {
            inputName: input.inputName as string,
          })
          audioList.push({
            inputName: input.inputName as string,
            inputMuted: muteRes.inputMuted,
            inputVolumeDb: Math.round(volRes.inputVolumeDb || 0),
            peakLevel: 0,
          })
        } catch {
          // Input lacks audio channels
        }
      }
      setAudioInputs(audioList)
    } catch (err) {
      console.error("Error refreshing OBS state:", err)
    }
  }, [refreshSceneItems])

  const connect = useCallback(async () => {
    const host = localStorage.getItem("obs_host") || "localhost"
    const port = localStorage.getItem("obs_port") || "4455"
    const password = localStorage.getItem("obs_password") || ""
    const url = `ws://${host}:${port}`

    if (!obsRef.current) {
      obsRef.current = new OBSWebSocket()
    }

    try {
      // Connect with bitmask including high-volume InputVolumeMeters events
      await obsRef.current.connect(url, password || undefined, {
        eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
      })
      setIsConnected(true)
      await refreshOBSState()
    } catch (err) {
      setIsConnected(false)
      console.warn("OBS Connection offline:", err)
    }
  }, [refreshOBSState])

  useEffect(() => {
    connect()

    const obs = obsRef.current
    if (!obs) return

    const onSceneChanged = (data: any) => {
      setCurrentScene(data.sceneName)
      refreshSceneItems(data.sceneName)
    }

    const onMuteChanged = (data: any) => {
      setAudioInputs((prev) =>
        prev.map((a) =>
          a.inputName === data.inputName
            ? {...a, inputMuted: data.inputMuted, peakLevel: data.inputMuted ? 0 : a.peakLevel}
            : a
        )
      )
    }

    const onVolumeChanged = (data: any) => {
      setAudioInputs((prev) =>
        prev.map((a) =>
          a.inputName === data.inputName
            ? {...a, inputVolumeDb: Math.round(data.inputVolumeDb)}
            : a
        )
      )
    }

    const onSceneItemEnableChanged = (data: any) => {
      setSceneItems((prev) =>
        prev.map((item) =>
          item.sceneItemId === data.sceneItemId
            ? {...item, sceneItemEnabled: data.sceneItemEnabled}
            : item
        )
      )
    }

    const onStreamStateChanged = (data: any) => {
      setIsStreaming(data.outputActive)
    }

    // High-Frequency Audio Volume Meters Listener
    const onVolumeMeters = (data: any) => {
      if (!data.inputs || !Array.isArray(data.inputs)) return

      const updates = new Map<string, number>()
      for (const input of data.inputs) {
        let maxPeakMul = 0
        if (input.inputLevelsMul && Array.isArray(input.inputLevelsMul)) {
          for (const channel of input.inputLevelsMul) {
            if (Array.isArray(channel) && channel.length >= 2) {
              const peakMul = channel[1] // [0]=mag, [1]=peak, [2]=decay
              if (peakMul > maxPeakMul) maxPeakMul = peakMul
            }
          }
        }

        // Convert linear multiplier to logarithmic dB scale (-60 dB to 0 dB)
        let peakPercent = 0
        if (maxPeakMul > 0.00001) {
          const db = 20 * Math.log10(maxPeakMul)
          peakPercent = Math.min(100, Math.max(0, Math.round(((db + 60) / 60) * 100)))
        }

        updates.set(input.inputName, peakPercent)
      }

      setAudioInputs((prev) =>
        prev.map((a) => {
          if (updates.has(a.inputName)) {
            return {
              ...a,
              peakLevel: a.inputMuted ? 0 : updates.get(a.inputName) || 0,
            }
          }
          return a
        })
      )
    }

    obs.on("CurrentProgramSceneChanged", onSceneChanged)
    obs.on("InputMuteStateChanged", onMuteChanged)
    obs.on("InputVolumeChanged", onVolumeChanged)
    obs.on("SceneItemEnableStateChanged", onSceneItemEnableChanged)
    obs.on("StreamStateChanged", onStreamStateChanged)
    obs.on("InputVolumeMeters", onVolumeMeters)

    return () => {
      obs.off("CurrentProgramSceneChanged", onSceneChanged)
      obs.off("InputMuteStateChanged", onMuteChanged)
      obs.off("InputVolumeChanged", onVolumeChanged)
      obs.off("SceneItemEnableStateChanged", onSceneItemEnableChanged)
      obs.off("StreamStateChanged", onStreamStateChanged)
      obs.off("InputVolumeMeters", onVolumeMeters)
    }
  }, [connect, refreshSceneItems])

  useEffect(() => {
    if (!isConnected) return
    pollTelemetry()
    const interval = setInterval(pollTelemetry, 2000)
    return () => clearInterval(interval)
  }, [isConnected, pollTelemetry])

  const switchScene = async (sceneName: string) => {
    if (!obsRef.current || !isConnected) return
    await obsRef.current.call("SetCurrentProgramScene", {sceneName})
    setCurrentScene(sceneName)
  }

  const toggleMute = async (inputName: string) => {
    if (!obsRef.current || !isConnected) return
    const res = await obsRef.current.call("ToggleInputMute", {inputName})
    setAudioInputs((prev) =>
      prev.map((a) =>
        a.inputName === inputName ? {...a, inputMuted: res.inputMuted, peakLevel: 0} : a
      )
    )
  }

  const setVolumeDb = async (inputName: string, inputVolumeDb: number) => {
    if (!obsRef.current || !isConnected) return
    await obsRef.current.call("SetInputVolume", {inputName, inputVolumeDb})
    setAudioInputs((prev) =>
      prev.map((a) => (a.inputName === inputName ? {...a, inputVolumeDb} : a))
    )
  }

  const toggleItemVisibility = async (sceneItemId: number, enabled: boolean) => {
    if (!obsRef.current || !isConnected || !currentScene) return
    await obsRef.current.call("SetSceneItemEnabled", {
      sceneName: currentScene,
      sceneItemId,
      sceneItemEnabled: enabled,
    })
    setSceneItems((prev) =>
      prev.map((item) =>
        item.sceneItemId === sceneItemId ? {...item, sceneItemEnabled: enabled} : item
      )
    )
  }

  const startStream = async () => {
    if (!obsRef.current || !isConnected) return
    await obsRef.current.call("StartStream")
    setIsStreaming(true)
  }

  const stopStream = async () => {
    if (!obsRef.current || !isConnected) return
    await obsRef.current.call("StopStream")
    setIsStreaming(false)
  }

  return {
    isConnected,
    isStreaming,
    currentScene,
    scenes,
    audioInputs,
    sceneItems,
    stats,
    connect,
    switchScene,
    toggleMute,
    setVolumeDb,
    toggleItemVisibility,
    startStream,
    stopStream,
  }
}