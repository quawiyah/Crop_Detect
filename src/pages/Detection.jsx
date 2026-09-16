import Sidebar from "../components/dashboard/Sidebar";
import { useState } from "react";

import UploadCard from "../components/detection/UploadCard";
import PredictionCard from "../components/detection/PredictionCard";
import { FaBars } from "react-icons/fa";

function Detection() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDetection = async (file) => {
    setLoading(true);
    setError(null);

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
    <div className="flex min-h-screen bg-[#F7FBF8]">

      <Sidebar />

      <div className="flex flex-1 flex-col lg:ml-72 p-6 md:p-8">

        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main>

          <div className="flex items-center gap-4">

            <button
              className="lg:hidden text-2xl"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Disease Detection
              </h1>

              <p className="mt-2 text-gray-500">
                Upload a leaf or canopy image and the model returns a diagnosis
                in seconds.
              </p>
            </div>

          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

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

    </div>
  );
}

export default Detection;
