import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import SensorHeader from "../components/sensors/SensorHeader";
import SensorGrid from "../components/sensors/SensorGrid";
import AIRecommendation from "../components/sensors/AIRecommendation";
import NetworkHealth from "../components/sensors/NetworkHealth";
import CameraStream from "../components/sensors/CameraStream";

function Sensors() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [sensorConnected, setSensorConnected] =
    useState(false);

  const [sensorData, setSensorData] =
    useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
      soilStatus: null,
    });

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">

      {/* SIDEBAR */}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}

      <main className="flex-1 p-6 lg:ml-72">

        {/* HEADER */}

        <SensorHeader
          setSidebarOpen={setSidebarOpen}
        />

        {/* SENSOR CARDS */}

        <SensorGrid
          sensorData={sensorData}
          sensorConnected={sensorConnected}
        />

        {/* CAMERA + RIGHT SIDE */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* LEFT SIDE */}

          <div className="lg:col-span-2">

            <CameraStream
              setSensorConnected={
                setSensorConnected
              }
              setSensorData={
                setSensorData
              }
            />

          </div>

          {/* RIGHT SIDE */}

          <div>

            <AIRecommendation />

            <NetworkHealth />

          </div>

        </div>

      </main>

    </div>
  );
}

export default Sensors;