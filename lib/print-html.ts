import {
  isEdgeToEdge,
  pageSizeCssDescriptor,
  resolvePageDimensions,
  type PageSizeId,
} from "@/lib/page-size";

export type BuildPrintHtmlInput = {
  certificates: string[];
  attendees: string[];
  pageSize: PageSizeId;
  /** Natural pixel dimensions of any one certificate (all share the same template). */
  imageWidthPx: number;
  imageHeightPx: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the full HTML document used by the print window.
 *
 * In `auto` mode the page is declared with the cert's exact mm dimensions and
 * the image fills it edge-to-edge — no letterboxing. Fixed presets keep the
 * `object-fit: contain` flex-centered layout to preserve aspect ratio on the
 * chosen paper size.
 */
export function buildPrintHtml(input: BuildPrintHtmlInput): string {
  const { certificates, attendees, pageSize, imageWidthPx, imageHeightPx } = input;
  const pageSizeCss = pageSizeCssDescriptor(pageSize, imageWidthPx, imageHeightPx);
  const edgeToEdge = isEdgeToEdge(pageSize);

  // Page metadata for the document title only — every actual page is one cert.
  const dims = resolvePageDimensions(pageSize, imageWidthPx, imageHeightPx);

  const certificateLayoutCss = edgeToEdge
    ? `
      .certificate {
        page-break-after: always;
        margin: 0; padding: 0;
        width: 100%; height: 100vh;
        overflow: hidden;
      }
      .certificate img {
        width: 100%; height: 100%;
        display: block;
      }
    `
    : `
      .certificate {
        page-break-after: always;
        text-align: center;
        margin: 0; padding: 0;
        width: 100%; height: 100vh;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .certificate img {
        max-width: 100%; max-height: 100vh;
        height: auto; width: auto;
        object-fit: contain; display: block;
      }
    `;

  const body = certificates
    .map((cert, i) => {
      const alt = escapeHtml(`Certificate for ${attendees[i] ?? `attendee ${i + 1}`}`);
      return `<div class="certificate"><img src="${cert}" alt="${alt}" /></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificates (${dims.widthMm.toFixed(1)} x ${dims.heightMm.toFixed(1)} mm)</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: ${pageSizeCss}; margin: 0; }
    html, body {
      margin: 0; padding: 0; background: white;
      -webkit-appearance: none; appearance: none;
    }
    body { font-family: Arial, sans-serif; }
    ${certificateLayoutCss}
    .certificate:last-child { page-break-after: auto; }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      .certificate { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>${body}</body>
</html>`;
}
