// Resolves with the natural pixel size of an image (respects EXIF orientation in modern browsers).
export function getImageSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read image'));
    img.src = url;
  });
}
