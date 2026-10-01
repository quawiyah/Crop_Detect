import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useState } from "react";
import { FaBars } from "react-icons/fa";

import UploadCard from "../components/detection/UploadCard";
import PredictionCard from "../components/detection/PredictionCard";

function Detection() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDetection = async (file) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        "https://crop-disease-detector-8nqt.onrender.com/api/detect/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      console.log("API response:", responseText);

      if (!response.ok) {
        let errorMessage = "Detection failed.";

        try {
          const errorData = JSON.parse(responseText);

          if (
            response.status === 503 ||
            errorData.error?.includes("Gemini API returned HTTP 503") ||
            errorData.error?.includes("high demand")
          ) {
            errorMessage =
              "The AI service is temporarily busy. Please wait a moment and try again.";
          } else {
            errorMessage =
              errorData.error || "Unable to process the image.";
          }
        } catch {
          errorMessage =
            "Unable to process the image. Please try again.";
        }

        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);

      if (!data.success) {
        throw new Error("Disease detection was unsuccessful.");
      }

      setPrediction(data);
    } catch (error) {
      console.error("Detection error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
              Disease Detection
            </h1>
        
            <p className="mt-1 text-gray-500">
              Upload a leaf or canopy image and the AI will return a
              diagnosis in seconds.
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <UploadCard
            onDetect={handleDetection}
            loading={loading}
          />

          <PredictionCard
            prediction={prediction}
            loading={loading}
            error={error}
          />

        </div>

      </main>
    </div>
  );
}

export default Detection;