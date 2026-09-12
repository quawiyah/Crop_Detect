function FarmDetails({ user }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">

      <h2 className="mb-8 text-3xl font-bold text-gray-800">
        Farm Details
      </h2>

      <div className="grid gap-8 md:grid-cols-2">

        <Info
          title="Farm Name"
          value={user?.farmName}
        />

        <Info
          title="Primary Crop"
          value={user?.crop}
        />

        <Info
          title="Farm Size"
          value={user?.farmSize}
        />

        <Info
          title="Farm Location"
          value={user?.farmLocation}
        />

        <Info
          title="Phone"
          value={user?.phoneNumbers}
        />

        <Info
          title="Email"
          value={user?.email}
        />

      </div>

    </div>
  );
}

function Info({ title, value }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-wide text-gray-400">
        {title}
      </p>

      <h4 className="mt-2 text-xl font-semibold text-gray-800">
        {value || "Not provided"}
      </h4>
    </div>
  );
}

export default FarmDetails;