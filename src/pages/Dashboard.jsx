import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import CameraFeed from "../components/smart/CameraFeed";
import SensorData from "../components/smart/SensorData";

import useSmartEyes from "../hooks/useSmartEyes";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const smartEyes = useSmartEyes();

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 lg:ml-72">

        {/* TOPBAR */}
        <Topbar
          setSidebarOpen={setSidebarOpen}
        />

        {/* SENSOR DATA */}
        <SensorData
          sensorData={smartEyes.sensorData}
          connected={smartEyes.connected}
          requestSensorData={smartEyes.requestSensorData}
        />

        {/* CAMERA SECTION */}
        <div className="mt-8">

          <CameraFeed
            connected={smartEyes.connected}
            streamActive={smartEyes.streamActive}
            streamUrl={smartEyes.streamUrl}
            fps={smartEyes.fps}
            frameBytes={smartEyes.frameBytes}
            detectionResults={
              smartEyes.detection?.results || []
            }
            videoElementRef={
              smartEyes.videoElementRef
            }
            startStream={
              smartEyes.startStream
            }
            stopStream={
              smartEyes.stopStream
            }
            captureImage={
              smartEyes.captureImage
            }
          />

        </div>

      </main>
    </div>
  );
}

export default Dashboard;