import { useEffect, useState } from "react";
import { FaBars, FaCalendarAlt } from "react-icons/fa";

function Topbar({ setSidebarOpen }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  const aiTokenBalance =
    user?.aitokenBalance ??
    user?.aiTokenBalance ??
    user?.aitokenbalance ??
    0;

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <button
          className="text-2xl lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Farm Overview
          </h1>

          <p className="mt-2 text-gray-500">
            Precision insights for Sector 7-G
            <span className="font-medium text-green-600">
              {" "}• Real-time sync active
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow">
          <FaCalendarAlt className="text-green-700" />
          <span className="text-sm text-gray-600">{today}</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-700">
            AI Tokens
          </span>
          <span className="text-sm text-gray-600">
           # {aiTokenBalance}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;