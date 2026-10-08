// Les photos sont réduites avant l'envoi : une photo de smartphone (4 à 8 Mo, soit 5 à 11 Mo en base64)
// dépasse la limite de corps de requête des fonctions Vercel (4,5 Mo). 1600 px suffisent à l'analyse.
export const MAX_IMAGE_SIDE_PX = 1600;
const JPEG_QUALITY = 0.82;
// Marge sous la limite Vercel de 4,5 Mo pour le reste du corps JSON
export const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;

/**
 * Dimensions réduites en conservant les proportions (jamais d'agrandissement).
 */
export function computeScaledSize(width: number, height: number, maxSide = MAX_IMAGE_SIDE_PX): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Dessine une image ou une vidéo dans un canevas réduit et renvoie un JPEG en data URL.
 */
export function drawScaledJpeg(source: CanvasImageSource, width: number, height: number): string {
  const size = computeScaledSize(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible.');
  ctx.drawImage(source, 0, 0, size.width, size.height);
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Image trop volumineuse même après compression.');
  }
  return dataUrl;
}

/**
 * Lit un fichier image choisi par l'utilisateur et le renvoie réduit, en JPEG (data URL).
 * L'élément <img> applique l'orientation EXIF de la photo.
 */
export async function resizeImageFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image illisible.'));
      img.src = url;
    });
    return drawScaledJpeg(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}
