export type TextElement = {
  id: string;
  type: 'name' | 'static';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isDragging: boolean;
  fontWeight: 'normal' | 'bold' | 'lighter' | number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  individualAdjustments?: Record<string, { x: number; y: number }>;
}; 

export interface ImageDimensions {
  width: number;
  height: number;
}