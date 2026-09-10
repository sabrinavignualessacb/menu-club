export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Returns a cropped image Data URL based on pixel coordinates from react-easy-crop
 * @param imageSrc base64 or URL of the image
 * @param pixelCrop exact pixel bounding box {x, y, width, height}
 * @param targetDimension output square size (e.g. 600px for crisp circular plate export)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  targetDimension: number = 600
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context non disponible');
  }

  // Set high-res square dimension for crisp top-view plate rendering
  canvas.width = targetDimension;
  canvas.height = targetDimension;

  ctx.imageSmoothingQuality = 'high';

  // Draw the selected crop area from the source image onto the full canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetDimension,
    targetDimension
  );

  // Return high quality JPEG Data URL optimized for localStorage storage
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Resizes and compresses an image Data URL to fit within maxDimension
 * Prevents localStorage QuotaExceededError when uploading phone camera photos
 */
export async function compressImage(
  imageSrc: string,
  maxDimension: number = 800,
  quality: number = 0.82
): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    if (width <= maxDimension && height <= maxDimension && imageSrc.length < 300000) {
      return imageSrc;
    }

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('Could not compress image', err);
    return imageSrc;
  }
}
