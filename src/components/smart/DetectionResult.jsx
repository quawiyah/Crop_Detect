function DetectionResult({
  detection,
  loading,
}) {
  if (loading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
        <Header />

        <div className="flex min-h-[200px] items-center justify-center sm:min-h-[220px]">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

            <p className="mt-3 text-sm text-gray-500">
              Analyzing image…
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!detection) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
        <Header />

        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
          <p className="text-sm font-medium text-gray-600 sm:text-base">
            No detection yet
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-400 sm:text-sm">
            Start the camera stream and smartEyes
            will display the latest AI result here.
          </p>
        </div>
      </section>
    );
  }

  const confidence = Math.max(
    0,
    Math.min(
      100,
      detection.probability <= 1
        ? detection.probability * 100
        : detection.probability
    )
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <Header />

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
        {/* Main detection */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Detected event
            </p>

            <h3 className="mt-1 break-words text-lg font-bold text-gray-800 sm:text-xl">
              {detection.className}
            </h3>

            {detection.summary && (
              <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                {detection.summary}
              </p>
            )}
          </div>

          <span className="self-start whitespace-nowrap rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 sm:text-sm">
            {detection.confidence}
          </span>
        </div>

        {/* Confidence */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-600 transition-all duration-500"
            style={{
              width: `${confidence}%`,
            }}
          />
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {detection.domain !== "UNKNOWN" && (
            <Tag type="purple">
              🏷️ {detection.domain}
            </Tag>
          )}

          {detection.severity !== "NONE" && (
            <Tag
              type={
                detection.severity === "CRITICAL" ||
                detection.severity === "HIGH"
                  ? "danger"
                  : detection.severity === "MODERATE"
                    ? "warning"
                    : "success"
              }
            >
              ⚠️ {detection.severity}
            </Tag>
          )}

          {detection.healthStatus !== "unknown" && (
            <Tag
              type={
                detection.healthStatus
                  .toLowerCase()
                  .includes("healthy")
                  ? "success"
                  : "danger"
              }
            >
              ⚕️ {detection.healthStatus}
            </Tag>
          )}
        </div>

        {/* Information */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem
            label="Status"
            value={
              detection.healthStatus !== "unknown"
                ? detection.healthStatus.toUpperCase()
                : detection.severity !== "NONE"
                  ? detection.severity
                  : "DETECTED"
            }
          />

          <InfoItem
            label="Recommended response"
            value={detection.responseText}
          />

          <InfoItem
            label="AI modes"
            value={
              detection.availableAiModes.length
                ? detection.availableAiModes.join(", ")
                : "No AI components reported"
            }
          />

          <InfoItem
            label="Provider / engine"
            value={
              detection.djlEngines.length
                ? detection.djlEngines.join(", ")
                : detection.availableAiModes.length
                  ? "Provider-based analysis"
                  : "No DJL engine"
            }
          />
        </div>

        {/* Other results */}
        {detection.results.length > 1 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Other results
            </p>

            {detection.results
              .slice(1, 8)
              .map((result, index) => (
                <div
                  key={`${result.className}-${index}`}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-gray-700">
                      {result.className || "Unknown"}
                    </p>

                    <p className="break-words text-xs text-gray-400">
                      {result.domain || "UNKNOWN"}

                      {result.healthStatus &&
                      result.healthStatus !== "unknown"
                        ? ` · ${result.healthStatus}`
                        : ""}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-green-600">
                    {formatConfidence(result.probability)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
        Latest analysis
      </p>

      <h2 className="mt-1 text-lg font-semibold text-gray-800 sm:text-xl">
        Detection Result
      </h2>

      <p className="mt-1 text-sm leading-5 text-gray-500">
        Review the latest AI finding, confidence,
        and response guidance.
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-h-[76px] rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold leading-5 text-gray-700">
        {value || "--"}
      </p>
    </div>
  );
}

function Tag({ type, children }) {
  const classes = {
    success:
      "bg-green-50 text-green-700 border-green-200",
    warning:
      "bg-yellow-50 text-yellow-700 border-yellow-200",
    danger:
      "bg-red-50 text-red-700 border-red-200",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        classes[type] || classes.purple
      }`}
    >
      {children}
    </span>
  );
}

function formatConfidence(value) {
  let number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  if (number <= 1) {
    number *= 100;
  }

  return `${number.toFixed(1)}%`;
}

export default DetectionResult;
