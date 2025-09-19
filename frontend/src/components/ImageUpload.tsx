import React, { useState, useRef } from "react";
import API from "../api";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  className?: string;
  multiple?: boolean;
  onImagesUploaded?: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
}

export default function ImageUpload({
  onImageUploaded,
  currentImage,
  className = "",
  multiple = false,
  onImagesUploaded,
  maxImages = 5,
  label = "Click to upload image"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      // Handle multiple files
      const fileArray = Array.from(files).slice(0, maxImages);
      const previewUrls: string[] = [];
      
      // Show previews
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewUrls.push(e.target?.result as string);
          if (previewUrls.length === fileArray.length) {
            setPreviews(previewUrls);
          }
        };
        reader.readAsDataURL(file);
      });

      // Upload files
      setUploading(true);
      try {
        const formData = new FormData();
        fileArray.forEach((file) => {
          formData.append("files", file);
        });

        const response = await API.post("/uploads/upload-multiple", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const urls = response.data.files.map((file: any) => file.url);
        onImagesUploaded?.(urls);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    } else {
      // Handle single file
      const file = files[0];
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await API.post("/uploads/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        onImageUploaded(response.data.url);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const removePreview = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  return (
    <div className={`${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple={multiple}
        className="hidden"
      />
      
      {multiple ? (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600">{label}</div>
            <div className="text-sm text-gray-500 mt-1">
              Max {maxImages} images, 5MB each
            </div>
            {uploading && (
              <div className="mt-2 text-blue-600">Uploading...</div>
            )}
          </div>
          
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded"
              />
              <div className="mt-2 text-sm text-gray-600">
                Click to change image
              </div>
            </div>
          ) : (
            <div>
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-gray-600">{label}</div>
              <div className="text-sm text-gray-500 mt-1">Max 5MB</div>
            </div>
          )}
          
          {uploading && (
            <div className="mt-2 text-blue-600">Uploading...</div>
          )}
        </div>
      )}
    </div>
  );
}