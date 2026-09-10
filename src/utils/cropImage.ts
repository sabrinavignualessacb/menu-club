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
 * @param targetDimension output square size (e.g. 800px for crisp circular plate export)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  targetDimension: number = 800
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

  // Return high quality JPEG Data URL
  return canvas.toDataURL('image/jpeg', 0.92);
}
