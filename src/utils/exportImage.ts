import { toPng, toBlob } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';

export interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

export type ExportResolution = 500 | 1080 | 1440 | 2160;

/**
 * Ensures images and fonts inside element are fully loaded and rendered before capture
 */
async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // Wait for document fonts
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font wait failures
    }
  }

  // Pre-load all images inside element
  const imgs = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve(true);
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        // Timeout after 2.5s to avoid blocking indefinitely
        setTimeout(() => resolve(false), 2500);
      });
    })
  );

  // Short micro-delay to let canvas/browser finish layout passes
  await new Promise((r) => setTimeout(r, 60));
}

/**
 * Captures an HTMLElement as a PNG data URL with fallback to html2canvas
 */
async function captureElementToDataUrl(
  element: HTMLElement,
  targetResolution: ExportResolution = 1080
): Promise<string> {
  await prepareElementForCapture(element);

  const rect = element.getBoundingClientRect();
  const width = rect.width || 1080;
  const height = rect.height || 1080;
  const scale = targetResolution / width;

  // 1. Primary engine: html-to-image
  try {
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: Math.max(1, scale),
      canvasWidth: targetResolution,
      canvasHeight: targetResolution,
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        transform: 'none',
        margin: '0',
      },
    });
    if (dataUrl && dataUrl.length > 500) {
      return dataUrl;
    }
  } catch (err) {
    console.warn('html-to-image capture encountered an issue, attempting html2canvas fallback', err);
  }

  // 2. Secondary fallback engine: html2canvas (robust against cross-origin images)
  const canvas = await html2canvas(element, {
    scale: Math.max(1, scale),
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width,
    height,
    logging: false,
  });

  return canvas.toDataURL('image/png', 0.98);
}

/**
 * Captures an HTMLElement as a Blob
 */
async function captureElementToBlob(
  element: HTMLElement,
  targetResolution: ExportResolution = 1080
): Promise<Blob> {
  await prepareElementForCapture(element);

  const rect = element.getBoundingClientRect();
  const width = rect.width || 1080;
  const scale = targetResolution / width;

  try {
    const blob = await toBlob(element, {
      quality: 0.98,
      pixelRatio: Math.max(1, scale),
      canvasWidth: targetResolution,
      canvasHeight: targetResolution,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    if (blob && blob.size > 1000) {
      return blob;
    }
  } catch (err) {
    console.warn('html-to-image blob failed, using canvas fallback', err);
  }

  // Fallback: use dataUrl
  const dataUrl = await captureElementToDataUrl(element, targetResolution);
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Exports a single DOM element as PNG with custom resolution (500x500, 1080x1080, etc.)
 */
export async function exportElementAsPng(
  element: HTMLElement,
  fileName: string,
  targetResolution: ExportResolution = 1080
): Promise<void> {
  const dataUrl = await captureElementToDataUrl(element, targetResolution);

  const link = document.createElement('a');
  link.download = `${fileName}-${targetResolution}x${targetResolution}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  triggerConfetti();
}

/**
 * Exports a single DOM element as a high-quality PDF page (square format)
 */
export async function exportElementAsPdf(
  element: HTMLElement,
  fileName: string,
  targetResolution: ExportResolution = 1080
): Promise<void> {
  const dataUrl = await captureElementToDataUrl(element, targetResolution);

  // 210mm x 210mm square PDF page
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 210, undefined, 'FAST');
  pdf.save(`${fileName}.pdf`);

  triggerConfetti();
}

/**
 * Batch exports all 6 pages into a clean ZIP file containing PNGs
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

    const blob = await captureElementToBlob(item.element, targetResolution);
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

/**
 * Batch exports all 6 pages into a single multi-page PDF booklet
 */
export async function exportAllVisualsAsPdf(
  elementsWithNames: { element: HTMLElement; fileName: string }[],
  onProgress?: (progress: ExportProgress) => void,
  targetResolution: ExportResolution = 1080
): Promise<void> {
  const total = elementsWithNames.length;
  // 210x210 mm square booklet
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210],
  });

  for (let i = 0; i < total; i++) {
    const item = elementsWithNames[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        label: `Génération de la page PDF ${i + 1}/${total} (${item.fileName})...`,
      });
    }

    const dataUrl = await captureElementToDataUrl(item.element, targetResolution);

    if (i > 0) {
      pdf.addPage([210, 210]);
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 210, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      label: 'Finalisation du document PDF...',
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`chefs-club-livret-menu-semaine-${dateStr}.pdf`);

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
