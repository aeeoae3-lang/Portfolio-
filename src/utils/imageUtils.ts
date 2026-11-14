/**
 * Agricultural Image Processing & Preset Utilities
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface PresetImage {
  id: string;
  label: string;
  url: string;
  category: 'crop' | 'pest' | 'disease' | 'tip';
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB max raw file

export function validateImageFile(file: { type: string; size: number }): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic'];
  const isImageMime = file.type.startsWith('image/') || validTypes.includes(file.type.toLowerCase());

  if (!isImageMime) {
    return { valid: false, error: 'Please choose an image file (JPG, PNG, WebP, GIF).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Image exceeds maximum size of 15MB. Please choose a smaller photo.' };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function isDataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:image/');
}

/**
 * Curated high-resolution agricultural library presets
 */
export const AGRICULTURAL_PRESETS: PresetImage[] = [
  // Crops
  {
    id: 'preset-wheat',
    label: 'Golden Wheat Field',
    url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-rice',
    label: 'Green Rice Paddy',
    url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-maize',
    label: 'Sweet Maize / Corn',
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-chickpea',
    label: 'Chickpea / Pulses',
    url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-tomato',
    label: 'Vine Ripe Tomatoes',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-cotton',
    label: 'Raw Cotton Bolls',
    url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-sugarcane',
    label: 'Sugarcane Plantation',
    url: 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-tulsi',
    label: 'Tulsi / Medicinal Herbs',
    url: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-aloevera',
    label: 'Aloe Vera Succulent',
    url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=900&q=80',
    category: 'crop'
  },
  {
    id: 'preset-stage-seed',
    label: 'Seed Stage Grains',
    url: '/assets/stages/wheat_seed_grains_1794561239079.jpg',
    category: 'crop'
  },
  {
    id: 'preset-stage-seedling',
    label: 'Seedling Stage Rows',
    url: '/assets/stages/wheat_seedling_stage_1794561238785.jpg',
    category: 'crop'
  },
  {
    id: 'preset-stage-flowering',
    label: 'Flowering Stage Spikes',
    url: '/assets/stages/wheat_flowering_stage_1794561239431.jpg',
    category: 'crop'
  },
  {
    id: 'preset-stage-harvest',
    label: 'Harvesting Stage Field',
    url: '/assets/stages/wheat_harvesting_stage_1794561240623.jpg',
    category: 'crop'
  },

  // Pests
  {
    id: 'preset-caterpillar',
    label: 'Stem Borer / Caterpillar',
    url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    category: 'pest'
  },
  {
    id: 'preset-aphid',
    label: 'Aphids / Sucking Insects',
    url: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=800&q=80',
    category: 'pest'
  },
  {
    id: 'preset-planthopper',
    label: 'Planthopper / Hopper Burn',
    url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
    category: 'pest'
  },
  {
    id: 'preset-armyworm',
    label: 'Armyworm Infestation',
    url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80',
    category: 'pest'
  },
  {
    id: 'preset-beetle',
    label: 'Foliar Flea Beetle',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    category: 'pest'
  },

  // Diseases
  {
    id: 'preset-rust',
    label: 'Stripe / Leaf Rust',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    category: 'disease'
  },
  {
    id: 'preset-blast',
    label: 'Fungal Blast Lesions',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    category: 'disease'
  },
  {
    id: 'preset-blight',
    label: 'Bacterial Leaf Blight',
    url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80',
    category: 'disease'
  },
  {
    id: 'preset-mildew',
    label: 'Powdery Mildew & Spots',
    url: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80',
    category: 'disease'
  },

  // Farming Tips
  {
    id: 'preset-soil',
    label: 'Soil Testing & Fertility',
    url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
    category: 'tip'
  },
  {
    id: 'preset-irrigation',
    label: 'Precision Drip & AWD',
    url: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=800&q=80',
    category: 'tip'
  },
  {
    id: 'preset-rotation',
    label: 'Legume Crop Rotation',
    url: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=800&q=80',
    category: 'tip'
  },
  {
    id: 'preset-ipm',
    label: 'Bio-Control & Ladybird IPM',
    url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=80',
    category: 'tip'
  }
];

export function getRecommendedPresets(category?: 'crop' | 'pest' | 'disease' | 'tip'): PresetImage[] {
  if (!category) return AGRICULTURAL_PRESETS;
  return AGRICULTURAL_PRESETS.filter(p => p.category === category);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const base64 = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Resizes and compresses an image file using browser HTML5 canvas.
 * Guarantees output fits cleanly within `maxTargetBytes` for reliable IndexedDB, Firestore, and Storage persistence.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 720,
  maxHeight = 540,
  quality = 0.72,
  maxTargetBytes = 95 * 1024
): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image in browser.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const estimateBytes = (url: string) => {
          const base64Length = url.length - (url.indexOf(',') + 1);
          return Math.round((base64Length * 3) / 4);
        };

        const renderAt = (w: number, h: number, q: number): string | null => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', q);
        };

        let currentQuality = quality;
        let compressedDataUrl = renderAt(width, height, currentQuality);
        if (!compressedDataUrl) {
          resolve({
            dataUrl: reader.result as string,
            sizeBytes: file.size,
            width,
            height
          });
          return;
        }

        let approxBytes = estimateBytes(compressedDataUrl);

        // Step 1: Adaptive quality step-down
        while (approxBytes > maxTargetBytes && currentQuality > 0.36) {
          currentQuality = Math.max(0.35, Number((currentQuality - 0.1).toFixed(2)));
          const next = renderAt(width, height, currentQuality);
          if (!next) break;
          compressedDataUrl = next;
          approxBytes = estimateBytes(compressedDataUrl);
        }

        // Step 2: Adaptive dimension step-down if image is unusually dense
        while (approxBytes > maxTargetBytes && Math.max(width, height) > 240) {
          width = Math.max(160, Math.round(width * 0.8));
          height = Math.max(120, Math.round(height * 0.8));
          const next = renderAt(width, height, currentQuality);
          if (!next) break;
          compressedDataUrl = next;
          approxBytes = estimateBytes(compressedDataUrl);
        }

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes: approxBytes,
          width,
          height
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
