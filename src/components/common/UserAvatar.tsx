import React from 'react';

export function isImageAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith('data:image') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('/')
  );
}

export function getUserInitials(name?: string, fallbackAvatar?: string): string {
  if (fallbackAvatar && !isImageAvatar(fallbackAvatar) && fallbackAvatar.length <= 3) {
    return fallbackAvatar.toUpperCase();
  }
  if (!name) return 'U';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U'
  );
}

export function optimizeProfileImageFile(
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError?: (msg: string) => void
) {
  if (!file.type.startsWith('image/')) {
    onError?.('Please select a valid image file (PNG, JPG, WebP, or SVG).');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const rawDataUrl = reader.result as string;
    if (file.type === 'image/svg+xml') {
      onSuccess(rawDataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxDim = 320;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.9);
        onSuccess(compressed);
      } else {
        onSuccess(rawDataUrl);
      }
    };
    img.onerror = () => {
      onSuccess(rawDataUrl);
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

interface UserAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  className = 'w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold',
}) => {
  const hasPhoto = isImageAvatar(avatar);
  const initials = getUserInitials(name, avatar);

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
    >
      {hasPhoto ? (
        <img
          src={avatar}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
