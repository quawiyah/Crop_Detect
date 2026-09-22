import {
  FaTemperatureHigh,
  FaTint,
  FaWater,
} from "react-icons/fa";

import SensorCard from "./SensorCard";

function SensorGrid({
  sensorData,
  sensorConnected,
}) {
  const temperature =
    sensorData?.temperature;

  const humidity =
    sensorData?.humidity;

  const soilMoisture =
    sensorData?.soilMoisture;

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "--";
    }

    return Number(value).toFixed(1);
  };

  const getTemperatureStatus = () => {
    if (
      temperature === null ||
      temperature === undefined
    ) {
      return "No data";
    }

    if (temperature < 18) {
      return "Low";
    }

    if (temperature > 32) {
      return "High";
    }

    return "Optimal";
  };

  const getHumidityStatus = () => {
    if (
      humidity === null ||
      humidity === undefined
    ) {
      return "No data";
    }

    if (humidity < 60) {
      return "Low";
    }

    if (humidity > 70) {
      return "High";
    }

    return "Optimal";
  };

  const getSoilMoistureStatus = () => {
    if (
      soilMoisture === null ||
      soilMoisture === undefined
    ) {
      return "No data";
    }

    if (soilMoisture < 20) {
      return "Dry";
    }

    if (soilMoisture < 40) {
      return "Low";
    }

    if (soilMoisture <= 70) {
      return "Optimal";
    }

    return "Wet";
  };

  const sensors = [
    {
      title: "Ambient Temperature",

      value:
        formatValue(temperature),

      unit: "°C",

      icon: <FaTemperatureHigh />,

      footerLeft:
        "Range: 18° - 32°",

      footerRight:
        getTemperatureStatus(),

      status:
        sensorConnected
          ? "LIVE"
          : "OFFLINE",
    },

    {
      title: "Air Humidity",

      value:
        formatValue(humidity),

      unit: "%",

      icon: <FaTint />,

      footerLeft:
        "Target: 60 - 70%",

      footerRight:
        getHumidityStatus(),

      status:
        sensorConnected
          ? "LIVE"
          : "OFFLINE",
    },

    {
      title: "Soil Moisture",

      value:
        formatValue(soilMoisture),

      unit: "%",

      icon: <FaWater />,

      footerLeft:
        "Critical: <20%",

      footerRight:
        getSoilMoistureStatus(),

      status:
        sensorConnected
          ? "LIVE"
          : "OFFLINE",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

      {sensors.map((sensor) => (
        <SensorCard
          key={sensor.title}
          icon={sensor.icon}
          title={sensor.title}
          value={sensor.value}
          unit={sensor.unit}
          footerLeft={sensor.footerLeft}
          footerRight={sensor.footerRight}
          status={sensor.status}
        />
      ))}

    </section>
  );
}

export default SensorGrid;