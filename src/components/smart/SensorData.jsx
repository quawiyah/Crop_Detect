import {
  FaTint,
  FaTemperatureHigh,
  FaWater,
} from "react-icons/fa";

function SensorData({
  sensorData,
  connected,
  onRefresh,
}) {
  const temperature = sensorData?.temperature;
  const humidity = sensorData?.humidity;
  const soilMoisture = sensorData?.soilMoisture;

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return Number(value).toFixed(1);
  };

  const temperatureStatus = getTemperatureStatus(
    temperature
  );

  const humidityStatus = getHumidityStatus(
    humidity
  );

  const soilStatus = getSoilStatus(
    soilMoisture,
    sensorData?.soilStatus
  );

  const cards = [
    {
      title: "Temperature",
      value: formatValue(temperature),
      unit: "°C",
      icon: <FaTemperatureHigh />,
      status: temperatureStatus,
    },
    {
      title: "Humidity",
      value: formatValue(humidity),
      unit: "%",
      icon: <FaTint />,
      status: humidityStatus,
    },
    {
      title: "Soil Moisture",
      value: formatValue(soilMoisture),
      unit: "%",
      icon: <FaWater />,
      status: soilStatus,
    },
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
            Telemetry
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800">
            Site Environment
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Live temperature, humidity, and soil
            moisture from the connected sensor.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!connected}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              {card.icon}
            </div>

            <div className="mt-4 text-2xl font-bold text-gray-800">
              {card.value}
              <span className="ml-1 text-sm font-medium text-gray-500">
                {card.unit}
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {card.title}
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                card.status.type
              )}`}
            >
              {card.status.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
        <span
          className={
            connected
              ? "font-medium text-green-600"
              : ""
          }
        >
          {connected
            ? "Sensor online"
            : "Sensor offline"}
        </span>

        <span>
          {sensorData?.updatedAt
            ? `Last updated ${new Date(
                sensorData.updatedAt
              ).toLocaleTimeString()}`
            : "Never updated"}
        </span>
      </div>
    </section>
  );
}

function getTemperatureStatus(value) {
  if (value === null || value === undefined) {
    return { label: "No data", type: "invalid" };
  }

  if (value < 18) {
    return { label: "Low", type: "warning" };
  }

  if (value > 32) {
    return { label: "High", type: "danger" };
  }

  return { label: "Optimal", type: "success" };
}

function getHumidityStatus(value) {
  if (value === null || value === undefined) {
    return { label: "No data", type: "invalid" };
  }

  if (value < 60) {
    return { label: "Low", type: "warning" };
  }

  if (value > 70) {
    return { label: "High", type: "danger" };
  }

  return { label: "Optimal", type: "success" };
}

function getSoilStatus(value, serverStatus) {
  if (
    value === null ||
    value === undefined
  ) {
    return { label: "No data", type: "invalid" };
  }

  if (serverStatus) {
    const status = String(serverStatus)
      .trim()
      .toUpperCase();

    if (status === "DRY") {
      return { label: "Dry", type: "danger" };
    }

    if (status === "LOW") {
      return { label: "Low", type: "warning" };
    }

    if (status === "OPTIMAL") {
      return {
        label: "Optimal",
        type: "success",
      };
    }

    if (status === "WET") {
      return { label: "Wet", type: "info" };
    }
  }

  if (value < 20) {
    return { label: "Dry", type: "danger" };
  }

  if (value < 40) {
    return { label: "Low", type: "warning" };
  }

  if (value <= 70) {
    return {
      label: "Optimal",
      type: "success",
    };
  }

  return { label: "Wet", type: "info" };
}

function getStatusClasses(type) {
  const classes = {
    success:
      "bg-green-50 text-green-700",
    warning:
      "bg-yellow-50 text-yellow-700",
    danger:
      "bg-red-50 text-red-700",
    info:
      "bg-sky-50 text-sky-700",
    invalid:
      "bg-gray-100 text-gray-500",
  };

  return classes[type] || classes.invalid;
}

export default SensorData;
