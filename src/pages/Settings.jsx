import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";

// import CameraSettings from "../components/settings/CameraSettings";
import NotificationPreferences from "../components/settings/NotificationPreferences";
import PasswordUpdate from "../components/settings/PasswordUpdate";
import ConnectedDevices from "../components/settings/ConnectedDevices";

function Settings() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 lg:ml-72">

        {/* PAGE HEADER */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Settings
          </h1>

          <p className="mt-2 text-gray-500">
            Account, notification and device
            preferences.
          </p>

        </div>

        {/* CAMERA SETTINGS */}
        {/* <div className="mb-6">
          <CameraSettings />
        </div> */}

        {/* OTHER SETTINGS */}
        <div className="grid gap-6 lg:grid-cols-2">

          <PasswordUpdate />

          <NotificationPreferences />

          <ConnectedDevices />

        </div>

      </main>

    </div>
  );
}

export default Settings;