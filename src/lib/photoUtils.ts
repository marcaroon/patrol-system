// src/lib/photoUtils.ts
// Client-side: GPS + canvas watermark with map thumbnail + compression

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

// ── Compression config ────────────────────────────────────────────
const COMPRESSION_CONFIG = {
  maxWidthOrHeight: 1920,   // Max dimension in pixels
  jpegQuality: 0.82,        // JPEG quality (0-1)
  maxFileSizeMB: 2,         // Target max file size
};

/**
 * Compress an image File before watermarking.
 * Resizes if larger than maxWidthOrHeight and applies JPEG compression.
 */
export async function compressImage(
  file: File,
  maxDimension = COMPRESSION_CONFIG.maxWidthOrHeight,
  quality = COMPRESSION_CONFIG.jpegQuality,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if needed
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        // Use better image smoothing for quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getCurrentPosition(): Promise<GeoPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, enableHighAccuracy: true },
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

/**
 * Fetch a static map tile as an HTMLImageElement.
 * Uses OpenStreetMap tile server — no API key needed, free to use.
 * Returns null if fetch fails (offline / GPS unavailable).
 */
async function fetchMapThumbnail(
  lat: number,
  lng: number,
  size = 200,
  zoom = 16,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
      const tileY = Math.floor(
        ((1 -
          Math.log(
            Math.tan((lat * Math.PI) / 180) +
              1 / Math.cos((lat * Math.PI) / 180),
          ) /
            Math.PI) /
          2) *
          Math.pow(2, zoom),
      );

      const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

      fetch(tileUrl, { mode: "cors" })
        .then((r) => {
          if (!r.ok) throw new Error("tile fetch failed");
          return r.blob();
        })
        .then((blob) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(blob);
        })
        .catch(() => resolve(null));

      setTimeout(() => resolve(null), 5000);
    } catch {
      resolve(null);
    }
  });
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, r = 10) {
  ctx.beginPath();
  ctx.arc(x, y - r, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 4, y - r + 2);
  ctx.lineTo(x + 4, y - r + 2);
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y - r, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

export async function applyWatermark(
  file: File,
  timestamp: string,
  coords?: GeoPosition,
  personelName?: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(16, Math.floor(img.height * 0.024));
        const lineH = fontSize * 1.6;
        const pad = 14;

        const lines: string[] = [
          `${timestamp}`,
          personelName ? `${personelName}` : "",
          coords
            ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
            : `Lokasi tidak tersedia`,
        ].filter(Boolean);

        const MAP_SIZE = Math.min(Math.floor(img.width * 0.28), 200);
        const ZOOM = 16;
        let mapImg: HTMLImageElement | null = null;
        let mapOffsetX = 0;

        if (coords) {
          mapImg = await fetchMapThumbnail(
            coords.latitude,
            coords.longitude,
            MAP_SIZE,
            ZOOM,
          );
        }

        const barH = lines.length * lineH + pad * 2;
        const barY = img.height - barH;

        ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
        ctx.fillRect(0, barY, img.width, barH);

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(0, barY, 6, barH);

        if (mapImg) {
          const mapW = MAP_SIZE;
          const mapH = MAP_SIZE;
          const mapX = img.width - mapW - 10;
          const mapY = barY + (barH - mapH) / 2;
          mapOffsetX = mapW + 16;

          ctx.save();
          const r = 8;
          ctx.beginPath();
          ctx.moveTo(mapX + r, mapY);
          ctx.lineTo(mapX + mapW - r, mapY);
          ctx.arcTo(mapX + mapW, mapY, mapX + mapW, mapY + r, r);
          ctx.lineTo(mapX + mapW, mapY + mapH - r);
          ctx.arcTo(mapX + mapW, mapY + mapH, mapX + mapW - r, mapY + mapH, r);
          ctx.lineTo(mapX + r, mapY + mapH);
          ctx.arcTo(mapX, mapY + mapH, mapX, mapY + mapH - r, r);
          ctx.lineTo(mapX, mapY + r);
          ctx.arcTo(mapX, mapY, mapX + r, mapY, r);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(mapImg, mapX, mapY, mapW, mapH);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(mapX + r, mapY);
          ctx.lineTo(mapX + mapW - r, mapY);
          ctx.arcTo(mapX + mapW, mapY, mapX + mapW, mapY + r, r);
          ctx.lineTo(mapX + mapW, mapY + mapH - r);
          ctx.arcTo(mapX + mapW, mapY + mapH, mapX + mapW - r, mapY + mapH, r);
          ctx.lineTo(mapX + r, mapY + mapH);
          ctx.arcTo(mapX, mapY + mapH, mapX, mapY + mapH - r, r);
          ctx.lineTo(mapX, mapY + r);
          ctx.arcTo(mapX, mapY, mapX + r, mapY, r);
          ctx.closePath();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          const tileX = Math.floor(
            ((coords!.longitude + 180) / 360) * Math.pow(2, ZOOM),
          );
          const tileY = Math.floor(
            ((1 -
              Math.log(
                Math.tan((coords!.latitude * Math.PI) / 180) +
                  1 / Math.cos((coords!.latitude * Math.PI) / 180),
              ) /
              Math.PI) /
              2) *
            Math.pow(2, ZOOM),
          );
          const exactTileX =
            ((coords!.longitude + 180) / 360) * Math.pow(2, ZOOM) - tileX;
          const latRad = (coords!.latitude * Math.PI) / 180;
          const exactTileY =
            ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
              2) *
              Math.pow(2, ZOOM) -
            tileY;

          const pinX = mapX + exactTileX * 256 * (mapW / 256);
          const pinY = mapY + exactTileY * 256 * (mapH / 256);
          drawPin(ctx, pinX, pinY, Math.max(8, Math.floor(mapW * 0.07)));

          ctx.font = `bold ${Math.max(10, fontSize * 0.6)}px 'Courier New', monospace`;
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText("OpenStreetMap", mapX + mapW / 2, mapY + mapH - 2);
          ctx.textAlign = "left";
        }

        const maxTextW = img.width - mapOffsetX - pad * 2 - 10;

        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        lines.forEach((line, i) => {
          let display = line;
          while (
            ctx.measureText(display).width > maxTextW &&
            display.length > 4
          ) {
            display = display.slice(0, -2) + "…";
          }
          ctx.fillText(display, pad + 10, barY + pad + i * lineH);
        });

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processPhoto(
  file: File,
  personelName?: string,
): Promise<{
  blob: Blob;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}> {
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const coords = await getCurrentPosition();

  // Step 1: Compress the image first
  const compressedBlob = await compressImage(file);
  const compressedFile = new File([compressedBlob], file.name, {
    type: "image/jpeg",
  });

  // Step 2: Apply watermark on top of compressed image
  const blob = await applyWatermark(
    compressedFile,
    timestamp,
    coords ?? undefined,
    personelName,
  );

  return {
    blob,
    timestamp: now.toISOString(),
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  };
}