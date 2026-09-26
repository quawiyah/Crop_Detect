import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND_HOST = "crop-disease-detector-8nqt.onrender.com";
const WS_URL = `wss://${BACKEND_HOST}/camera-stream`;
const API_URL = `https://${BACKEND_HOST}`;

const DEVICE_ID = "camera_01";
const LOCATION = "Field_A";

const DEFAULT_FOCUS = "General";
const DEFAULT_DETECTION_INTERVAL = 60000;
const MAX_LOG_LINES = 400;

const getInitialFocus = () =>
  localStorage.getItem("cameraFocus") || DEFAULT_FOCUS;

const getInitialInterval = () =>
  Number(localStorage.getItem("detectionIntervalMs")) ||
  DEFAULT_DETECTION_INTERVAL;

function getValidNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSoilMoistureStatus(value) {
  const moisture = Number(value);

  if (!Number.isFinite(moisture)) {
    return { label: "No data", type: "invalid" };
  }

  if (moisture < 20) {
    return { label: "DRY", type: "danger" };
  }

  if (moisture < 40) {
    return { label: "LOW", type: "warning" };
  }

  if (moisture <= 70) {
    return { label: "OPTIMAL", type: "success" };
  }

  return { label: "WET", type: "info" };
}

function formatConfidence(value) {
  let number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  if (number <= 1) {
    number *= 100;
  }

  return `${number.toFixed(1)}%`;
}

function normalizeDetection(json) {
  const results = Array.isArray(json.results) ? json.results : [];

  const top =
    json.topResult ||
    (results.length > 0 ? results[0] : null) ||
    {};

  const className =
    top.className ||
    json.topDetection ||
    json.disease ||
    json.label ||
    "Unknown";

  const probability =
    typeof top.probability === "number"
      ? top.probability
      : typeof json.topConfidence === "number"
        ? json.topConfidence / 100
        : typeof json.confidence === "number"
          ? json.confidence
          : 0;

  const domain = top.domain || json.topDomain || "UNKNOWN";
  const severity = top.severity || json.severity || "NONE";
  const healthStatus =
    top.healthStatus || json.healthStatus || "unknown";

  const treatment =
    top.treatment || json.treatment || json.advice || "--";

  const summary = json.summary || json.message || "";
  const whenToAct = top.whenToAct || json.whenToAct || "";

  const availableAiModes = Array.isArray(json.availableAiModes)
    ? json.availableAiModes
    : json.aiStack &&
        Array.isArray(json.aiStack.installedModes)
      ? json.aiStack.installedModes
      : [];

  const djlEngines = Array.isArray(json.djlEngines)
    ? json.djlEngines
    : json.aiStack && Array.isArray(json.aiStack.djlEngines)
      ? json.aiStack.djlEngines
      : [];

  const effectiveAiMode =
    json.aiMode && json.aiMode !== "Unavailable"
      ? json.aiMode
      : availableAiModes.length
        ? availableAiModes.join(" / ")
        : "AI pipeline";

  return {
    raw: json,
    className,
    probability,
    confidence: formatConfidence(probability),
    domain,
    severity,
    healthStatus,
    treatment,
    responseText: whenToAct
      ? `${treatment} — ${whenToAct}`
      : treatment,
    summary,
    whenToAct,
    availableAiModes,
    djlEngines,
    effectiveAiMode,
    results,
  };
}

