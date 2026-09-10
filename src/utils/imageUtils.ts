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

// Download any media file (image, video, audio) safely without navigating the current page or losing state
export async function downloadMediaFile(url: string, filename: string): Promise<void> {
  if (!url) return;

  // 1. Data URL or Blob URL: Download directly in browser memory
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Try proxy download endpoint first (Bypasses all CDN CORS blocks & prevents console red errors)
  try {
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 25000);
      return;
    }
  } catch (proxyErr) {
    console.warn('Proxy download failed, trying client fetch:', proxyErr);
  }

  // 3. Fallback: Try direct client-side fetch (works if CDN has CORS headers enabled)
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 25000);
      return;
    }
  } catch (clientErr) {
    console.warn('Client-side blob download failed:', clientErr);
  }

  // 4. Final Fallback: Use proxy download link with target="_blank" so user current work is never replaced
  try {
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('All download methods failed:', err);
  }
}

export function downloadImage(url: string, filename: string) {
  downloadMediaFile(url, filename);
}

export function downloadVideo(url: string, filename: string) {
  downloadMediaFile(url, filename);
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

    const cleanName = item.name.replace(/\.[^/.]+$/, '') + `_ai_replaced_${i + 1}.png`;

    // If base64 data URL
    if (item.resultImageUrl.startsWith('data:')) {
      const parts = item.resultImageUrl.split(',');
      if (parts.length >= 2) {
        folder?.file(cleanName, parts[1], { base64: true });
        continue;
      }
    }

    // If remote or blob URL
    try {
      const res = await fetch(item.resultImageUrl);
      const blob = await res.blob();
      folder?.file(cleanName, blob);
    } catch {
      // Fallback: try via proxy if remote fetch fails
      try {
        const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(item.resultImageUrl)}&filename=${encodeURIComponent(cleanName)}`;
        const res = await fetch(proxyUrl);
        const blob = await res.blob();
        folder?.file(cleanName, blob);
      } catch (err) {
        console.warn(`Không thể thêm ảnh ${item.name} vào tệp ZIP:`, err);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
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

