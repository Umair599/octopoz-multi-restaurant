import API from "../api";
import { useState, useEffect } from "react";
export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  useEffect(() => {
    API.get("/restaurants")
      .then((r) => setRestaurants(r.data))
      .catch(() => {});
  }, []);
  return (
    <div>
      <h2>Super Admin</h2>
      <h3>Restaurants</h3>
      <ul>
        {restaurants.map((r) => (
          <li key={r.id}>
            {r.name} — {r.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
