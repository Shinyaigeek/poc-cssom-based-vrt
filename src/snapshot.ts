import { Page, CDPSession } from 'playwright';
import { CSSOMSnapshot } from './types';

export interface CSSOMSnapshotOptions {
  selector?: string;
  includeChildren?: boolean;
}

export class CSSOMSnapshotCapture {
  static async captureSnapshot(
    page: Page,
    options: CSSOMSnapshotOptions = {}
  ): Promise<CSSOMSnapshot> {
    const { selector, includeChildren = true } = options;
    const cdpSession = await page.context().newCDPSession(page);

    try {
      await cdpSession.send('DOM.enable');
      await cdpSession.send('CSS.enable');

      // Get document and find target nodes
      const document = await cdpSession.send('DOM.getDocument', {
        depth: -1,
        pierce: true
      });

      let targetNodeIds: number[] = [];

      if (selector) {
        // Get nodes matching the selector
        const result = await cdpSession.send('DOM.querySelectorAll', {
          nodeId: document.root.nodeId,
          selector
        });
        
        if (includeChildren) {
          // Get all descendant nodes for each matched node
          for (const nodeId of result.nodeIds) {
            const descendants = await CSSOMSnapshotCapture.getAllNodeIds(
              await cdpSession.send('DOM.describeNode', { nodeId }), 
              cdpSession
            );
            targetNodeIds.push(...descendants);
          }
        } else {
          targetNodeIds = result.nodeIds;
        }
      } else {
        // Capture entire document
        targetNodeIds = await CSSOMSnapshotCapture.getAllNodeIds(document.root, cdpSession);
      }

      // Get computed styles for target nodes
      const styles: Record<string, any> = {};
      
      for (const nodeId of targetNodeIds) {
        try {
          const nodeInfo = await cdpSession.send('DOM.describeNode', { nodeId });
          
          // Only get styles for element nodes
          if (nodeInfo.node.nodeType === 1) {
            const computedStyle = await cdpSession.send('CSS.getComputedStyleForNode', {
              nodeId
            });
            
            const selector = await CSSOMSnapshotCapture.getNodeSelector(nodeId, cdpSession);
            styles[selector] = {
              nodeId,
              nodeName: nodeInfo.node.nodeName,
              attributes: nodeInfo.node.attributes || [],
              computedStyle: computedStyle.computedStyle.reduce((acc: Record<string, string>, prop: any) => {
                acc[prop.name] = prop.value;
                return acc;
              }, {})
            };
          }
        } catch (error) {
          // Skip nodes that can't be styled
        }
      }

      return {
        url: page.url(),
        selector: selector || 'document',
        timestamp: Date.now(),
        styles
      };
    } finally {
      await cdpSession.detach();
    }
  }

  private static async getAllNodeIds(node: any, cdpSession: CDPSession): Promise<number[]> {
    const nodeIds: number[] = [node.nodeId];
    
    if (node.children) {
      for (const child of node.children) {
        const childNodeIds = await CSSOMSnapshotCapture.getAllNodeIds(child, cdpSession);
        nodeIds.push(...childNodeIds);
      }
    }

    if (node.shadowRoots) {
      for (const shadowRoot of node.shadowRoots) {
        const shadowNodeIds = await CSSOMSnapshotCapture.getAllNodeIds(shadowRoot, cdpSession);
        nodeIds.push(...shadowNodeIds);
      }
    }

    if (node.contentDocument) {
      const contentNodeIds = await CSSOMSnapshotCapture.getAllNodeIds(node.contentDocument, cdpSession);
      nodeIds.push(...contentNodeIds);
    }

    return nodeIds;
  }

  private static async getNodeSelector(nodeId: number, cdpSession: CDPSession): Promise<string> {
    try {
      const { node } = await cdpSession.send('DOM.describeNode', { nodeId });
      
      // Build a simple selector
      let selector = node.nodeName.toLowerCase();
      
      if (node.attributes) {
        const attrs = node.attributes;
        for (let i = 0; i < attrs.length; i += 2) {
          if (attrs[i] === 'id' && attrs[i + 1]) {
            return `#${attrs[i + 1]}`;
          }
          if (attrs[i] === 'class' && attrs[i + 1]) {
            selector += `.${attrs[i + 1].split(' ').join('.')}`;
          }
        }
      }
      
      return selector || `node-${nodeId}`;
    } catch {
      return `node-${nodeId}`;
    }
  }
}