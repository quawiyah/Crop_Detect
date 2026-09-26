import {
  FaCheckCircle,
  FaCog,
  FaPlug,
  FaSatelliteDish,
} from "react-icons/fa";

const focusOptions = [
  ["General", "General — detect everything"],
  ["Plant", "Plant / crops & diseases"],
  ["Person", "People"],
  ["Animal", "Animals"],
  ["Vehicle", "Vehicles"],
  ["Food", "Food & drinks"],
  ["Electronics", "Electronics"],
  ["Document", "Documents & text"],
  ["Medical", "Medical signs"],
  ["Cassava Leaf", "Cassava leaf"],
  ["Tomato", "Tomato"],
];

function SmartEyesControls({
  deviceId,
  location,
  focus,
  detectionInterval,
  connected,
  connecting,
  onFocusChange,
  onIntervalChange,
  onConnect,
  onDisconnect,
  onStatus,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
          Device control
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Configure the connected camera and AI
          detection behavior.
        </p>
      </div>

      <div
        className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
          connected
            ? "border-green-200 bg-green-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          <span className="text-sm font-semibold text-gray-700">
            {connecting
              ? "Connecting..."
              : connected
                ? "Connected"
                : "Disconnected"}
          </span>
        </div>

        <span className="text-xs text-gray-500">
          WebSocket
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info
          icon={<FaSatelliteDish />}
          label="Device ID"
          value={deviceId}
        />

        <Info
          icon={<FaCheckCircle />}
          label="Location"
          value={location}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          AI focus mode
        </label>

        <select
          value={focus}
          onChange={(event) =>
            onFocusChange(event.target.value)
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {focusOptions.map(([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Detection interval (ms)
        </label>

        <input
          type="number"
          min="1000"
          step="1000"
          value={detectionInterval}
          onChange={(event) =>
            onIntervalChange(event.target.value)
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <p className="mt-1 text-xs text-gray-400">
          Minimum interval: 1000 ms.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            <FaPlug />
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlug />
            {connecting
              ? "Connecting..."
              : "Connect"}
          </button>
        )}

        <button
          type="button"
          onClick={onStatus}
          disabled={!connected}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaCog />
          Check Device
        </button>
      </div>
    </section>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-green-600">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-gray-700">
        {value}
      </p>
    </div>
  );
}

export default SmartEyesControls;
