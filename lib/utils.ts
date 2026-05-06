export { cn } from "./cn";
export {
  generateCertificateImage,
  generateCertificates,
} from "./certificate-image";

export function addEventListener(event: string, handler: EventListener): void {
  window.addEventListener(event, handler);
}

export function removeEventListener(event: string, handler: EventListener): void {
  window.removeEventListener(event, handler);
}

export function dispatchEvent(event: CustomEvent): void {
  window.dispatchEvent(event);
}
