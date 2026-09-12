import Sidebar from "../components/dashboard/Sidebar";
import { useState } from "react";

import FarmerProfile from "../components/profile/FarmerProfile";
import RecentActivity from "../components/profile/RecentActivity";
import { FaBars } from "react-icons/fa";

function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5FAF5]">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col p-6 md:p-8 lg:ml-72">

        <main className="flex-1">

          <button
            className="mb-4 text-2xl lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>

          <FarmerProfile />

          <div className="mt-8">
            <RecentActivity />
          </div>

        </main>

      </div>

    </div>
  );
}

export default Profile;