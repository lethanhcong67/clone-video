import JSZip from 'jszip';

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 800 });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 800 });
    };
    img.src = dataUrl;
  });
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadAllAsZip(
  items: Array<{ name: string; resultImageUrl: string }>,
  zipFilename = 'ai-replaced-images.zip'
) {
  const zip = new JSZip();
  const folder = zip.folder('anh-da-chinh-sua');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.resultImageUrl) continue;

    // Extract base64
    const parts = item.resultImageUrl.split(',');
    if (parts.length < 2) continue;

    const base64Data = parts[1];
    const cleanName = item.name.replace(/\.[^/.]+$/, '') + `_ai_replaced_${i + 1}.png`;
    folder?.file(cleanName, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convert web image url to data URL (for sample test images)
export async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
