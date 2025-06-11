export interface NodeStyle {
  nodeId: number;
  nodeName: string;
  attributes: string[];
  computedStyle: Record<string, string>;
}

export interface CSSOMSnapshot {
  url: string;
  selector: string;
  timestamp: number;
  styles: Record<string, NodeStyle>;
}