import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ApiConfig from "../config/ApiConfig";

const API_URL = ApiConfig.getBaseUrl();
const BACKEND_HOST = new URL(API_URL).host;

const LOCATION = "Field_A";

const DEFAULT_FOCUS = "General";
const DEFAULT_DETECTION_INTERVAL = 60000;
const MAX_LOG_LINES = 400;

const HEARTBEAT_INTERVAL = 5000;
const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

/* =========================================================
   CAMERA HELPERS
========================================================= */

const getCameraMacAddress = () => {
  return localStorage.getItem("cameraMacAddress") || "";
};

const normalizeMacAddress = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "");
};

const formatMacAddress = (value) => {
  const normalized = normalizeMacAddress(value);

  if (normalized.length !== 12) {
    return value || "";
  }

  return normalized
    .match(/.{1,2}/g)
    .join(":");
};


const getDeviceIdFromMac = (macAddress) => {
  const formattedMac =
    formatMacAddress(macAddress);

  if (!formattedMac) {
    return "camera_01";
  }

  return formattedMac;
};

const getWebSocketUrl = (macAddress) => {
  const formattedMac =
    formatMacAddress(macAddress);

  if (!formattedMac) {
    return `wss://${BACKEND_HOST}/camera-stream`;
  }

  return `wss://${BACKEND_HOST}/camera-stream/${encodeURIComponent(
    formattedMac
  )}`;
};

const getInitialFocus = () => {
  return (
    localStorage.getItem("cameraFocus") ||
    DEFAULT_FOCUS
  );
};

const getInitialInterval = () => {
  return (
    Number(
      localStorage.getItem(
        "detectionIntervalMs"
      )
    ) || DEFAULT_DETECTION_INTERVAL
  );
};

/* =========================================================
   GENERAL HELPERS
========================================================= */

function getValidNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
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
  const results = Array.isArray(json.results)
    ? json.results
    : [];

  const top =
    json.topResult ||
    (results.length > 0
      ? results[0]
      : null) ||
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

  const domain =
    top.domain ||
    json.topDomain ||
    "UNKNOWN";

  const severity =
    top.severity ||
    json.severity ||
    "NONE";

  const healthStatus =
    top.healthStatus ||
    json.healthStatus ||
    "unknown";

  const treatment =
    top.treatment ||
    json.treatment ||
    json.advice ||
    "--";

  const summary =
    json.summary ||
    json.message ||
    "";

  const whenToAct =
    top.whenToAct ||
    json.whenToAct ||
    "";

  const availableAiModes =
    Array.isArray(json.availableAiModes)
      ? json.availableAiModes
      : json.aiStack &&
          Array.isArray(
            json.aiStack.installedModes
          )
        ? json.aiStack.installedModes
        : [];

  const djlEngines =
    Array.isArray(json.djlEngines)
      ? json.djlEngines
      : json.aiStack &&
          Array.isArray(
            json.aiStack.djlEngines
          )
        ? json.aiStack.djlEngines
        : [];

  const effectiveAiMode =
    json.aiMode &&
    json.aiMode !== "Unavailable"
      ? json.aiMode
      : availableAiModes.length
        ? availableAiModes.join(" / ")
        : "AI pipeline";

  return {
    raw: json,
    className,
    probability,
    confidence:
      formatConfidence(probability),
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

/* =========================================================
   HOOK
========================================================= */

export default function useSmartEyes() {
  /* =======================================================
     REFS
  ======================================================= */

  const socketRef = useRef(null);

  const reconnectTimerRef =
    useRef(null);

  const heartbeatTimerRef =
    useRef(null);

  const fpsTimerRef =
    useRef(null);

  const detectionTimerRef =
    useRef(null);

  const currentVideoUrlRef =
    useRef(null);

  const reconnectAttemptsRef =
    useRef(0);

  const mountedRef =
    useRef(false);

  const intentionalDisconnectRef =
    useRef(false);

  const videoElementRef =
    useRef(null);

  const frameCountRef =
    useRef(0);

  const frameStartedAtRef =
    useRef(Date.now());

  const focusRef = useRef(
    getInitialFocus()
  );

  /* =======================================================
     CAMERA INFORMATION
  ======================================================= */

  const macAddress = formatMacAddress(
    getCameraMacAddress()
  );

  const deviceId =
    getDeviceIdFromMac(macAddress);

  const wsUrl =
    getWebSocketUrl(macAddress);

  /* =======================================================
     STATE
  ======================================================= */

  const [connected, setConnected] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [streamActive, setStreamActive] =
    useState(false);

  const [focus, setFocusState] =
    useState(getInitialFocus);

  const [
    detectionInterval,
    setDetectionIntervalState,
  ] = useState(getInitialInterval);

  const [streamUrl, setStreamUrl] =
    useState(null);

  const [fps, setFps] =
    useState(0);

  const [frameBytes, setFrameBytes] =
    useState(0);

  const [sensorData, setSensorData] =
    useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
      soilStatus: null,
      updatedAt: null,
    });

  const [detection, setDetection] =
    useState(null);

  const [
    loadingDetection,
    setLoadingDetection,
  ] = useState(false);

  const [logs, setLogs] =
    useState([]);

  /* =======================================================
     LOGGING
  ======================================================= */

  const addLog = useCallback(
    (type, message) => {
      if (!mountedRef.current) {
        return;
      }

      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        time: new Date().toLocaleTimeString(),
      };

      setLogs((previous) => {
        const next = [
          ...previous,
          entry,
        ];

        if (
          next.length >
          MAX_LOG_LINES
        ) {
          return next.slice(
            next.length -
              MAX_LOG_LINES
          );
        }

        return next;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const copyLogs = useCallback(
    async () => {
      const text = logs
        .map(
          (log) =>
            `[${log.time}] ${log.message}`
        )
        .join("\n");

      try {
        await navigator.clipboard.writeText(
          text
        );

        addLog(
          "success",
          "Logs copied to clipboard"
        );
      } catch {
        addLog(
          "error",
          "Could not copy logs"
        );
      }
    },
    [logs, addLog]
  );

  /* =======================================================
     HEARTBEAT
  ======================================================= */

  const stopHeartbeat =
    useCallback(() => {
      if (
        heartbeatTimerRef.current
      ) {
        clearInterval(
          heartbeatTimerRef.current
        );

        heartbeatTimerRef.current =
          null;
      }
    }, []);

  const startHeartbeat =
    useCallback(() => {
      stopHeartbeat();

      heartbeatTimerRef.current =
        setInterval(() => {
          const socket =
            socketRef.current;

          if (
            socket?.readyState ===
            WebSocket.OPEN
          ) {
            socket.send(
              JSON.stringify({
                type: "ping",

                device_id:
                  deviceId,

                deviceId:
                  deviceId,

                macAddress:
                  macAddress,
              })
            );

            addLog(
              "info",
              "Heartbeat sent"
            );
          }
        }, HEARTBEAT_INTERVAL);
    }, [
      stopHeartbeat,
      deviceId,
      macAddress,
      addLog,
    ]);

  /* =======================================================
     FPS
  ======================================================= */

  const stopFpsCounter =
    useCallback(() => {
      if (fpsTimerRef.current) {
        clearInterval(
          fpsTimerRef.current
        );

        fpsTimerRef.current =
          null;
      }

      setFps(0);
    }, []);

  const startFpsCounter =
    useCallback(() => {
      stopFpsCounter();

      frameCountRef.current = 0;
      frameStartedAtRef.current =
        Date.now();

      fpsTimerRef.current =
        setInterval(() => {
          const now =
            Date.now();

          const elapsed =
            (now -
              frameStartedAtRef.current) /
            1000;

          const currentFps =
            elapsed > 0
              ? frameCountRef.current /
                elapsed
              : 0;

          setFps(currentFps);

          frameCountRef.current = 0;
          frameStartedAtRef.current =
            now;
        }, 2000);
    }, [stopFpsCounter]);

  /* =======================================================
     SENSOR DATA
  ======================================================= */

  const updateSensorData =
    useCallback(
      (
        temperature,
        humidity,
        soilMoisture,
        soilStatusFromServer
      ) => {
        const t =
          getValidNumber(
            temperature
          );

        const h =
          getValidNumber(
            humidity
          );

        const s =
          getValidNumber(
            soilMoisture
          );

        setSensorData(
          (previous) => ({
            temperature:
              t !== null
                ? t
                : previous.temperature,

            humidity:
              h !== null
                ? h
                : previous.humidity,

            soilMoisture:
              s !== null
                ? Math.max(
                    0,
                    Math.min(100, s)
                  )
                : previous.soilMoisture,

            soilStatus:
              soilStatusFromServer ||
              previous.soilStatus,

            updatedAt:
              t !== null ||
              h !== null ||
              s !== null
                ? new Date()
                : previous.updatedAt,
          })
        );

        if (
          t !== null ||
          h !== null ||
          s !== null
        ) {
          addLog(
            "sensor",
            `🌡️ ${
              t !== null
                ? t.toFixed(1)
                : "--"
            }°C | 💧 ${
              h !== null
                ? h.toFixed(1)
                : "--"
            }% | 🌱 Soil: ${
              s !== null
                ? s.toFixed(1)
                : "--"
            }%`
          );
        }
      },
      [addLog]
    );

  /* =======================================================
     DETECTION
  ======================================================= */

  const handleDetectionMessage =
    useCallback(
      (json) => {
        const result =
          normalizeDetection(json);

        setDetection(result);

        addLog(
          "ai",
          `Detection: ${result.className} (${result.confidence}) [${result.domain}]`
        );
      },
      [addLog]
    );

  /* =======================================================
     MESSAGE HELPERS
  ======================================================= */

  const hasSensorData =
    useCallback((json) => {
      return (
        json &&
        (json.temperature !==
          undefined ||
          json.humidity !==
            undefined ||
          json.soilMoisture !==
            undefined)
      );
    }, []);

  const handleMessage =
    useCallback(
      (rawMessage) => {
        let json;

        try {
          json = JSON.parse(
            String(rawMessage)
          );
        } catch {
          addLog(
            "info",
            String(rawMessage)
          );

          return;
        }

        if (
          !json ||
          typeof json !==
            "object"
        ) {
          return;
        }

        const type =
          json.type ||
          json.messageType ||
          json.event;

        switch (type) {
          case "pong":
            addLog(
              "info",
              "Heartbeat received"
            );
            break;

          case "ping":
            if (
              socketRef.current
                ?.readyState ===
              WebSocket.OPEN
            ) {
              socketRef.current.send(
                JSON.stringify({
                  type: "pong",

                  device_id:
                    deviceId,

                  deviceId:
                    deviceId,

                  macAddress:
                    macAddress,
                })
              );
            }
            break;

          case "system":
            addLog(
              "info",
              json.message ||
                "System message"
            );
            break;

          case "register":
          case "device_registered":
          case "registration_success":
            addLog(
              "success",
              "Camera registered successfully"
            );
            break;

          case "focus_set":
            addLog(
              "info",
              `Focus acknowledged: ${
                json.focus || "?"
              }`
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
            if (
              hasSensorData(json)
            ) {
              updateSensorData(
                json.temperature,
                json.humidity,
                json.soilMoisture,
                json.soilStatus
              );
            }

            addLog(
              "info",
              "Device status received"
            );
            break;

          case "command_response":
            addLog(
              "info",
              json.message ||
                `Command: ${
                  json.command ||
                  "?"
                }`
            );

            if (
              hasSensorData(json)
            ) {
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
            handleDetectionMessage(
              json
            );
            break;

          case "echo":
            addLog(
              "info",
              json.message ||
                "Echo received"
            );
            break;

          case "error":
            addLog(
              "error",
              json.message ||
                "WebSocket server error"
            );
            break;

          default:
            if (
              hasSensorData(json)
            ) {
              updateSensorData(
                json.temperature,
                json.humidity,
                json.soilMoisture,
                json.soilStatus
              );
            } else {
              addLog(
                "info",
                JSON.stringify(json)
              );
            }
        }
      },
      [
        addLog,
        deviceId,
        macAddress,
        hasSensorData,
        handleDetectionMessage,
        updateSensorData,
      ]
    );

  /* =======================================================
     VIDEO FRAME
  ======================================================= */

  const handleVideoBlob =
    useCallback((blob) => {
      if (
        !blob ||
        blob.size === 0
      ) {
        return;
      }

      frameCountRef.current += 1;

      setFrameBytes(blob.size);

      const imageBlob = blob.type
        ? blob
        : new Blob([blob], {
            type: "image/jpeg",
          });

      const nextUrl =
        URL.createObjectURL(
          imageBlob
        );

      if (
        currentVideoUrlRef.current
      ) {
        URL.revokeObjectURL(
          currentVideoUrlRef.current
        );
      }

      currentVideoUrlRef.current =
        nextUrl;

      setStreamUrl(nextUrl);
      setStreamActive(true);
    }, []);

  /* =======================================================
     REGISTER CAMERA
  ======================================================= */

  const registerDevice =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState !==
        WebSocket.OPEN
      ) {
        return;
      }

      const currentFocus =
        focusRef.current;

      const registrationPayload = {
        type: "register",

        deviceId:
          deviceId,

        device_id:
          deviceId,

        macAddress:
          macAddress,

        location:
          LOCATION,

        focus:
          currentFocus,

        cropType:
          currentFocus,
      };

      addLog(
        "info",
        `Sending registration for ${macAddress}`
      );

      socket.send(
        JSON.stringify(
          registrationPayload
        )
      );
    }, [
      deviceId,
      macAddress,
      addLog,
    ]);

  /* =======================================================
     RECONNECT
  ======================================================= */

  const scheduleReconnect =
    useCallback(() => {
      if (
        !mountedRef.current ||
        intentionalDisconnectRef.current
      ) {
        return;
      }

      if (
        reconnectTimerRef.current
      ) {
        return;
      }

      const delay = Math.min(
        MAX_RECONNECT_DELAY,
        INITIAL_RECONNECT_DELAY *
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
          reconnectTimerRef.current =
            null;

          if (
            mountedRef.current &&
            !intentionalDisconnectRef.current
          ) {
            connectWebSocket();
          }
        }, delay);
    }, [addLog]);

  /* =======================================================
     CONNECT WEBSOCKET
  ======================================================= */

  const connectWebSocket =
    useCallback(() => {
      if (
        intentionalDisconnectRef.current
      ) {
        intentionalDisconnectRef.current =
          false;
      }

      const current =
        socketRef.current;

      if (
        current &&
        (current.readyState ===
          WebSocket.OPEN ||
          current.readyState ===
            WebSocket.CONNECTING)
      ) {
        return;
      }

      if (!macAddress) {
        setConnecting(false);

        addLog(
          "error",
          "No camera MAC address configured"
        );

        return;
      }

      setConnecting(true);

      addLog(
        "info",
        `Connecting to camera ${macAddress} …`
      );

      let socket;

      try {
        socket =
          new WebSocket(wsUrl);
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

      socket.binaryType =
        "blob";

      socketRef.current =
        socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;

        setConnected(true);
        setConnecting(false);

        addLog(
          "success",
          `WebSocket connected to ${macAddress}`
        );


        registerDevice();

        startHeartbeat();
        startFpsCounter();
      };

      socket.onmessage = (
        event
      ) => {
        if (
          event.data instanceof Blob
        ) {
          handleVideoBlob(
            event.data
          );

          return;
        }

        if (
          event.data instanceof
          ArrayBuffer
        ) {
          handleVideoBlob(
            new Blob(
              [event.data],
              {
                type: "image/jpeg",
              }
            )
          );

          return;
        }

        if (
          typeof event.data ===
          "string"
        ) {
          handleMessage(
            event.data
          );
        }
      };

      socket.onerror = () => {
        addLog(
          "error",
          "WebSocket error occurred"
        );
      };

      socket.onclose = (
        event
      ) => {
        setConnected(false);
        setConnecting(false);

        stopHeartbeat();
        stopFpsCounter();

        addLog(
          "error",
          `WebSocket closed (code ${
            event.code
          }, reason: ${
            event.reason ||
            "No reason provided"
          }, clean: ${
            event.wasClean
          })`
        );

        if (
          socketRef.current ===
          socket
        ) {
          socketRef.current =
            null;
        }

        if (
          mountedRef.current &&
          !intentionalDisconnectRef.current
        ) {
          scheduleReconnect();
        }
      };
    }, [
      addLog,
      handleMessage,
      handleVideoBlob,
      macAddress,
      registerDevice,
      scheduleReconnect,
      startFpsCounter,
      startHeartbeat,
      stopFpsCounter,
      stopHeartbeat,
      wsUrl,
    ]);

  /* =======================================================
     DISCONNECT
  ======================================================= */

  const disconnectWebSocket =
    useCallback(() => {
      intentionalDisconnectRef.current =
        true;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current
        );

        reconnectTimerRef.current =
          null;
      }

      const socket =
        socketRef.current;

      if (socket) {
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;

        if (
          socket.readyState ===
            WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close(
            1000,
            "Client disconnected"
          );
        }

        socketRef.current =
          null;
      }

      stopHeartbeat();
      stopFpsCounter();

      setConnected(false);
      setConnecting(false);

      addLog(
        "info",
        "WebSocket disconnected"
      );
    }, [
      addLog,
      stopFpsCounter,
      stopHeartbeat,
    ]);

  /* =======================================================
     START STREAM
  ======================================================= */

  const startStream =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState !==
        WebSocket.OPEN
      ) {
        addLog(
          "error",
          "WebSocket not connected"
        );

        return;
      }

      socket.send(
        JSON.stringify({
          type: "start_stream",

          device_id:
            deviceId,

          deviceId:
            deviceId,

          macAddress:
            macAddress,
        })
      );

      setStreamActive(true);

      addLog(
        "success",
        "Start stream command sent"
      );
    }, [
      addLog,
      deviceId,
      macAddress,
    ]);

  /* =======================================================
     STOP PERIODIC DETECTION
  ======================================================= */

  const stopPeriodicDetection =
    useCallback(() => {
      if (
        detectionTimerRef.current
      ) {
        clearInterval(
          detectionTimerRef.current
        );

        detectionTimerRef.current =
          null;
      }
    }, []);

  /* =======================================================
     CAPTURE CURRENT FRAME
  ======================================================= */

  const captureCurrentFrame =
    useCallback(async () => {
      const image =
        videoElementRef.current;

      if (
        !image ||
        !image.naturalWidth
      ) {
        return null;
      }

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        image.naturalWidth;

      canvas.height =
        image.naturalHeight;

      const context =
        canvas.getContext("2d");

      if (!context) {
        return null;
      }

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

      return new Promise(
        (resolve) => {
          canvas.toBlob(
            (blob) =>
              resolve(blob),
            "image/jpeg",
            0.85
          );
        }
      );
    }, [addLog]);

  /* =======================================================
     SEND IMAGE FOR DETECTION
  ======================================================= */

  const sendImageForDetection =
    useCallback(
      async (file) => {
        if (!file) {
          return;
        }

        setLoadingDetection(true);

        try {
          const formData =
            new FormData();

          formData.append(
            "image",
            file
          );

          const user = JSON.parse(
            localStorage.getItem("user") || "{}"
          );
          const profileEmail = user.email || "";
          const profileLocation =
            user.farmLocation ||
            user.location ||
            "Abuja";
          const selectedFocus =
            focusRef.current || "crop";

          formData.append(
            "device_id",
            deviceId
          );

          formData.append(
            "deviceId",
            deviceId
          );

          formData.append(
            "macAddress",
            macAddress
          );

          formData.append(
            "focus",
            selectedFocus
          );

          formData.append(
            "cropType",
            selectedFocus
          );

          formData.append(
            "email",
            profileEmail
          );

          formData.append(
            "location",
            profileLocation
          );

          const detectionUrl = new URL(
            `${API_URL}/api/detect/image`
          );
          detectionUrl.searchParams.set(
            "focus",
            selectedFocus
          );
          detectionUrl.searchParams.set(
            "cropType",
            selectedFocus
          );
          if (profileEmail) {
            detectionUrl.searchParams.set(
              "email",
              profileEmail
            );
          }
          if (deviceId) {
            detectionUrl.searchParams.set(
              "deviceId",
              deviceId
            );
          }
          if (profileLocation) {
            detectionUrl.searchParams.set(
              "location",
              profileLocation
            );
          }

          const response =
            await fetch(
              detectionUrl,
              {
                method: "POST",
                body: formData,
              }
            );

          let data;

          try {
            data =
              await response.json();
          } catch {
            throw new Error(
              "Server returned an invalid response"
            );
          }

          if (!response.ok) {
            throw new Error(
              data?.error ||
                "Detection failed"
            );
          }

          handleDetectionMessage(
            data
          );

          addLog(
            "success",
            "Detection completed"
          );
        } catch (error) {
          addLog(
            "error",
            `Detection error: ${
              error?.message ||
              error
            }`
          );
        } finally {
          setLoadingDetection(
            false
          );
        }
      },
      [
        deviceId,
        macAddress,
        handleDetectionMessage,
        addLog,
      ]
    );

  /* =======================================================
     PERIODIC DETECTION
  ======================================================= */

  const runPeriodicDetection =
    useCallback(async () => {
      if (!streamActive) {
        return;
      }

      const blob =
        await captureCurrentFrame();

      if (
        !blob ||
        blob.size === 0
      ) {
        return;
      }

      const file = new File(
        [blob],
        "stream_capture.jpg",
        {
          type:
            blob.type ||
            "image/jpeg",
        }
      );

      await sendImageForDetection(
        file
      );

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

  const startPeriodicDetection =
    useCallback(() => {
      stopPeriodicDetection();

      if (!streamActive) {
        return;
      }

      detectionTimerRef.current =
        setInterval(
          runPeriodicDetection,
          detectionInterval
        );
    }, [
      detectionInterval,
      runPeriodicDetection,
      stopPeriodicDetection,
      streamActive,
    ]);

  /* =======================================================
     STOP STREAM
  ======================================================= */

  const stopStream =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState ===
        WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "stop_stream",

            device_id:
              deviceId,

            deviceId:
              deviceId,

            macAddress:
              macAddress,
          })
        );
      }

      setStreamActive(false);

      stopPeriodicDetection();

      setStreamUrl(null);

      if (
        currentVideoUrlRef.current
      ) {
        URL.revokeObjectURL(
          currentVideoUrlRef.current
        );

        currentVideoUrlRef.current =
          null;
      }

      addLog(
        "info",
        "Stop stream command sent"
      );
    }, [
      addLog,
      deviceId,
      macAddress,
      stopPeriodicDetection,
    ]);

  /* =======================================================
     CAPTURE IMAGE
  ======================================================= */

  const captureImage =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState !==
        WebSocket.OPEN
      ) {
        addLog(
          "error",
          "WebSocket not connected"
        );

        return;
      }

      socket.send(
        JSON.stringify({
          type: "capture",

          device_id:
            deviceId,

          deviceId:
            deviceId,

          macAddress:
            macAddress,
        })
      );

      addLog(
        "info",
        "Capture command sent"
      );
    }, [
      addLog,
      deviceId,
      macAddress,
    ]);

  /* =======================================================
     STATUS
  ======================================================= */

  const getStatus =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState !==
        WebSocket.OPEN
      ) {
        addLog(
          "error",
          "WebSocket not connected"
        );

        return;
      }

      socket.send(
        JSON.stringify({
          type: "status",

          device_id:
            deviceId,

          deviceId:
            deviceId,

          macAddress:
            macAddress,
        })
      );

      addLog(
        "info",
        "Status request sent"
      );
    }, [
      addLog,
      deviceId,
      macAddress,
    ]);

  /* =======================================================
     SENSOR REQUEST
  ======================================================= */

  const requestSensorData =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        socket?.readyState !==
        WebSocket.OPEN
      ) {
        addLog(
          "error",
          "WebSocket not connected"
        );

        return;
      }

      socket.send(
        JSON.stringify({
          type: "get_sensor",

          device_id:
            deviceId,

          deviceId:
            deviceId,

          macAddress:
            macAddress,
        })
      );

      addLog(
        "sensor",
        "Sensor data requested"
      );
    }, [
      addLog,
      deviceId,
      macAddress,
    ]);

  /* =======================================================
     FOCUS
  ======================================================= */

  const setFocus =
    useCallback(
      (value) => {
        const nextFocus =
          value || DEFAULT_FOCUS;

        focusRef.current =
          nextFocus;

        setFocusState(
          nextFocus
        );

        localStorage.setItem(
          "cameraFocus",
          nextFocus
        );

        const socket =
          socketRef.current;

        if (
          socket?.readyState ===
          WebSocket.OPEN
        ) {
          socket.send(
            JSON.stringify({
              type: "set_focus",

              focus:
                nextFocus,

              device_id:
                deviceId,

              deviceId:
                deviceId,

              macAddress:
                macAddress,
            })
          );

          addLog(
            "info",
            `Focus changed → ${nextFocus}`
          );
        }
      },
      [
        addLog,
        deviceId,
        macAddress,
      ]
    );

  /* =======================================================
     DETECTION INTERVAL
  ======================================================= */

  const setDetectionInterval =
    useCallback(
      (value) => {
        const nextValue =
          Number(value);

        if (
          !Number.isFinite(
            nextValue
          ) ||
          nextValue < 1000
        ) {
          addLog(
            "error",
            "Detection interval must be at least 1000 ms"
          );

          return false;
        }

        setDetectionIntervalState(
          nextValue
        );

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

  /* =======================================================
     PROCESS IMAGE
  ======================================================= */

  const processImageFile =
    useCallback(
      (file) => {
        if (!file) {
          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          addLog(
            "error",
            "Please select an image file"
          );

          return;
        }

        sendImageForDetection(
          file
        );
      },
      [
        addLog,
        sendImageForDetection,
      ]
    );

  /* =======================================================
     INITIAL CONNECTION
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;
    intentionalDisconnectRef.current =
      false;

    addLog(
      "info",
      "smartEyes control center starting…"
    );

    addLog(
      "info",
      `Camera MAC: ${macAddress || "NONE"}`
    );

    addLog(
      "info",
      `Device ID: ${deviceId}`
    );

    addLog(
      "info",
      `WebSocket URL: ${wsUrl}`
    );

    if (macAddress) {
      connectWebSocket();
    } else {
      addLog(
        "error",
        "No camera MAC address configured"
      );
    }

    return () => {
      mountedRef.current = false;
      intentionalDisconnectRef.current =
        true;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current
        );

        reconnectTimerRef.current =
          null;
      }

      stopHeartbeat();
      stopFpsCounter();
      stopPeriodicDetection();

      const socket =
        socketRef.current;

      if (socket) {
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;

        if (
          socket.readyState ===
            WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close(
            1000,
            "Component unmounted"
          );
        }
      }

      socketRef.current = null;

      if (
        currentVideoUrlRef.current
      ) {
        URL.revokeObjectURL(
          currentVideoUrlRef.current
        );

        currentVideoUrlRef.current =
          null;
      }
    };

  }, []);

  /* =======================================================
     PERIODIC DETECTION EFFECT
  ======================================================= */

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

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    macAddress,
    deviceId,
    location: LOCATION,
    wsUrl,

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
