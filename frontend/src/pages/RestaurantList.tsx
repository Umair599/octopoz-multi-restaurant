import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/admin" />;

  useEffect(() => {
    fetch("http://localhost:8000/api/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Available Restaurants
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
          >
            <img
              src={r.logoUrl}
              alt={r.name}
              className="h-32 w-full object-cover rounded-md"
            />
            <h2 className="mt-2 text-xl font-semibold">{r.name}</h2>
            <Link
              to={`/restaurant/${r.id}/menu`}
              className="mt-3 block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View Menu
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
