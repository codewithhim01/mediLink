import React from 'react';

/**
 * Generates an SVG avatar URL using UI-Avatars with high readability.
 */
export function getFallbackAvatar(name?: string, bg = '0d9488', color = 'ffffff'): string {
  const cleanName = (name || 'Doctor')
    .replace(/^Dr\.\s*/i, '')
    .trim() || 'MD';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${bg}&color=${color}&bold=true&format=svg`;
}

/**
 * Standard synthetic image onError handler that gracefully swaps to a high-res SVG fallback avatar.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackName?: string,
  bg = '0d9488'
) {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite loop if fallback fails
  target.src = getFallbackAvatar(fallbackName || target.alt || 'Medical Provider', bg);
}
