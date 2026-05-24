export interface Position {
  x: number;
  y: number;
}

export type TileType = 'empty' | 'wall' | 'entrance' | 'exit' | 'trapdoor' | 'signpost';

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  label?: string; // e.g. "A", "B", "Q", "Entrance", "Exit"
  subtitle?: string;
  trapdoorId?: string; // links to a shortcut
}

export interface Trapdoor {
  id: string;
  name: string; // e.g. "Database::instance()"
  source: Position;
  target: Position;
  color: string; // slate-400, amber-500, emerald-500, rose-500, etc.
  description: string;
  codeSnippet: string;
  stateKey?: string; // Representing mutable state (e.g. current_user_id)
  isSafe?: boolean; // For Phase 5 immutable signposts
}

export interface GameLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'archeology' | 'system';
  message: string;
  details?: string;
}

export interface Chapter {
  id: number;
  title: string;
  slug: string;
  sections: Array<{
    heading?: string;
    text: string;
    quote?: string;
  }>;
  codeExample?: {
    filename: string;
    language: string;
    code: string;
    explanation: string;
  };
  labyrinthPhase: LabyrinthPhase;
  interactiveChallenge: {
    instruction: string;
    successCondition: string;
    badgeName: string;
  };
}

export type LabyrinthPhase = 
  | 'classic_corridor' 
  | 'first_shortcut' 
  | 'folklore_chaos' 
  | 'map_lying'
  | 'testing_fever' 
  | 'dependency_injection';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  error?: string;
  leakageTrace?: string;
}