export default function useSmartEyes() {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const fpsTimerRef = useRef(null);
  const detectionTimerRef = useRef(null);
  const currentVideoUrlRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const videoElementRef = useRef(null);

  const frameCountRef = useRef(0);
  const frameStartedAtRef = useRef(Date.now());

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  const [focus, setFocusState] = useState(getInitialFocus);
  const [detectionInterval, setDetectionIntervalState] =
    useState(getInitialInterval);

  const [streamUrl, setStreamUrl] = useState(null);
  const [fps, setFps] = useState(0);
  const [frameBytes, setFrameBytes] = useState(0);

  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    soilMoisture: null,
    soilStatus: null,
    updatedAt: null,
  });

  const [detection, setDetection] = useState(null);
  const [loadingDetection, setLoadingDetection] = useState(false);

  const [logs, setLogs] = useState([]);

  const addLog = useCallback((type, message) => {
    if (!mountedRef.current) return;

    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      time: new Date().toLocaleTimeString(),
    };

    setLogs((previous) => {
      const next = [...previous, entry];

      if (next.length > MAX_LOG_LINES) {
        return next.slice(next.length - MAX_LOG_LINES);
      }

      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog("info", "Logs cleared");
  }, [addLog]);

  const copyLogs = useCallback(async () => {
    const text = logs
      .map((log) => `[${log.time}] ${log.message}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      addLog("success", "Logs copied to clipboard");
    } catch {
      addLog("error", "Could not copy logs");
    }
  }, [logs, addLog]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatTimerRef.current = setInterval(() => {
      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  }, [stopHeartbeat]);

  const stopFpsCounter = useCallback(() => {
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }

    setFps(0);
  }, []);

  const startFpsCounter = useCallback(() => {
    stopFpsCounter();

    frameCountRef.current = 0;
    frameStartedAtRef.current = Date.now();

    fpsTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - frameStartedAtRef.current) / 1000;

      const currentFps =
        elapsed > 0 ? frameCountRef.current / elapsed : 0;

      setFps(currentFps);

      frameCountRef.current = 0;
      frameStartedAtRef.current = now;
    }, 2000);
  }, [stopFpsCounter]);

  const updateSensorData = useCallback(
    (temperature, humidity, soilMoisture, soilStatusFromServer) => {
      const t = getValidNumber(temperature);
      const h = getValidNumber(humidity);
      const s = getValidNumber(soilMoisture);

      setSensorData((previous) => ({
        temperature:
          t !== null ? t : previous.temperature,
        humidity:
          h !== null ? h : previous.humidity,
        soilMoisture:
          s !== null ? Math.max(0, Math.min(100, s))
            : previous.soilMoisture,
        soilStatus:
          soilStatusFromServer || previous.soilStatus,
        updatedAt:
          t !== null || h !== null || s !== null
            ? new Date()
            : previous.updatedAt,
      }));

      if (t !== null || h !== null || s !== null) {
        const soilText =
          s !== null ? s.toFixed(1) : "--";

        addLog(
          "sensor",
          `🌡️ ${t !== null ? t.toFixed(1) : "--"}°C | 💧 ${
            h !== null ? h.toFixed(1) : "--"
          }% | 🌱 Soil: ${soilText}%`
        );
      }
    },
    [addLog]
  );

  const handleDetectionMessage = useCallback(
    (json) => {
      const result = normalizeDetection(json);

      setDetection(result);

      addLog(
        "ai",
        `Detection: ${result.className} (${result.confidence}) [${result.domain}]`
      );
    },
    [addLog]
  );

  const hasSensorData = useCallback((json) => {
    return (
      json &&
      (json.temperature !== undefined ||
        json.humidity !== undefined ||
        json.soilMoisture !== undefined)
    );
  }, []);

  const handleMessage = useCallback(
    (rawMessage) => {
      let json;

      try {
        json = JSON.parse(String(rawMessage));
      } catch {
        addLog("info", String(rawMessage));
        return;
      }

      if (!json || typeof json !== "object") {
        return;
      }

      const type =
        json.type ||
        json.messageType ||
        json.event;

      switch (type) {
        case "pong":
          addLog("info", "Heartbeat received");
          break;

        case "ping":
          if (
            socketRef.current?.readyState ===
            WebSocket.OPEN
          ) {
            socketRef.current.send(
              JSON.stringify({ type: "pong" })
            );
          }
          break;

        case "system":
          addLog(
            "info",
            json.message || "System message"
          );
          break;

        case "register":
        case "device_registered":
          addLog(
            "success",
            "Device registered successfully"
          );
          break;

        case "focus_set":
          addLog(
            "info",
            `Focus acknowledged: ${json.focus || "?"}`
          );
          break;

        case "sensor_data":
        case "sensor_update":
          updateSensorData(
            json.temperature,
            json.humidity,
            json.soilMoisture,
            json.soilStatus
          );
          break;

        case "status":
        case "status_response":
          if (hasSensorData(json)) {
            updateSensorData(
              json.temperature,
              json.humidity,
              json.soilMoisture,
              json.soilStatus
            );
          }

          addLog("info", "Device status received");
          break;

        case "command_response":
          addLog(
            "info",
            json.message ||
              `Command: ${json.command || "?"}`
          );

          if (hasSensorData(json)) {
            updateSensorData(
              json.temperature,
              json.humidity,
              json.soilMoisture,
              json.soilStatus
            );
          }
          break;

        case "detection":
        case "comprehensive_detection":
        case "universal_detection":
          handleDetectionMessage(json);
          break;

        case "echo":
          addLog(
            "info",
            json.message || "Echo received"
          );
          break;

        default:
          if (hasSensorData(json)) {
            updateSensorData(
              json.temperature,
              json.humidity,
              json.soilMoisture,
              json.soilStatus
            );
          } else {
            addLog("info", JSON.stringify(json));
          }
      }
    },
    [
      addLog,
      hasSensorData,
      handleDetectionMessage,
      updateSensorData,
    ]
  );

  const handleVideoBlob = useCallback(
    (blob) => {
      if (!blob || blob.size === 0) return;

      frameCountRef.current += 1;
      setFrameBytes(blob.size);

      const imageBlob = blob.type
        ? blob
        : new Blob([blob], {
            type: "image/jpeg",
          });

      const nextUrl =
        URL.createObjectURL(imageBlob);

      if (currentVideoUrlRef.current) {
        URL.revokeObjectURL(
          currentVideoUrlRef.current
        );
      }

      currentVideoUrlRef.current = nextUrl;
      setStreamUrl(nextUrl);
      setStreamActive(true);
    },
    []
  );

  const registerDevice = useCallback(() => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "register",
        deviceId: DEVICE_ID,
        device_id: DEVICE_ID,
        location: LOCATION,
        focus,
        cropType: focus,
      })
    );

    addLog(
      "info",
      `Registered device (focus: ${focus})`
    );
  }, [focus, addLog]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const delay = Math.min(
      30000,
      1500 *
        Math.pow(
          1.6,
          reconnectAttemptsRef.current
        )
    );

    reconnectAttemptsRef.current += 1;

    addLog(
      "info",
      `Reconnecting in ${Math.round(
        delay / 1000
      )}s …`
    );

    reconnectTimerRef.current =
      setTimeout(() => {
        connectWebSocket();
      }, delay);
  }, [addLog]);

  const connectWebSocket = useCallback(() => {
    const current = socketRef.current;

    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setConnecting(true);
    addLog("info", `Connecting to ${WS_URL} …`);

    let socket;

    try {
      socket = new WebSocket(WS_URL);
    } catch (error) {
      setConnecting(false);

      addLog(
        "error",
        `WebSocket creation failed: ${
          error?.message || error
        }`
      );

      scheduleReconnect();
      return;
    }

    socket.binaryType = "blob";
    socketRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;

      setConnected(true);
      setConnecting(false);

      addLog("success", "WebSocket connected");

      registerDevice();
      startHeartbeat();
      startFpsCounter();
    };

    socket.onclose = (event) => {
      setConnected(false);
      setConnecting(false);

      stopHeartbeat();
      stopFpsCounter();

      addLog(
        "error",
        `WebSocket closed (code ${event.code})`
      );

      scheduleReconnect();
    };

    socket.onerror = () => {
      addLog("error", "WebSocket error");
    };

    socket.onmessage = (event) => {
      if (event.data instanceof Blob) {
        handleVideoBlob(event.data);
        return;
      }

      if (event.data instanceof ArrayBuffer) {
        handleVideoBlob(
          new Blob([event.data], {
            type: "image/jpeg",
          })
        );
        return;
      }

      if (typeof event.data === "string") {
        handleMessage(event.data);
      }
    };
  }, [
    addLog,
    handleMessage,
    handleVideoBlob,
    registerDevice,
    scheduleReconnect,
    startFpsCounter,
    startHeartbeat,
    stopFpsCounter,
    stopHeartbeat,
  ]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const socket = socketRef.current;

    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
      socketRef.current = null;
    }

    stopHeartbeat();
    stopFpsCounter();

    setConnected(false);
    setConnecting(false);

    addLog("info", "WebSocket disconnected");
  }, [addLog, stopFpsCounter, stopHeartbeat]);

  const startStream = useCallback(() => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      addLog("error", "WebSocket not connected");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "start_stream",
        device_id: DEVICE_ID,
      })
    );

    setStreamActive(true);
    addLog("success", "Start stream command sent");
  }, [addLog]);

  const stopPeriodicDetection = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
  }, []);

  const captureCurrentFrame = useCallback(async () => {
    const image = videoElementRef.current;

    if (!image || !image.naturalWidth) {
      return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    try {
      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } catch (error) {
      addLog(
        "error",
        `Failed to draw video frame: ${
          error?.message || error
        }`
      );

      return null;
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.85
      );
    });
  }, [addLog]);

  const sendImageForDetection = useCallback(
    async (file) => {
      if (!file) return;

      setLoadingDetection(true);

      try {
        const formData = new FormData();

        formData.append("image", file);
        formData.append("device_id", DEVICE_ID);
        formData.append("focus", focus);
        formData.append("cropType", focus);

        const response = await fetch(
          `${API_URL}/api/detect/image`,
          {
            method: "POST",
            body: formData,
          }
        );

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Server returned an invalid response"
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error || "Detection failed"
          );
        }

        handleDetectionMessage(data);
        addLog(
          "success",
          "Detection completed"
        );
      } catch (error) {
        addLog(
          "error",
          `Detection error: ${
            error?.message || error
          }`
        );
      } finally {
        setLoadingDetection(false);
      }
    },
    [focus, handleDetectionMessage, addLog]
  );

  const runPeriodicDetection = useCallback(async () => {
    if (!streamActive) return;

    const blob = await captureCurrentFrame();

    if (!blob || blob.size === 0) {
      return;
    }

    const file = new File(
      [blob],
      "stream_capture.jpg",
      {
        type: blob.type || "image/jpeg",
      }
    );

    await sendImageForDetection(file);

    addLog(
      "info",
      "Periodic capture sent for detection"
    );
  }, [
    addLog,
    captureCurrentFrame,
    sendImageForDetection,
    streamActive,
  ]);

  const startPeriodicDetection = useCallback(() => {
    stopPeriodicDetection();

    if (!streamActive) return;

    detectionTimerRef.current = setInterval(
      runPeriodicDetection,
      detectionInterval
    );
  }, [
    detectionInterval,
    runPeriodicDetection,
    stopPeriodicDetection,
    streamActive,
  ]);

  const stopStream = useCallback(() => {
    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "stop_stream",
          device_id: DEVICE_ID,
        })
      );
    }

    setStreamActive(false);
    stopPeriodicDetection();
    setStreamUrl(null);

    if (currentVideoUrlRef.current) {
      URL.revokeObjectURL(
        currentVideoUrlRef.current
      );
      currentVideoUrlRef.current = null;
    }

    addLog("info", "Stop stream command sent");
  }, [addLog, stopPeriodicDetection]);

  const captureImage = useCallback(() => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      addLog("error", "WebSocket not connected");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "capture",
        device_id: DEVICE_ID,
      })
    );

    addLog("info", "Capture command sent");
  }, [addLog]);

  const getStatus = useCallback(() => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      addLog("error", "WebSocket not connected");
      return;
    }

    socket.send(
      JSON.stringify({ type: "status" })
    );

    addLog("info", "Status request sent");
  }, [addLog]);

  const requestSensorData = useCallback(() => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      addLog("error", "WebSocket not connected");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "get_sensor",
        device_id: DEVICE_ID,
      })
    );

    addLog("sensor", "Sensor data requested");
  }, [addLog]);

  const setFocus = useCallback(
    (value) => {
      const nextFocus = value || DEFAULT_FOCUS;

      setFocusState(nextFocus);
      localStorage.setItem(
        "cameraFocus",
        nextFocus
      );

      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "set_focus",
            focus: nextFocus,
          })
        );

        addLog(
          "info",
          `Focus changed → ${nextFocus}`
        );
      }
    },
    [addLog]
  );

  const setDetectionInterval = useCallback(
    (value) => {
      const nextValue = Number(value);

      if (
        !Number.isFinite(nextValue) ||
        nextValue < 1000
      ) {
        addLog(
          "error",
          "Detection interval must be at least 1000 ms"
        );
        return false;
      }

      setDetectionIntervalState(nextValue);

      localStorage.setItem(
        "detectionIntervalMs",
        String(nextValue)
      );

      addLog(
        "info",
        `Detection interval updated to ${nextValue} ms`
      );

      return true;
    },
    [addLog]
  );

  const processImageFile = useCallback(
    (file) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        addLog(
          "error",
          "Please select an image file"
        );
        return;
      }

      sendImageForDetection(file);
    },
    [addLog, sendImageForDetection]
  );

  useEffect(() => {
    mountedRef.current = true;

    addLog(
      "info",
      "smartEyes control center starting…"
    );

    connectWebSocket();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(
          reconnectTimerRef.current
        );
      }

      stopHeartbeat();
      stopFpsCounter();
      stopPeriodicDetection();

      const socket = socketRef.current;

      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      }

      socketRef.current = null;

      if (currentVideoUrlRef.current) {
        URL.revokeObjectURL(
          currentVideoUrlRef.current
        );
      }
    };
  }, [
    addLog,
    connectWebSocket,
    stopFpsCounter,
    stopHeartbeat,
    stopPeriodicDetection,
  ]);

  useEffect(() => {
    if (streamActive) {
      startPeriodicDetection();
    } else {
      stopPeriodicDetection();
    }

    return stopPeriodicDetection;
  }, [
    streamActive,
    detectionInterval,
    startPeriodicDetection,
    stopPeriodicDetection,
  ]);

  return {
    deviceId: DEVICE_ID,
    location: LOCATION,
    wsUrl: WS_URL,

    connected,
    connecting,
    streamActive,

    focus,
    detectionInterval,

    streamUrl,
    fps,
    frameBytes,

    sensorData,
    detection,
    loadingDetection,

    logs,

    videoElementRef,

    connectWebSocket,
    disconnectWebSocket,

    startStream,
    stopStream,
    captureImage,
    getStatus,
    requestSensorData,

    setFocus,
    setDetectionInterval,

    processImageFile,

    clearLogs,
    copyLogs,
  };
}
