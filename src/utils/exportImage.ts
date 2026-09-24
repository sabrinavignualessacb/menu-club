import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';
import { EMBEDDED_FONTS_CSS } from './cachedFontsCss';

export interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

export type ExportResolution = 500 | 1080 | 1440 | 2160;

const dataUrlCache = new Map<string, string>();

async function urlToDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (dataUrlCache.has(url)) return dataUrlCache.get(url)!;

  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        dataUrlCache.set(url, result);
        resolve(result);
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    // If fetch fails, try image-to-canvas fallback
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 800;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const data = canvas.toDataURL('image/jpeg', 0.92);
            dataUrlCache.set(url, data);
            resolve(data);
            return;
          }
        } catch {
          // ignore
        }
        resolve(url);
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }
}

/**
 * Ensures images and fonts inside element are fully loaded and rendered before capture
 */
async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // 1. Force load document fonts into memory
  if (document.fonts) {
    try {
      await Promise.allSettled([
        document.fonts.load("700 24px 'Cormorant Garamond'"),
        document.fonts.load("600 24px 'Cormorant Garamond'"),
        document.fonts.load("700 30px 'Playfair Display'"),
        document.fonts.load("700 44px 'Dancing Script'"),
        document.fonts.load("700 16px 'Plus Jakarta Sans'"),
        document.fonts.load("700 16px 'Cinzel'"),
        document.fonts.ready,
      ]);
    } catch {
      // Ignore font wait failures
    }
  }

  // 2. Pre-inline all <img> tags inside element
  const imgs = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
        const inlined = await urlToDataUrl(img.src);
        if (inlined && inlined.startsWith('data:')) {
          img.src = inlined;
        }
      }
      if (img.complete && img.naturalHeight !== 0) return true;
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1500);
      });
    })
  );

  // 3. Pre-inline all background-image styles in element & children
  const nodes = Array.from(element.querySelectorAll<HTMLElement>('*'));
  nodes.push(element);
  await Promise.all(
    nodes.map(async (node) => {
      const bg = node.style.backgroundImage;
      if (bg && bg.includes('url(') && !bg.includes('data:')) {
        const match = bg.match(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/);
        if (match && match[1]) {
          const inlined = await urlToDataUrl(match[1]);
          if (inlined && inlined.startsWith('data:')) {
            node.style.backgroundImage = `url("${inlined}")`;
          }
        }
      }
    })
  );

  // Micro-delay to let browser finish layout and paint passes
  await new Promise((r) => setTimeout(r, 60));
}

/**
 * Captures an HTMLElement as a PNG data URL with fallback to html2canvas
 */
async function captureElementToDataUrl(
  element: HTMLElement,
  targetResolution: ExportResolution = 1080
): Promise<string> {
  const container = document.getElementById('export-nodes-container');
  const originalContainerOpacity = container ? container.style.opacity : undefined;
  const originalContainerVisibility = container ? container.style.visibility : undefined;

  // Temporarily reveal capture node to the layout engine (behind viewport)
  if (container) {
    container.style.opacity = '1';
    container.style.visibility = 'visible';
  }

  try {
    await prepareElementForCapture(element);

    const rect = element.getBoundingClientRect();
    const width = rect.width || 1080;
    const scale = targetResolution / width;

    // 1. Primary engine: html-to-image with embedded base64 fonts & skipFonts
    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 1,
        width: 1080,
        height: 1080,
        canvasWidth: targetResolution,
        canvasHeight: targetResolution,
        cacheBust: false,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: EMBEDDED_FONTS_CSS,
        filter: () => true,
      });
      if (dataUrl && dataUrl.length > 500) {
        return dataUrl;
      }
    } catch (err) {
      console.warn('html-to-image capture encountered an issue, attempting html2canvas fallback', err);
    }

    // 2. Secondary fallback engine: html2canvas
    const canvas = await html2canvas(element, {
      scale: Math.max(1, scale),
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1080,
      windowHeight: 1080,
      logging: false,
    });

    return canvas.toDataURL('image/png', 0.98);
  } finally {
    if (container && originalContainerOpacity !== undefined) {
      container.style.opacity = originalContainerOpacity;
      container.style.visibility = originalContainerVisibility || 'visible';
    }
  }
}

/**
 * Captures an HTMLElement as a Blob
 */
async function captureElementToBlob(
  element: HTMLElement,
  targetResolution: ExportResolution = 1080
): Promise<Blob> {
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
