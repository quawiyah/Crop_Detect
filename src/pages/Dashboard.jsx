import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatsCards from "../components/dashboard/StatsCards";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import AIInsight from "../components/dashboard/AIInsight";
import CameraStream from "../components/sensors/CameraStream";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

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

        {/* STATISTICS */}
        <StatsCards />

        {/* MAIN DASHBOARD CONTENT */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2">

            {/* FARM MAP */}
            {/* <FarmMap /> */}

            {/* CAMERA STREAM */}
            <CameraStream />

          </div>

          {/* RIGHT SIDE */}
          <div>

            <RecentAlerts />

            <AIInsight />

          </div>

        </div>

        {/* ADDITIONAL DASHBOARD SECTIONS */}
        {/*
        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          <DiseaseChart />

          <SensorTable />

        </div>
        */}

      </main>

    </div>
  );
}

export default Dashboard;