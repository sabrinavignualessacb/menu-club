import { DayId, WeeklyMenuData } from '../types';

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
 * @param targetDimension output square size (360px provides retina sharpness for plate circles while keeping base64 under 30KB)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  targetDimension: number = 360
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

  ctx.imageSmoothingEnabled = true;
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

  // Return high quality JPEG Data URL optimized for Firestore (under 30KB)
  return canvas.toDataURL('image/jpeg', 0.76);
}

/**
 * Specifically compresses a dish plate image to fit within 360x360 and ~25KB.
 * Ensures the Firestore 1MB document limit is never exceeded even with 15 dishes.
 */
export async function compressDishImage(
  imageSrc: string,
  maxDimension: number = 360,
  quality: number = 0.76
): Promise<string> {
  if (!imageSrc || !imageSrc.startsWith('data:image/')) {
    return imageSrc;
  }
  // If already very compact (< 35KB), keep as is
  if (imageSrc.length < 35000) {
    return imageSrc;
  }

  try {
    const image = await createImage(imageSrc);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('Could not compress dish image', err);
    return imageSrc;
  }
}

/**
 * Resizes and compresses an image Data URL to fit within maxDimension
 * Prevents localStorage QuotaExceededError when uploading phone camera photos
 */
export async function compressImage(
  imageSrc: string,
  maxDimension: number = 600,
  quality: number = 0.76
): Promise<string> {
  if (!imageSrc || !imageSrc.startsWith('data:image/')) {
    return imageSrc;
  }
  try {
    const image = await createImage(imageSrc);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    if (width <= maxDimension && height <= maxDimension && imageSrc.length < 45000) {
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('Could not compress image', err);
    return imageSrc;
  }
}

/**
 * Traverses all dishes and cover photos of a WeeklyMenuData object.
 * Shrinks any bloated base64 images so the entire menu JSON stays well under
 * the 1,048,576 byte Firestore document limit (typically 150KB - 300KB total).
 */
export async function optimizeWeeklyMenuImages(menu: WeeklyMenuData): Promise<WeeklyMenuData> {
  if (!menu || !menu.days) return menu;

  const daysList: DayId[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  let hasModified = false;

  const newDays = { ...menu.days };

  for (const dayId of daysList) {
    const day = menu.days[dayId];
    if (!day || !Array.isArray(day.dishes)) continue;

    let dayModified = false;
    const newDishes = [...day.dishes];

    for (let i = 0; i < newDishes.length; i++) {
      const dish = newDishes[i];
      if (dish && dish.imageUrl && typeof dish.imageUrl === 'string' && dish.imageUrl.startsWith('data:image/')) {
        // If image is larger than 35KB, compress it to plate standard (360x360, ~25KB)
        if (dish.imageUrl.length > 35000) {
          try {
            const compressed = await compressDishImage(dish.imageUrl, 360, 0.76);
            if (compressed && compressed.length < dish.imageUrl.length) {
              newDishes[i] = { ...dish, imageUrl: compressed };
              dayModified = true;
              hasModified = true;
            }
          } catch (e) {
            console.warn(`Failed compressing image for ${dayId} dish ${i}`, e);
          }
        }
      }
    }

    if (dayModified) {
      newDays[dayId] = { ...day, dishes: newDishes };
    }
  }

  // Also optimize cover featuredPhotos if any are bloated
  let newCover = menu.cover;
  if (menu.cover && Array.isArray(menu.cover.featuredPhotos)) {
    let coverModified = false;
    const newFeatured = [...menu.cover.featuredPhotos];
    for (let j = 0; j < newFeatured.length; j++) {
      const photo = newFeatured[j];
      if (photo && typeof photo === 'string' && photo.startsWith('data:image/') && photo.length > 40000) {
        try {
          const comp = await compressDishImage(photo, 400, 0.76);
          if (comp && comp.length < photo.length) {
            newFeatured[j] = comp;
            coverModified = true;
            hasModified = true;
          }
        } catch (e) {
          console.warn(`Failed compressing cover photo ${j}`, e);
        }
      }
    }
    if (coverModified) {
      newCover = { ...menu.cover, featuredPhotos: newFeatured };
    }
  }

  if (!hasModified) {
    return menu;
  }

  return {
    ...menu,
    cover: newCover,
    days: newDays,
  };
}
