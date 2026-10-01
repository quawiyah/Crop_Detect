import { useEffect, useRef, useState } from "react";
import {
  FaCamera,
  FaMapMarkerAlt,
  FaBrain,
  FaClock,
  FaWifi,
} from "react-icons/fa";

const WS_URL =
  "wss://crop-disease-detector-8nqt.onrender.com/camera-stream";

const DEVICE_ID = "camera_01";
const LOCATION = "Field_A";

const DEFAULT_FOCUS = "General";
const DEFAULT_INTERVAL = 60000;

function CameraSettings() {
  const [focus, setFocus] = useState(
    localStorage.getItem("cameraFocus") ||
      DEFAULT_FOCUS
  );

  const [interval, setIntervalValue] = useState(
    Number(
      localStorage.getItem(
        "detectionIntervalMs"
      )
    ) || DEFAULT_INTERVAL
  );

  const [connected, setConnected] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connect = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState ===
        WebSocket.OPEN
    ) {
      return;
    }

    setConnecting(true);

    try {
      const socket = new WebSocket(WS_URL);

      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setConnecting(false);

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
      };

      socket.onclose = () => {
        setConnected(false);
        setConnecting(false);
      };

      socket.onerror = () => {
        setConnected(false);
        setConnecting(false);
      };
    } catch {
      setConnected(false);
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnected(false);
  };

  const handleFocusChange = (value) => {
    setFocus(value);

    localStorage.setItem(
      "cameraFocus",
      value
    );

    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "set_focus",
          focus: value,
        })
      );
    }
  };

  const handleIntervalChange = (value) => {
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 1000
    ) {
      return;
    }

    setIntervalValue(number);

    localStorage.setItem(
      "detectionIntervalMs",
      String(number)
    );
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Camera & AI Settings
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Configure your camera device and
          AI detection preferences.
        </p>
      </div>

      <div className="space-y-4">

        {/* DEVICE ID */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FaCamera />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                Device ID
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Connected smart camera
              </p>
            </div>

          </div>

          <span className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            {DEVICE_ID}
          </span>

        </div>

        {/* LOCATION */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FaMapMarkerAlt />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                Location
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Camera installation location
              </p>
            </div>

          </div>

          <span className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            {LOCATION}
          </span>

        </div>

        {/* AI FOCUS */}
        <div className="rounded-lg border border-gray-200 p-4">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FaBrain />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                AI Focus
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Choose what the AI should
                focus on.
              </p>
            </div>

          </div>

          <select
            value={focus}
            onChange={(event) =>
              handleFocusChange(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            <option value="General">
              General — detect everything
            </option>

            <option value="Plant">
              Plant / crops & diseases
            </option>

            <option value="Person">
              People
            </option>

            <option value="Animal">
              Animals
            </option>

            <option value="Vehicle">
              Vehicles
            </option>

            <option value="Food">
              Food & drinks
            </option>

            <option value="Electronics">
              Electronics
            </option>

            <option value="Document">
              Documents & text
            </option>

            <option value="Medical">
              Medical signs
            </option>

            <option value="Cassava Leaf">
              Cassava leaf
            </option>

            <option value="Tomato">
              Tomato
            </option>
          </select>

        </div>

        {/* DETECTION INTERVAL */}
        <div className="rounded-lg border border-gray-200 p-4">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FaClock />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                Detection Interval
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                How often the camera frame
                is analyzed.
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <input
              type="number"
              min="1000"
              step="1000"
              value={interval}
              onChange={(event) =>
                handleIntervalChange(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />

            <span className="text-sm text-gray-400">
              ms
            </span>

          </div>

          <p className="mt-2 text-xs text-gray-400">
            Minimum interval: 1000 ms
          </p>

        </div>

        {/* CONNECTION */}
        <div className="rounded-lg border border-gray-200 p-4">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FaWifi />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">
                  Camera Connection
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      connected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />

                  <span className="text-xs text-gray-500">
                    {connecting
                      ? "Connecting..."
                      : connected
                      ? "Connected"
                      : "Disconnected"}
                  </span>

                </div>
              </div>

            </div>

            {connected ? (
              <button
                type="button"
                onClick={disconnect}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={connect}
                disabled={connecting}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connecting
                  ? "Connecting..."
                  : "Connect"}
              </button>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default CameraSettings;