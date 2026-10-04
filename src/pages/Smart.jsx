import { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import { FaBars } from "react-icons/fa";

import useSmartEyes from "../hooks/useSmartEyes";

import CameraFeed from "../components/smart/CameraFeed";
import DetectionResult from "../components/smart/DetectionResult";
import SecurityTimeline from "../components/smart/SecurityTimeline";
import SensorData from "../components/smart/SensorData";
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

  const summaryCards = [
    {
      label: "System",
      value: smartEyes.connected ? "Online" : "Offline",
      tone: smartEyes.connected ? "green" : "gray",
    },
    {
      label: "Camera",
      value: smartEyes.streamActive ? "Streaming" : "Idle",
      tone: smartEyes.streamActive ? "blue" : "amber",
    },
    {
      label: "Temperature",
      value:
        smartEyes.sensorData?.temperature != null
          ? `${Number(smartEyes.sensorData.temperature).toFixed(1)}°C`
          : "--",
      tone: "green",
    },
    {
      label: "Latest result",
      value: smartEyes.detection?.className || "No result",
      tone: smartEyes.detection ? "purple" : "gray",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5FAF5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="min-w-0 px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:ml-72">
        <div className="flex items-center gap-4">
          <button
            className="text-2xl text-gray-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>

          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Smart Monitoring
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500">
              AI camera monitoring, live sensor telemetry, and detection results in one overview.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                {card.label}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-gray-800">
                  {card.value}
                </span>
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    card.tone === "green"
                      ? "bg-green-500"
                      : card.tone === "blue"
                        ? "bg-blue-500"
                        : card.tone === "amber"
                          ? "bg-amber-500"
                          : card.tone === "purple"
                            ? "bg-violet-500"
                            : "bg-gray-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] xl:gap-6">
          <div className="min-w-0 space-y-5 xl:space-y-6">
            <CameraFeed
              connected={smartEyes.connected}
              streamActive={smartEyes.streamActive}
              streamUrl={smartEyes.streamUrl}
              fps={smartEyes.fps}
              frameBytes={smartEyes.frameBytes}
              videoElementRef={smartEyes.videoElementRef}
              detectionResults={smartEyes.detection?.results || []}
              onStartStream={smartEyes.startStream}
              onStopStream={smartEyes.stopStream}
              onCapture={smartEyes.captureImage}
            />

            <DetectionResult
              detection={smartEyes.detection}
              loading={smartEyes.loadingDetection}
            />
          </div>

          <div className="min-w-0 space-y-5 xl:space-y-6">
            <SensorData
              sensorData={smartEyes.sensorData}
              connected={smartEyes.connected}
              onRefresh={smartEyes.requestSensorData}
            />

            <SecurityTimeline
              logs={smartEyes.logs}
              onClear={smartEyes.clearLogs}
              onCopy={smartEyes.copyLogs}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Smart;
