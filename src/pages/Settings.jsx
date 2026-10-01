import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import { FaBars } from "react-icons/fa";

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
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-2xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Settings
            </h1>
                
            <p className="mt-1 text-gray-500">
              Account, notification and device
            preferences.
            </p>
          </div>
        </div>


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