import API from "../api";
import { useState, useEffect } from "react";
export default function RestaurantDashboard() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    API.get("/restaurants/me")
      .then((r) => setMe(r.data))
      .catch(() => {});
  }, []);
  if (!me) return <div>Loading...</div>;
  return (
    <div>
      <h2>{me.name} Dashboard</h2>
      <p>Monthly capacity: {me.monthly_capacity}</p>
    </div>
  );
}
