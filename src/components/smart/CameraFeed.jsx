import { useEffect, useRef } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaPlay,
  FaStop,
} from "react-icons/fa";

function CameraFeed({
  connected,
  streamActive,
  streamUrl,
  fps,
  frameBytes,
  videoElementRef,
  detectionResults,
  onStartStream,
  onStopStream,
  onCapture,
}) {
  const canvasRef = useRef(null);

  const drawBoxes = () => {
    const image = videoElementRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas || !image.naturalWidth) {
      return;
    }

    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const results = Array.isArray(detectionResults)
      ? detectionResults
      : [];

    const boxes = results
      .map((result) => ({
        label: result.className || "?",
        score: Number(result.probability) || 0,
        box:
          result.bbox ||
          (result.x !== undefined
            ? {
                x: result.x,
                y: result.y,
                width: result.width,
                height: result.height,
              }
            : null),
      }))
      .filter(
        (result) =>
          result.box &&
          Number(result.box.width) > 0
      );

    if (!boxes.length) {
      return;
    }

    context.lineWidth = 2;
    context.font =
      "600 12px Inter, system-ui, sans-serif";

    boxes.forEach(({ label, score, box }) => {
      const x = box.x * canvas.width;
      const y = box.y * canvas.height;
      const width = box.width * canvas.width;
      const height =
        box.height * canvas.height;

      context.strokeStyle = "#16a34a";
      context.strokeRect(
        x,
        y,
        width,
        height
      );

      const text = `${label} ${(
        score <= 1 ? score * 100 : score
      ).toFixed(0)}%`;

      const padding = 4;
      const textWidth =
        context.measureText(text).width +
        padding * 2;
      const textHeight = 18;

      context.fillStyle =
        "rgba(22, 163, 74, 0.9)";

      context.fillRect(
        x,
        Math.max(0, y - textHeight),
        textWidth,
        textHeight
      );

      context.fillStyle = "#ffffff";

      context.fillText(
        text,
        x + padding,
        Math.max(12, y - 5)
      );
    });
  };

  useEffect(() => {
    drawBoxes();
  }, [detectionResults, streamUrl]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
            Live monitoring
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800">
            Camera Feed
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Stream real-time visuals from the
            connected smartEyes camera.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            connected
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          {connected ? "Connected" : "Offline"}
        </div>
      </div>

      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {streamUrl ? (
          <>
            <img
              ref={videoElementRef}
              src={streamUrl}
              alt="Live camera stream"
              className="block max-h-[560px] w-full object-contain"
              onLoad={drawBoxes}
            />

            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>

              <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                {fps.toFixed(1)} fps
              </span>

              <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                {formatBytes(frameBytes)}
              </span>
            </div>
          </>
        ) : (
          <div className="px-6 text-center">
            <FaCamera className="mx-auto text-4xl text-gray-400" />

            <p className="mt-3 font-medium text-gray-600">
              Camera stream is waiting for a
              live frame.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Press Start Stream to begin.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStartStream}
          disabled={!connected}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPlay />
          Start Stream
        </button>

        <button
          type="button"
          onClick={onStopStream}
          disabled={!connected || !streamActive}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaStop />
          Stop Stream
        </button>

        <button
          type="button"
          onClick={onCapture}
          disabled={!connected}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaCamera />
          Capture Snapshot
        </button>
      </div>
    </section>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "-- bytes";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default CameraFeed;
