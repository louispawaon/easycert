"use client";

import { useQuery } from "@tanstack/react-query";
import {
  templateImageQueryKey,
  loadTemplateImage,
  type ImageDimensions,
} from "@/lib/template-image";

const ZERO_DIMENSIONS: ImageDimensions = { width: 0, height: 0 };

/**
 * Loads the template image once per `imageUrl` and shares both the decoded
 * `HTMLImageElement` and its natural dimensions with all consumers via the
 * React Query cache (designer + canvas preview + final output preview).
 */
export function useTemplateImage(imageUrl: string | null) {
  const { data } = useQuery({
    queryKey: templateImageQueryKey(imageUrl),
    queryFn: () => loadTemplateImage(imageUrl!),
    enabled: Boolean(imageUrl),
    staleTime: Infinity,
  });

  return {
    image: data?.image ?? null,
    dimensions: data?.dimensions ?? ZERO_DIMENSIONS,
  };
}

/** @deprecated Use `useTemplateImage` instead. */
export { useTemplateImage as useCertificateTemplateImage };
