export interface Player {
  id: string;
  name: string;
}

export interface Line {
  id: string;
  startDot: string;
  endDot: string;
  player: number;
}

export interface Square {
  id: string;
  player: number;
  corners: string[];
  topLeftX: number;
  topLeftY: number;
}

export interface Match {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  gridSize: number;
  player1: Player;
  player2: Player | null;
  lines: Line[];
  squares: Square[];
  scores: Record<number, number>;
  currentPlayer: number;
  winnerId: string | null;
  createdAt: any;
  updatedAt: any;
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