"use client";

import { resolvePageDimensions, isEdgeToEdge, type PageSizeId } from "@/lib/page-size";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode certificate image"));
    img.src = src;
  });
}

export type GeneratePDFOptions = {
  /** Selected page-size preset. Defaults to `auto` (edge-to-edge per template). */
  pageSize?: PageSizeId;
};

/**
 * Render the supplied certificate PNGs into a single PDF.
 *
 * In `auto` mode each page is sized to the certificate's native aspect, so the
 * image fills the page exactly with no whitespace. In any fixed preset the
 * image is contain-fit centered on the chosen paper size, which preserves the
 * cert's aspect ratio and may introduce letterbox bands.
 */
export async function generatePDF(
  certificates: string[],
  filename: string,
  options: GeneratePDFOptions = {}
) {
  if (certificates.length === 0) return;
  const pageSize: PageSizeId = options.pageSize ?? "auto";
  const { jsPDF } = await import("jspdf");

  const firstImg = await loadImage(certificates[0]);
  const firstDims = resolvePageDimensions(pageSize, firstImg.width, firstImg.height);

  const pdf = new jsPDF({
    orientation: firstDims.widthMm > firstDims.heightMm ? "landscape" : "portrait",
    unit: "mm",
    // jsPDF accepts an explicit [w, h] tuple as a custom format.
    format: [firstDims.widthMm, firstDims.heightMm],
    compress: true,
  });

  for (let i = 0; i < certificates.length; i++) {
    const img = i === 0 ? firstImg : await loadImage(certificates[i]);
    const dims = resolvePageDimensions(pageSize, img.width, img.height);

    if (i > 0) {
      pdf.addPage(
        [dims.widthMm, dims.heightMm],
        dims.widthMm > dims.heightMm ? "landscape" : "portrait"
      );
    }

    if (isEdgeToEdge(pageSize)) {
      // Edge-to-edge: page already matches the image aspect; draw at origin.
      pdf.addImage(img, "JPEG", 0, 0, dims.widthMm, dims.heightMm, undefined, "FAST");
      continue;
    }

    // Contain-fit centered on a fixed-size page.
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgRatio = img.width / img.height;
    const pageRatio = pageWidth / pageHeight;

    let width: number;
    let height: number;
    if (imgRatio > pageRatio) {
      width = pageWidth;
      height = pageWidth / imgRatio;
    } else {
      height = pageHeight;
      width = pageHeight * imgRatio;
    }

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    pdf.addImage(img, "JPEG", x, y, width, height, undefined, "FAST");
  }

  pdf.save(filename);
}
