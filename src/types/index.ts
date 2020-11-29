export interface VisualizerNode {
  column: number;
  id: string;
  isFinish: boolean;
  isStart: boolean;
  row: number;
  distance: number;
  isWall: boolean;
  isVisited: boolean;
  isOnShortestPath: boolean;
  isOnQueue: boolean;
  previousNode?: string;
}

export type NodeCoordinates = [row: number, column: number];

export interface DijstrasReturnObject {
  nodesInShortestPathOrder: VisualizerNode[];
  queue: VisualizerNode[];
  visitedNodesInOrder: VisualizerNode[];
}
