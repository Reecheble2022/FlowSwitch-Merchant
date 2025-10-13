import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadImage(
  file: File,
  bucket: 'agent-photos' | 'merchant-logos',
  folder: string = ''
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPG, PNG, or WebP image',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'Image must be less than 2MB',
    };
  }

  return { valid: true };
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
