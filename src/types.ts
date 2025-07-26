export interface Line {
  id: string;
  startDot: string;
  endDot: string;
  player: number;
}

export interface Square {
  id: string;
  player: number;
  topLeftX?: number;
  topLeftY?: number;
  x?: number;
  y?: number;
}

export interface PossibleLine {
  id: string;
  startDot: string;
  endDot: string;
}

export interface Dot {
  id: string;
  x: number;
  y: number;
} 