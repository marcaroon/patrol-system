// src/lib/photoUtils.ts
// Client-side: GPS + canvas watermark

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export async function getCurrentPosition(): Promise<GeoPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function applyWatermark(
  file: File,
  timestamp: string,
  coords?: GeoPosition
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(14, Math.floor(img.height * 0.022));
        const lineH = fontSize * 1.5;
        const lines = [
          `\u{1F4C5} ${timestamp}`,
          coords
            ? `\u{1F4CD} ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
            : `\u{1F4CD} Lokasi tidak tersedia`,
          "PT Intan Sejati Andalan",
        ];
        const boxH = lines.length * lineH + 20;
        const boxY = img.height - boxH - 8;

        ctx.fillStyle = "rgba(0,0,0,0.68)";
        ctx.fillRect(0, boxY, img.width, boxH + 8);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(0, boxY, 5, boxH + 8);

        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        lines.forEach((line, i) =>
          ctx.fillText(line, 14, boxY + 10 + i * lineH)
        );

        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          0.92
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processPhoto(file: File): Promise<{
  blob: Blob;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}> {
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const coords = await getCurrentPosition();
  const blob = await applyWatermark(file, timestamp, coords ?? undefined);
  return {
    blob,
    timestamp: now.toISOString(),
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  };
}
