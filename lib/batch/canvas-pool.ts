/**
 * Lightweight reusable canvas helper for batch certificate rendering.
 *
 * Allocating a fresh `HTMLCanvasElement` per certificate strands the GPU/CPU
 * backing store on the JS heap until garbage collection runs, which under
 * tight loops (hundreds of certificates) can spike memory hard enough to
 * crash the tab. Reusing a single canvas keeps peak memory bounded to one
 * full-resolution bitmap regardless of batch size.
 *
 * `dispose()` zeroes the canvas dimensions, which is the standard browser
 * hint to release the underlying drawing surface immediately rather than
 * waiting for GC.
 */
export type ReusableCanvas = {
  canvas: HTMLCanvasElement;
  dispose: () => void;
};

export function createReusableCanvas(): ReusableCanvas {
  const canvas = document.createElement("canvas");

  return {
    canvas,
    dispose: () => {
      try {
        canvas.width = 0;
        canvas.height = 0;
      } catch {
        /* ignore -- canvas may already be detached */
      }
    },
  };
}
