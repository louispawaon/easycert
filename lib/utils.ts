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
  canvas: HTMLCanvasElement,
  previewDimensions: { width: number; height: number }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new Image();
  img.src = imageUrl;
  await new Promise((resolve) => (img.onload = resolve));

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const scaleX = img.width / previewDimensions.width;
  const scaleY = img.height / previewDimensions.height;

  textElements.forEach((element) => {
    ctx.font = `${element.fontSize * scaleY}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    const text = element.type === 'name' ? name : element.text;
    ctx.fillText(text, element.x * scaleX, element.y * scaleY);
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

export async function generatePDF(certificates: string[], filename: string) {
  const { jsPDF } = await import('jspdf');
    
  const firstImg = new Image();
  firstImg.src = certificates[0];
  await new Promise((resolve) => (firstImg.onload = resolve));
  
  const pdf = new jsPDF({
    orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  for (let i = 0; i < certificates.length; i++) {
    const img = new Image();
    img.src = certificates[i];
    await new Promise((resolve) => (img.onload = resolve));
    
    if (i > 0) {
      pdf.addPage('a4', img.width > img.height ? 'landscape' : 'portrait');
    }
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgRatio = img.width / img.height;
    const pageRatio = pageWidth / pageHeight;
    
    let width, height;
    if (imgRatio > pageRatio) {
      width = pageWidth;
      height = pageWidth / imgRatio;
    } else {
      height = pageHeight;
      width = pageHeight * imgRatio;
    }
    
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    
    pdf.addImage(img, 'PNG', x, y, width, height);
  }
  
  pdf.save(filename);
}
