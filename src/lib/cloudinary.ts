// src/lib/cloudinary.ts

export async function uploadToCloudinary(
  file: File,
  folder?: string,
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log("[Cloudinary] config:", { cloudName, uploadPreset, folder });
  console.log("[Cloudinary] file:", { name: file.name, size: file.size, type: file.type });

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary belum dikonfigurasi");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  console.log("[Cloudinary] response status:", res.status);

  const text = await res.text();
  console.log("[Cloudinary] response text:", text);

  if (!text) {
    throw new Error("Response kosong dari Cloudinary");
  }

  let data: { secure_url?: string; error?: { message: string } };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data.error?.message ?? "Upload gagal");
  }

  if (!data.secure_url) {
    throw new Error("Tidak ada URL dari Cloudinary");
  }

  return data.secure_url;
}