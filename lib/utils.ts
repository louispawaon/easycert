import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    format: 'a4',
    compress: true // Enable PDF compression
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
    
    pdf.addImage(img, 'JPEG', x, y, width, height, undefined, 'FAST');
  }
  
  pdf.save(filename);
}
