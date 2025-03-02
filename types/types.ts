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
}; 

export interface ImageDimentsions {
  width: number;
  height: number;
}