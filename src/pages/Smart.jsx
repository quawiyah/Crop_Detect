import { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";

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
      const tag =
        event.target?.tagName;

      if (
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
      ) {
        return;
      }

      if (
        event.key.toLowerCase() === "s"
      ) {
        smartEyes.startStream();
      }

      if (
        event.key.toLowerCase() === "c"
      ) {
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
    <div className="flex min-h-screen bg-[#F5FAF5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-6 md:p-8 lg:ml-72">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
            smartEyes
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Smart Monitoring
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            AI camera monitoring, detection
            results, device controls, and live
            activity.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
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
              videoElementRef={
                smartEyes.videoElementRef
              }
              detectionResults={
                smartEyes.detection
                  ?.results || []
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
              detection={
                smartEyes.detection
              }
              loading={
                smartEyes.loadingDetection
              }
            />
          </div>

          <div className="space-y-6">
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
