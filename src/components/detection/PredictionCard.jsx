import { FaCheckCircle } from "react-icons/fa";

function PredictionCard({ prediction, loading, error }) {

  // Loading state
  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

        <h2 className="text-2xl font-bold">
          Prediction Result
        </h2>

        <div className="flex flex-col items-center justify-center py-24">

          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>

          <p className="mt-5 text-gray-500">
            AI is analyzing your crop image...
          </p>

        </div>

      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

        <h2 className="text-2xl font-bold">
          Prediction Result
        </h2>

        <div className="mt-8 rounded-2xl bg-red-50 border border-red-200 p-6">

          <p className="text-red-700">
            {error}
          </p>

        </div>

      </div>
    );
  }

  // No prediction yet
  if (!prediction) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

        <h2 className="text-2xl font-bold">
          Prediction Result
        </h2>

        <div className="flex items-center justify-center py-24">

          <p className="text-gray-400 text-center">
            Upload a crop image and click
            <br />
            <span className="font-semibold">
              "Analyze Image"
            </span>
            {" "}to see the AI prediction.
          </p>

        </div>

      </div>
    );
  }

  const diseaseName = prediction.disease
    ?.replaceAll("_", " ")
    ?.replace(/\b\w/g, (letter) => letter.toUpperCase());

  const confidence = Math.round(prediction.confidence * 100);

  const treatment =
    prediction.topResult?.treatment ||
    prediction.treatment ||
    "No treatment information available.";

  const prevention =
    prediction.topResult?.prevention || [];

  const whenToAct =
    prediction.topResult?.whenToAct ||
    "Follow the recommended treatment as soon as possible.";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

      {/* Header */}
      <div className="flex justify-between items-center gap-4">

        <h2 className="text-2xl font-bold">
          Prediction Result
        </h2>

        <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-semibold whitespace-nowrap">
          Detected
        </span>

      </div>

      {/* Crop Type */}
      {prediction.cropType && (
        <p className="text-gray-500 mt-4">
          Crop:{" "}
          <span className="font-semibold text-gray-700">
            {prediction.cropType}
          </span>
        </p>
      )}

      {/* Disease */}
      <p className="text-gray-400 uppercase mt-6">
        Disease Name
      </p>

      <h1 className="text-2xl font-semibold mt-1">
        {diseaseName}
      </h1>

      {/* Confidence */}
      <div className="mt-8">

        <div className="flex justify-between mb-2">

          <span className="font-medium">
            Confidence Score
          </span>

          <span className="font-bold">
            {confidence}%
          </span>

        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full">

          <div
            className="bg-green-700 h-3 rounded-full"
            style={{ width: `${confidence}%` }}
          />

        </div>

      </div>

      {/* Detection Information */}
      <div className="grid md:grid-cols-2 gap-5 mt-8">

        <div className="border rounded-2xl p-5 border-gray-300">

          <h3 className="text-gray-500 uppercase text-sm">
            Detection Status
          </h3>

          <p className="font-semibold text-lg mt-2">
            {prediction.status || "Detected"}
          </p>

        </div>

        <div className="border rounded-2xl p-5 border-gray-300">

          <h3 className="text-gray-500 uppercase text-sm">
            When To Act
          </h3>

          <p className="font-semibold text-lg mt-2">
            {whenToAct}
          </p>

        </div>

      </div>

      {/* Treatment */}
      <div className="border rounded-2xl p-5 mt-6 border-gray-300">

        <h3 className="font-bold text-xl mb-3">
          Recommended Treatment
        </h3>

        <p className="text-gray-600 leading-8">
          {treatment}
        </p>

      </div>

      {/* Prevention */}
      {prevention.length > 0 && (
        <div className="border rounded-2xl p-5 mt-6 border-gray-300">

          <h3 className="font-bold text-xl mb-5">
            Preventive Measures
          </h3>

          <div className="space-y-4">

            {prevention.map((tip, index) => (

              <div
                key={index}
                className="flex items-start gap-3"
              >

                <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />

                <span>
                  {tip}
                </span>

              </div>

            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default PredictionCard;