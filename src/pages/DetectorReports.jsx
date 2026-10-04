import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import { FaBars, FaChartLine, FaFilter, FaExclamationTriangle } from "react-icons/fa";
import ApiConfig from "../config/ApiConfig";

const DEFAULT_FILTERS = {
  status: "all",
  location: "",
  macAddress: "",
};

function DetectorReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (nextFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (nextFilters.status && nextFilters.status !== "all") params.set("status", nextFilters.status);
      if (nextFilters.location) params.set("location", nextFilters.location);
      if (nextFilters.macAddress) params.set("macAddress", nextFilters.macAddress);

      const response = await fetch(`${ApiConfig.getBaseUrl()}/gas-detectors/admin/report?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load detector report.");
      }

      const payload = await response.json();
      setData(payload);
    } catch (err) {
      console.error(err);
      setError("Could not load detector analytics and reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summaryCards = useMemo(() => {
    if (!data?.report) return [];

    return [
      { label: "Total detectors", value: data.report.totalDetectors ?? 0, tone: "green" },
      { label: "Healthy", value: data.report.healthyDetectors ?? 0, tone: "emerald" },
      { label: "Warning", value: data.report.warningDetectors ?? 0, tone: "amber" },
      { label: "Critical", value: data.report.criticalDetectors ?? 0, tone: "red" },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-[#F5FAF5]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="min-w-0 px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:ml-72">
        <div className="flex items-center gap-4">
          <button className="text-2xl text-gray-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>

          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Detector Reports & Analytics</h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500">
              Filter on detector health, location, and MAC address to review readings and summary analytics.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-green-700">
            <FaFilter />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-green-500"
              >
                <option value="all">All</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Location</span>
              <input
                type="text"
                value={filters.location}
                onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="e.g. Plot A"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-green-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">MAC address</span>
              <input
                type="text"
                value={filters.macAddress}
                onChange={(event) => setFilters((prev) => ({ ...prev, macAddress: event.target.value }))}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-green-500"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => fetchData(filters)}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Apply filters
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{card.label}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-gray-800">{card.value}</span>
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  card.tone === "green" ? "bg-green-500" :
                  card.tone === "emerald" ? "bg-emerald-500" :
                  card.tone === "amber" ? "bg-amber-500" : "bg-red-500"
                }`} />
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">Loading detector insights…</div>
        ) : data ? (
          <>
            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <MetricCard title="Average CO2" value={`${data.report?.averageCo2 ?? 0} ppm`} icon={<FaChartLine />} />
              <MetricCard title="Avg temperature" value={`${data.report?.averageTemperature ?? 0}°C`} icon={<FaChartLine />} />
              <MetricCard title="Avg humidity" value={`${data.report?.averageHumidity ?? 0}%`} icon={<FaChartLine />} />
            </section>

            <section className="mt-6 space-y-4">
              {(data.detectors || []).map((entry) => (
                <div key={entry.detector?.macAddress || Math.random()} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">Detector</p>
                      <h3 className="mt-1 text-xl font-bold text-gray-800">{entry.detector?.macAddress || "Unknown"}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={entry.detector?.status} />
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {entry.detector?.location || "Unknown location"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <ReadingTile label="Temperature" value={`${entry.lastReading?.temperature ?? 0}°C`} />
                    <ReadingTile label="Humidity" value={`${entry.lastReading?.humidity ?? 0}%`} />
                    <ReadingTile label="Moisture" value={`${entry.lastReading?.moisture ?? 0}%`} />
                    <ReadingTile label="CO2" value={`${entry.lastReading?.co2 ?? 0} ppm`} />
                  </div>

                  <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaExclamationTriangle className="text-amber-500" />
                      <span className="text-sm font-semibold">Reading summary</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">{entry.lastReading?.message}</p>
                    <p className="mt-2 text-sm text-gray-500">Recommendation: {entry.lastReading?.recommendation}</p>
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-green-700">{icon}<span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</span></div>
      <p className="mt-3 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function ReadingTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const healthy = status === true || status === "true";
  const danger = status === false || status === "false";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      healthy ? "bg-green-100 text-green-700" : danger ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
    }`}>
      {healthy ? "Healthy" : danger ? "Critical" : "Warning"}
    </span>
  );
}

export default DetectorReports;
