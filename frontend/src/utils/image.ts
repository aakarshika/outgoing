/**
 * Utility for client-side image compression and renaming.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  newFileName?: string;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Compresses an image file and optionally renames it.
 * Defaults to max 1200px (width or height), 0.8 quality, and webp format.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    newFileName,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            // Determine final filename
            const originalName = file.name;
            const nameWithoutExtension =
              originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const extension = format.split('/')[1];
            const finalFileName = newFileName
              ? newFileName.includes('.')
                ? newFileName
                : `${newFileName}.${extension}`
              : `${nameWithoutExtension}.${extension}`;

            const compressedFile = new File([blob], finalFileName, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          format,
          quality,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
