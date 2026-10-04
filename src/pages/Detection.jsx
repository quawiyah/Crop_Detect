import Sidebar from "../components/dashboard/Sidebar";
import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";

import UploadCard from "../components/detection/UploadCard";
import PredictionCard from "../components/detection/PredictionCard";
import ApiConfig from "../config/ApiConfig";
import useSmartEyes from "../hooks/useSmartEyes";

const defaultEnvironment = {
  temperature: 25,
  humidity: 60,
  soilMoisture: 50,
};

function Detection() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const smartEyes = useSmartEyes();

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [environment, setEnvironment] = useState(() => {
    try {
      const saved = localStorage.getItem("environment-readings");
      return saved ? { ...defaultEnvironment, ...JSON.parse(saved) } : defaultEnvironment;
    } catch {
      return defaultEnvironment;
    }
  });
  const [environmentRecommendation, setEnvironmentRecommendation] = useState(null);
  const [environmentError, setEnvironmentError] = useState("");

  const updateEnvironmentField = (field, value) => {
    const next = {
      ...environment,
      [field]: Number(value),
    };

    setEnvironment(next);
    localStorage.setItem("environment-readings", JSON.stringify(next));
  };

  useEffect(() => {
    const sensorValues = smartEyes.sensorData || {};
    const temperature = Number(sensorValues.temperature);
    const humidity = Number(sensorValues.humidity);
    const soilMoisture = Number(sensorValues.soilMoisture);

    const hasLiveValues =
      Number.isFinite(temperature) ||
      Number.isFinite(humidity) ||
      Number.isFinite(soilMoisture);

    if (!hasLiveValues) {
      return;
    }

    setEnvironment((previous) => {
      const next = {
        temperature: Number.isFinite(temperature) ? temperature : previous.temperature,
        humidity: Number.isFinite(humidity) ? humidity : previous.humidity,
        soilMoisture: Number.isFinite(soilMoisture) ? soilMoisture : previous.soilMoisture,
      };

      localStorage.setItem("environment-readings", JSON.stringify(next));
      return next;
    });
  }, [smartEyes.sensorData]);

  const fetchEnvironmentRecommendation = async (payload = environment) => {
    setEnvironmentError("");

    try {
      const envResponse = await fetch(
        `${ApiConfig.getBaseUrl()}/api/environment/recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const envText = await envResponse.text();

      if (!envResponse.ok) {
        throw new Error("Environment recommendation request failed.");
      }

      const envData = envText ? JSON.parse(envText) : null;
      setEnvironmentRecommendation(envData);
    } catch (envError) {
      console.warn("Environment recommendation failed:", envError);
      setEnvironmentError("Could not load environmental guidance.");
    }
  };

  const handleDetection = async (file) => {
    setLoading(true);
    setError("");

    try {
      const currentEnvironment = {
        temperature: Number(environment.temperature),
        humidity: Number(environment.humidity),
        soilMoisture: Number(environment.soilMoisture),
      };

      await fetchEnvironmentRecommendation(currentEnvironment);

      const formData = new FormData();
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const selectedFocus = smartEyes.focus || "crop";
      const profileLocation = storedUser.farmLocation || storedUser.location || "Abuja";
      const profileEmail = storedUser.email || "";
      const deviceId = smartEyes.deviceId || "camera_01";

      formData.append("image", file);
      formData.append("focus", selectedFocus);
      formData.append("cropType", selectedFocus);
      formData.append("email", profileEmail);
      formData.append("deviceId", deviceId);
      formData.append("location", profileLocation);

      const detectionUrl = new URL(`${ApiConfig.getBaseUrl()}/api/detect/image`);
      detectionUrl.searchParams.set("focus", selectedFocus);
      detectionUrl.searchParams.set("cropType", selectedFocus);
      if (profileEmail) detectionUrl.searchParams.set("email", profileEmail);
      if (deviceId) detectionUrl.searchParams.set("deviceId", deviceId);
      if (profileLocation) detectionUrl.searchParams.set("location", profileLocation);

      const response = await fetch(
        detectionUrl,
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
      await fetchEnvironmentRecommendation();
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

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
                Environment Inputs
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-800">
                Sensor recommendations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => fetchEnvironmentRecommendation()}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Refresh guidance
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Temperature (°C)</span>
              <input
                type="number"
                value={environment.temperature}
                onChange={(event) => updateEnvironmentField("temperature", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Humidity (%)</span>
              <input
                type="number"
                value={environment.humidity}
                onChange={(event) => updateEnvironmentField("humidity", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Soil moisture (%)</span>
              <input
                type="number"
                value={environment.soilMoisture}
                onChange={(event) => updateEnvironmentField("soilMoisture", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600"
              />
            </label>
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
            environmentRecommendation={environmentRecommendation}
            environmentError={environmentError}
          />

        </div>

      </main>
    </div>
  );
}

export default Detection;