import API from "../api";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", logo: "" });
  const fetchRestaurants = async () => {
    const res = await API.get("/restaurants");
    setRestaurants(res.data);
  };

  const addRestaurant = async () => {
    if (!newRestaurant.name) return;
    await API.post("/restaurants", newRestaurant);
    setNewRestaurant({ name: "", logo: "" });
    fetchRestaurants();
  };

  const updateRestaurant = async (id: number, name: string, logo: string) => {
    await API.put(`/restaurants/${id}`, { name, logo });
    fetchRestaurants();
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <nav className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer"
        >
          Logout
        </button>
      </nav>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Restaurant</h2>
        <input
          type="text"
          placeholder="Name"
          className="border p-2 mr-2 rounded"
          value={newRestaurant.name}
          onChange={(e) =>
            setNewRestaurant({ ...newRestaurant, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Logo URL"
          className="border p-2 mr-2 rounded"
          value={newRestaurant.logo}
          onChange={(e) =>
            setNewRestaurant({ ...newRestaurant, logo: e.target.value })
          }
        />
        <button
          onClick={addRestaurant}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer"
        >
          Add
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Restaurants</h2>
        <ul>
          {restaurants.map((r) => (
            <li key={r.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img
                  src={r.logo}
                  alt=""
                  className="w-10 h-10 mr-2 rounded-full"
                />
                <span>{r.name}</span>
              </div>
              <button
                onClick={() =>
                  updateRestaurant(r.id, r.name + " (Updated)", r.logo)
                }
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Update
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
