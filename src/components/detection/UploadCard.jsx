import { useRef, useState } from "react";
import { FaUpload, FaCamera } from "react-icons/fa";

function UploadCard({ onDetect, loading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;

    onDetect(selectedFile);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

      <h2 className="text-2xl font-bold mb-6">
        Image Upload
      </h2>

      <div className="border-2 border-dashed border-gray-300 rounded-3xl py-16 flex flex-col items-center">

        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Selected crop"
            className="w-72 max-h-72 object-contain rounded-xl mb-6"
          />
        ) : (
          <>
            <FaUpload className="text-5xl text-green-700 mb-5" />

            <h3 className="text-xl font-semibold">
              Drag & Drop Crop Images
            </h3>

            <p className="text-gray-500 mt-2">
              JPG or PNG • Max 10MB
            </p>
          </>
        )}

        <div className="flex flex-col xl:flex-row gap-4 mt-8">

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className="bg-green-700 text-white px-8 py-3 rounded-xl hover:bg-green-800 disabled:opacity-50"
          >
            Browse Files
          </button>

          <button
            onClick={() => cameraInputRef.current.click()}
            disabled={loading}
            className="border border-gray-300 px-8 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100 disabled:opacity-50"
          >
            <FaCamera />
            Camera Upload
          </button>

        </div>

        {selectedFile && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 w-full max-w-sm bg-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? "Analyzing Image..." : "Analyze Image"}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

      </div>

      <p className="mt-6 text-gray-500">
        Tip: Capture the affected leaf in daylight filling most of the frame.
      </p>

    </div>
  );
}

export default UploadCard;
