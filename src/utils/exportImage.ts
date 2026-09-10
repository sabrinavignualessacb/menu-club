import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';

export interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

/**
 * Ensures images and fonts inside element are fully ready for capture
 */
async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // Wait for web fonts if available
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Pre-load all images inside element
  const imgs = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    })
  );
}

export type ExportResolution = 500 | 1080 | 1440 | 2160;

/**
 * Exports a single DOM element as PNG with custom resolution (500x500, 1080x1080, etc.)
 */
export async function exportElementAsPng(
  element: HTMLElement,
  fileName: string,
  targetResolution: ExportResolution = 1080
): Promise<void> {
  await prepareElementForCapture(element);

  const rect = element.getBoundingClientRect();
  const scale = targetResolution / (rect.width || 1080);
  const pixelRatio = Math.max(0.75, scale);

  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: pixelRatio,
    canvasWidth: targetResolution,
    canvasHeight: targetResolution,
    cacheBust: true,
    backgroundColor: '#0f172a',
    style: {
      transform: 'none',
      margin: '0',
    },
  });

  const link = document.createElement('a');
  link.download = `${fileName}-${targetResolution}x${targetResolution}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  triggerConfetti();
}

/**
 * Batch exports all 6 pages into a clean ZIP file
 */
export async function exportAllVisualsAsZip(
  elementsWithNames: { element: HTMLElement; fileName: string }[],
  onProgress?: (progress: ExportProgress) => void,
  targetResolution: ExportResolution = 1080
): Promise<void> {
  const zip = new JSZip();
  const total = elementsWithNames.length;

  for (let i = 0; i < total; i++) {
    const item = elementsWithNames[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        label: `Génération de ${item.fileName} (${targetResolution}x${targetResolution})...`,
      });
    }

    await prepareElementForCapture(item.element);

    const rect = item.element.getBoundingClientRect();
    const scale = targetResolution / (rect.width || 1080);
    const pixelRatio = Math.max(0.75, scale);

    const blob = await toBlob(item.element, {
      quality: 0.95,
      pixelRatio: pixelRatio,
      canvasWidth: targetResolution,
      canvasHeight: targetResolution,
      cacheBust: true,
      backgroundColor: '#0f172a',
    });

    if (blob) {
      zip.file(`${item.fileName}-${targetResolution}x${targetResolution}.png`, blob);
    }
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      label: 'Création du fichier ZIP...',
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `chefs-club-menu-semaine-${targetResolution}x${targetResolution}-${dateStr}.zip`);

  triggerConfetti();
}


function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1e3a8a', '#d97706', '#059669', '#3b82f6', '#f59e0b'],
    });
  } catch {
    // Ignore if canvas confetti isn't available
  }
}
