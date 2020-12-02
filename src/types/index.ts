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

export interface GraphAlgorithmResults {
  nodesInShortestPathOrder: VisualizerNode[];
  queue: VisualizerNode[];
  visitedNodesInOrder: VisualizerNode[];
  stepsToFind: number;
}

export type AlgorithmFn = (
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number,
) => Omit<GraphAlgorithmResults, 'nodesInShortestPathOrder'>;

export type GraphAlgorithm = 'astar' | 'dijkstra' | 'dfs';
