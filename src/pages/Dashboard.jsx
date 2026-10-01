import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import CameraFeed from "../components/smart/CameraFeed";
import SensorData from "../components/smart/SensorData";

import useSmartEyes from "../hooks/useSmartEyes";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const smartEyes = useSmartEyes();

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-6 md:p-8 lg:ml-72">
        <Topbar
          setSidebarOpen={setSidebarOpen}
        />

        <div className="mt-6">

          <SensorData
            sensorData={
              smartEyes.sensorData
            }
            connected={
              smartEyes.connected
            }
            onRefresh={
              smartEyes.requestSensorData
            }
          />

          <div className="mt-8">
            <CameraFeed
              connected={
                smartEyes.connected
              }
              streamActive={
                smartEyes.streamActive
              }
              streamUrl={
                smartEyes.streamUrl
              }
              fps={smartEyes.fps}
              frameBytes={
                smartEyes.frameBytes
              }
              detectionResults={
                smartEyes.detection
                  ?.results || []
              }
              videoElementRef={
                smartEyes.videoElementRef
              }
              onStartStream={
                smartEyes.startStream
              }
              onStopStream={
                smartEyes.stopStream
              }
              onCapture={
                smartEyes.captureImage
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;