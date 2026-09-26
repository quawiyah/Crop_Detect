function SecurityTimeline({
  logs,
  onClear,
  onCopy,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
            Operations feed
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800">
            Security Timeline
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Live sensor, connection, camera, and AI
            activity.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
          Live logs
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Copy
        </button>
      </div>

      <div className="mt-3 max-h-[320px] min-h-[180px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
        {logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No activity yet.
          </p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`border-b border-gray-200 py-2 text-xs last:border-b-0 ${
                  getLogClass(log.type)
                }`}
              >
                <span className="mr-2 text-gray-400">
                  [{log.time}]
                </span>

                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getLogClass(type) {
  const classes = {
    success: "text-green-600",
    error: "text-red-600",
    sensor: "text-sky-600",
    ai: "text-purple-600",
    info: "text-gray-600",
  };

  return classes[type] || classes.info;
}

export default SecurityTimeline;
