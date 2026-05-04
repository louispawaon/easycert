"use client";

import { useQuery } from "@tanstack/react-query";
import {
  certTemplateImageQueryKey,
  loadCertificateTemplateImage,
  type CertificateImageDimensions,
} from "@/lib/cert-template-image";

const ZERO_DIMENSIONS: CertificateImageDimensions = { width: 0, height: 0 };

/**
 * Loads the certificate template once per `imageUrl` and shares both the decoded
 * `HTMLImageElement` and its natural dimensions with all consumers via the
 * React Query cache (designer + canvas preview + final certificate preview).
 */
export function useCertificateTemplateImage(imageUrl: string | null) {
  const { data } = useQuery({
    queryKey: certTemplateImageQueryKey(imageUrl),
    queryFn: () => loadCertificateTemplateImage(imageUrl!),
    enabled: Boolean(imageUrl),
    staleTime: Infinity,
  });

  return {
    image: data?.image ?? null,
    dimensions: data?.dimensions ?? ZERO_DIMENSIONS,
  };
}
