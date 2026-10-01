import { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import { FaBars } from "react-icons/fa";

import useSmartEyes from "../hooks/useSmartEyes";

import CameraFeed from "../components/smart/CameraFeed";
import DetectionResult from "../components/smart/DetectionResult";
import SecurityTimeline from "../components/smart/SecurityTimeline";
import SmartEyesControls from "../components/smart/SmartEyesControls";

function Smart() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const smartEyes = useSmartEyes();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target?.tagName;

      if (
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
      ) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        smartEyes.startStream();
      }

      if (event.key.toLowerCase() === "c") {
        smartEyes.captureImage();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    smartEyes.startStream,
    smartEyes.captureImage,
  ]);

  return (
    <div className="min-h-screen bg-[#F5FAF5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="min-w-0 px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:ml-72">
        <div className="flex items-center gap-4">

          <button
            className="lg:hidden text-2xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Smart Monitoring
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500">
              AI camera monitoring, detection
              results, device controls, and live
              activity.
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] xl:gap-6">
          {/* Left column */}
          <div className="min-w-0 space-y-5 xl:space-y-6">
            <CameraFeed
              connected={smartEyes.connected}
              streamActive={
                smartEyes.streamActive
              }
              streamUrl={smartEyes.streamUrl}
              fps={smartEyes.fps}
              frameBytes={
                smartEyes.frameBytes
              }
              videoElementRef={
                smartEyes.videoElementRef
              }
              detectionResults={
                smartEyes.detection?.results ||
                []
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

            <DetectionResult
              detection={smartEyes.detection}
              loading={
                smartEyes.loadingDetection
              }
            />
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-5 xl:space-y-6">
            <SmartEyesControls
              macAddress={
                smartEyes.macAddress
              }
              deviceId={
                smartEyes.deviceId
              }
              location={
                smartEyes.location
              }
              focus={smartEyes.focus}
              detectionInterval={
                smartEyes.detectionInterval
              }
              connected={
                smartEyes.connected
              }
              connecting={
                smartEyes.connecting
              }
              onFocusChange={
                smartEyes.setFocus
              }
              onIntervalChange={
                smartEyes.setDetectionInterval
              }
              onConnect={
                smartEyes.connectWebSocket
              }
              onDisconnect={
                smartEyes.disconnectWebSocket
              }
              onStatus={
                smartEyes.getStatus
              }
            />

            <SecurityTimeline
              logs={smartEyes.logs}
              onClear={
                smartEyes.clearLogs
              }
              onCopy={
                smartEyes.copyLogs
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Smart;
