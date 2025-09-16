import React from "react";
import API from "../api";

type P = { restaurantId: string; onUploaded: (url: string) => void };

export default function ImageUpload({ onUploaded }: P) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    setUploading(true);
    try {
      const r = await API.post("/uploads/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(`http://localhost:4000${r.data.url}`);
    } catch (e) {
      alert("upload failed");
    }
    setUploading(false);
  }
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" onChange={onChange} />
      {uploading && <span>Uploading…</span>}
    </div>
  );
}
