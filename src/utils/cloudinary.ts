/**
 * Generate Cloudinary image URL with optimization parameters
 * Falls back to original URL if not a Cloudinary URL
 */
export function getCloudinaryUrl(src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
} = {}): string {
  // If it's already a Cloudinary URL, add optimization params
  if (src.includes('cloudinary.com') || src.includes('res.cloudinary.com')) {
    const baseUrl = src.split('/upload/')[0] + '/upload/';
    const imagePath = src.split('/upload/')[1];
    
    const transformations = ['f_auto', 'q_auto'];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format && options.format !== 'auto') transformations.push(`f_${options.format}`);
    
    return `${baseUrl}${transformations.join(',')}/${imagePath}`;
  }
  
  // Return original if not Cloudinary
  return src;
}

/**
 * Generate srcset for responsive images
 */
export function getSrcset(src: string, widths: number[] = [375, 768, 1200]): string {
  if (!src.includes('cloudinary.com') && !src.includes('res.cloudinary.com')) {
    return src;
  }
  
  return widths
    .map(w => `${getCloudinaryUrl(src, { width: w })} ${w}w`)
    .join(', ');
}
