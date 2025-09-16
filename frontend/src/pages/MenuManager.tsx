import React from "react";
import API from "../api";
import ImageUpload from "../components/ImageUpload";
import { useParams } from "react-router-dom";

export default function MenuManager() {
  const { id } = useParams();
  const [items, setItems] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState(1000);
  React.useEffect(() => {
    if (id)
      API.get(`/restaurants/${id}/menu-items`).then((r) => setItems(r.data));
  }, [id]);

  async function add() {
    if (!id) return;
    await API.post(`/restaurants/${id}/menu-items`, {
      name,
      price_cents: price,
    });
    const r = await API.get(`/restaurants/${id}/menu-items`);
    setItems(r.data);
  }

  return (
    <div>
      <h2>Menu Manager</h2>
      <div>
        <input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            {it.name} — {it.price_cents} <br />
            Images: {JSON.stringify(it.images)}
          </li>
        ))}
      </ul>

      <h3>Upload Image</h3>
      {id && (
        <ImageUpload
          restaurantId={id}
          onUploaded={async (url) => {
            /* attach image to first item for demo */
            if (!items[0]) return;
            const item = items[0];
            const imgs = item.images || [];
            imgs.push({ url });
            await API.patch(`/restaurants/${id}/menu-items/${item.id}`, {
              images: imgs,
            });
            const r = await API.get(`/restaurants/${id}/menu-items`);
            setItems(r.data);
          }}
        />
      )}
    </div>
  );
}
