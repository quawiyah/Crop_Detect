function ProfileCard({ user }) {
  const displayName =
    user?.name ||
    user?.fullName ||
    "User";

  const firstLetter =
    displayName.trim().charAt(0).toUpperCase() || "U";

  const farmName =
    user?.farmName || "Farm name not available";

  const farmLocation =
    user?.farmLocation || "Location not available";

  const crop = user?.crop;

  return (
    <div className="flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">

      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
        <span className="text-4xl font-bold text-green-700">
          {firstLetter}
        </span>
      </div>

      <h2 className="mt-8 text-3xl font-bold text-gray-800">
        {displayName}
      </h2>

      <p className="mt-2 text-center text-gray-500">
        {farmName} • {farmLocation}
      </p>

      {crop && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-green-600 px-4 py-1 text-white">
            {crop}
          </span>
        </div>
      )}

    </div>
  );
}

export default ProfileCard;