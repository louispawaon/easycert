import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TextElement } from "@/types/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateCertificateImage(
  name: string,
  imageUrl: string,
  textElements: TextElement[],
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new Image();
  img.src = imageUrl;
  await new Promise((resolve) => (img.onload = resolve));

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  textElements.forEach((element) => {
    ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    const text = element.type === 'name' ? name : element.text;
    ctx.fillText(text, element.x, element.y);
  });

  return canvas.toDataURL('image/png');
}

export function addEventListener(event: string, handler: EventListener): void {
  window.addEventListener(event, handler);
}

export function removeEventListener(event: string, handler: EventListener): void {
  window.removeEventListener(event, handler);
}

export function dispatchEvent(event: CustomEvent): void {
  window.dispatchEvent(event);
}

export function getLocalStorageItem(key: string): string | null {
  return localStorage.getItem(key);
}

export function setLocalStorageItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeLocalStorageItem(key: string): void {
  localStorage.removeItem(key);
}
