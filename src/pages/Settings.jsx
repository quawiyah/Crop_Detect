import Sidebar from "../components/dashboard/Sidebar";
import { useState } from "react";
import { FaBars } from "react-icons/fa";

import SmartEyesControls from "../components/smart/SmartEyesControls";
import PersonalInfo from "../components/settings/PersonalInfo";
import NotificationPreferences from "../components/settings/NotificationPreferences";
import useSmartEyes from "../hooks/useSmartEyes";

function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const smartEyes = useSmartEyes();

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col p-6 md:p-8 lg:ml-72">
        <main className="flex-1">
          <div className="flex items-center gap-4">
            <button
              className="text-2xl lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800">
                Settings
              </h1>

              <p className="mt-2 text-gray-500">
                Account, notification and device preferences.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PersonalInfo />

            <NotificationPreferences />
          </div>

          <div className="mt-6">
            <SmartEyesControls
              macAddress={smartEyes.macAddress}
              deviceId={smartEyes.deviceId}
              location={smartEyes.location}
              focus={smartEyes.focus}
              detectionInterval={smartEyes.detectionInterval}
              connected={smartEyes.connected}
              connecting={smartEyes.connecting}
              onFocusChange={smartEyes.setFocus}
              onIntervalChange={smartEyes.setDetectionInterval}
              onConnect={smartEyes.connectWebSocket}
              onDisconnect={smartEyes.disconnectWebSocket}
              onStatus={smartEyes.getStatus}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;