/*
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class TreeNode {
  public parent: TreeNode | null = null;
  public children: TreeNode[] = [];
  public windowID: string | null = null;
  public splitType: "horizontal" | "vertical" = "horizontal";
  public splitWeights: number[] | null = null;
  public lastGeometry: Rect | null = null;

  constructor() { }

  public get isLeaf(): boolean {
    return this.children.length === 0;
  }

  public addChild(node: TreeNode, index: number = -1): void {
    node.parent = this;
    if (index < 0 || index >= this.children.length) {
      this.children.push(node);
    } else {
      this.children.splice(index, 0, node);
    }
  }

  public removeChild(node: TreeNode): void {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
    }
  }

  public replaceChild(oldNode: TreeNode, newNode: TreeNode): void {
    const index = this.children.indexOf(oldNode);
    if (index >= 0) {
      this.children[index] = newNode;
      newNode.parent = this;
      oldNode.parent = null;
    }
  }
}

class BinaryTreeLayout implements ILayout {
  public static readonly id = "BinaryTreeLayout";
  public readonly classID = BinaryTreeLayout.id;
  public readonly description = "Tree";
  public readonly capacity?: number | null;

  private root: TreeNode | null = null;
  private nextSplit: "horizontal" | "vertical" | null = null;
  private lastFocusID: string | null = null;

  constructor() {
  }

  public setNextSplit(split: "horizontal" | "vertical"): boolean {
    if (this.nextSplit === split) {
      return false;
    }
    this.nextSplit = split;
    return true;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    this.reconcile(ctx, tileables);

    if (this.root) {
      this.applyNode(this.root, area, gap, tileables);
    }
  }

  public adjust(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number,
  ): void {
    const path = this.findPath(this.root, basis.id);
    if (!path) return;

    this.adjustEdge(path, "horizontal", delta.east, area, gap, false);
    this.adjustEdge(path, "horizontal", -delta.west, area, gap, true);
    this.adjustEdge(path, "vertical", delta.south, area, gap, false);
    this.adjustEdge(path, "vertical", -delta.north, area, gap, true);
  }

  public resize(
    basis: WindowClass,
    direction: "east" | "west" | "south" | "north",
    step: -1 | 1,
    area: Rect,
    gap: number,
  ): boolean {
    const path = this.findPath(this.root, basis.id);
    if (!path) return false;

    const horizontal = direction === "east" || direction === "west";
    const preferBefore = direction === "west" || direction === "north";
    const growStep = preferBefore ? -step : step;
    for (let pathIndex = path.length - 2; pathIndex >= 0; pathIndex--) {
      const parent = path[pathIndex];
      const branch = path[pathIndex + 1];
      if ((parent.splitType === "horizontal") !== horizontal) continue;

      const childIndex = parent.children.indexOf(branch);
      const preferredBoundary = preferBefore ? childIndex - 1 : childIndex;
      const fallbackBoundary = preferBefore ? childIndex : childIndex - 1;
      const boundary = this.isValidBoundary(parent, preferredBoundary)
        ? preferredBoundary
        : fallbackBoundary;
      if (!this.isValidBoundary(parent, boundary)) continue;

      const parentGeometry = parent.lastGeometry || area;
      const dimension = horizontal ? parentGeometry.width : parentGeometry.height;
      const available = dimension - gap * (parent.children.length - 1);
      const basisAfterBoundary = boundary === childIndex - 1;
      const boundaryStep = basisAfterBoundary ? -growStep : growStep;
      this.moveBoundary(parent, boundary, dimension * 0.05 * boundaryStep, available);
      return true;
    }
    return false;
  }

  private reconcile(ctx: EngineContext, tileables: WindowClass[]): void {
    const tileableIDs = new Set(tileables.map(t => t.id));



    if (ctx.currentWindow && this.findNode(this.root, ctx.currentWindow.id)) {
      this.lastFocusID = ctx.currentWindow.id;
    }

    // remove nodes for windows that no longer exist
    this.pruneTree(this.root, tileableIDs);

    // if root disappeared
    if (this.root && this.root.isLeaf && this.root.windowID && !tileableIDs.has(this.root.windowID)) {
      this.root = null;
    }

    // collapse empty containers
    this.simplifyTree(this.root);
    if (this.root && !this.root.isLeaf && this.root.children.length === 0) {
      this.root = null;
    }

    // add new windows
    tileables.forEach(tileable => {
      if (!this.findNode(this.root, tileable.id)) {
        this.insertWindow(ctx, tileable, tileables);
      }
    });
  }

  private pruneTree(node: TreeNode | null, currentIDs: Set<string>): void {
    if (!node) return;

    // check children
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (child.isLeaf) {
        if (child.windowID && !currentIDs.has(child.windowID)) {
          node.children.splice(i, 1);
          child.parent = null;
        }
      } else {
        this.pruneTree(child, currentIDs);
        // if child container became empty, remove it?
        // handled in simplifyTree
      }
    }
  }

  private simplifyTree(node: TreeNode | null): void {
    if (!node || node.isLeaf) return;

    // recursively simplify children
    [...node.children].forEach(c => this.simplifyTree(c));

    // remove empty leaf children (that are not windows)
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (child.isLeaf && !child.windowID) {
        node.children.splice(i, 1);
        child.parent = null;
      }
    }

    // collapse single-child containers
    if (node.children.length === 1) {
      const child = node.children[0];
      if (node.parent) {
        node.parent.replaceChild(node, child);
      } else {
        // if i am root, make my child the new root
        this.root = child;
        child.parent = null;
      }
    }
  }

  private findNode(node: TreeNode | null, windowID: string): TreeNode | null {
    if (!node) return null;
    if (node.windowID === windowID) return node;
    for (const child of node.children) {
      const res = this.findNode(child, windowID);
      if (res) return res;
    }
    return null;
  }

  private findPath(
    node: TreeNode | null,
    windowID: string,
    path: TreeNode[] = [],
  ): TreeNode[] | null {
    if (!node) return null;
    const currentPath = [...path, node];
    if (node.windowID === windowID) return currentPath;
    for (const child of node.children) {
      const found = this.findPath(child, windowID, currentPath);
      if (found) return found;
    }
    return null;
  }

  private adjustEdge(
    path: TreeNode[],
    splitType: "horizontal" | "vertical",
    amount: number,
    area: Rect,
    gap: number,
    before: boolean,
  ): void {
    if (amount === 0) return;
    for (let pathIndex = path.length - 2; pathIndex >= 0; pathIndex--) {
      const parent = path[pathIndex];
      if (parent.splitType !== splitType) continue;
      const childIndex = parent.children.indexOf(path[pathIndex + 1]);
      const boundary = before ? childIndex - 1 : childIndex;
      if (!this.isValidBoundary(parent, boundary)) continue;

      const parentGeometry = parent.lastGeometry || area;
      const dimension = splitType === "horizontal"
        ? parentGeometry.width
        : parentGeometry.height;
      const available = dimension - gap * (parent.children.length - 1);
      this.moveBoundary(parent, boundary, amount, available);
      return;
    }
  }

  private isValidBoundary(parent: TreeNode, boundary: number): boolean {
    return boundary >= 0 && boundary < parent.children.length - 1;
  }

  private moveBoundary(
    parent: TreeNode,
    boundary: number,
    amount: number,
    available: number,
  ): void {
    if (available <= 0) return;
    const weights = this.getSplitWeights(parent);
    const change = amount / available;
    const minimum = 0.03;
    const adjusted = Math.max(
      minimum - weights[boundary],
      Math.min(change, weights[boundary + 1] - minimum),
    );
    weights[boundary] += adjusted;
    weights[boundary + 1] -= adjusted;
  }

  private getSplitWeights(node: TreeNode): number[] {
    if (!node.splitWeights || node.splitWeights.length !== node.children.length) {
      node.splitWeights = node.children.map(() => 1 / node.children.length);
    }
    return node.splitWeights;
  }

  private insertWindow(ctx: EngineContext, tileable: WindowClass, contextTileables: WindowClass[]): void {
    const newNode = new TreeNode();
    newNode.windowID = tileable.id;

    if (!this.root) {
      this.root = newNode;
      return;
    }

    let targetNode: TreeNode | null = null;
    let cursorSplit: {
      splitType: "horizontal" | "vertical";
      before: boolean;
    } | null = null;

    const cursorPos = ctx.cursorPos;
    if (cursorPos) {
      const hoveredWindow = contextTileables.find((window) => {
        if (window === tileable) return false;
        const geometry = window.geometry;
        return (
          cursorPos[0] >= geometry.x &&
          cursorPos[0] <= geometry.maxX &&
          cursorPos[1] >= geometry.y &&
          cursorPos[1] <= geometry.maxY
        );
      });

      if (hoveredWindow) {
        targetNode = this.findNode(this.root, hoveredWindow.id);
        const geometry = hoveredWindow.geometry;
        const horizontalOffset = Math.abs(
          (cursorPos[0] - geometry.x) / geometry.width - 0.5,
        );
        const verticalOffset = Math.abs(
          (cursorPos[1] - geometry.y) / geometry.height - 0.5,
        );
        const splitType = horizontalOffset >= verticalOffset
          ? "horizontal"
          : "vertical";
        cursorSplit = {
          splitType,
          before: splitType === "horizontal"
            ? cursorPos[0] < geometry.x + geometry.width / 2
            : cursorPos[1] < geometry.y + geometry.height / 2,
        };
      }
    }

    // check tree for max timestamp to find insertion point
    if (!targetNode && this.root) {
      let maxTime = -1;

      const stack: TreeNode[] = [this.root];
      while (stack.length > 0) {
        const node = stack.pop();
        if (!node) continue;

        if (node.isLeaf && node.windowID) {
          const win = contextTileables.find(w => w.id === node.windowID);
          if (win && win.timestamp > maxTime) {
            maxTime = win.timestamp;
            targetNode = node;
          }
        } else {
          node.children.forEach(c => stack.push(c));
        }
      }
    }

    if (!targetNode) {
      // fallback: use root or first leaf
      let curr = this.root;
      while (!curr.isLeaf && curr.children.length > 0) {
        curr = curr.children[0];
      }
      targetNode = curr;
    }

    // simplified i3-insertion:
    // if nextSplit is set, we need to create a new container around the targetNode with that split
    // if nextSplit is NOT set, we just add as sibling to current container

    const parent = targetNode.parent;

    if (this.nextSplit) {
      // user requested a split direction for the NEXT window
      // wrap targetNode in a new container of type nextSplit
      const newContainer = new TreeNode();
      newContainer.splitType = this.nextSplit;

      if (parent) {
        parent.replaceChild(targetNode, newContainer);
      } else {
        this.root = newContainer;
      }

      targetNode.parent = null;
      newContainer.addChild(targetNode);
      newContainer.addChild(newNode);

      this.nextSplit = null; // reset after usage
      return;
    }

    if (cursorSplit) {
      this.insertBeside(
        targetNode,
        newNode,
        cursorSplit.splitType,
        cursorSplit.before,
      );
      return;
    }

    if (parent) {
      // add as sibling
      const index = parent.children.indexOf(targetNode);
      parent.addChild(newNode, index + 1);
    } else {
      // targetNode is root
      // create a new container to hold both
      // default split: based on config or horizontal
      const newContainer = new TreeNode();
      newContainer.splitType = CONFIG.defaultSplitOrientation === 'vertical' ? 'vertical' : 'horizontal';

      this.root = newContainer;
      targetNode.parent = null; // detach from old context

      newContainer.addChild(targetNode);
      newContainer.addChild(newNode);
    }
  }

  private insertBeside(
    targetNode: TreeNode,
    newNode: TreeNode,
    splitType: "horizontal" | "vertical",
    before: boolean,
  ): void {
    const parent = targetNode.parent;
    if (parent && parent.splitType === splitType) {
      const targetIndex = parent.children.indexOf(targetNode);
      const weights = [...this.getSplitWeights(parent)];
      const targetWeight = weights[targetIndex];
      weights[targetIndex] = targetWeight / 2;
      const insertIndex = before ? targetIndex : targetIndex + 1;
      weights.splice(insertIndex, 0, targetWeight / 2);
      parent.splitWeights = weights;
      parent.addChild(newNode, insertIndex);
      return;
    }

    const container = new TreeNode();
    container.splitType = splitType;
    if (parent) parent.replaceChild(targetNode, container);
    else this.root = container;

    if (before) {
      container.addChild(newNode);
      container.addChild(targetNode);
    } else {
      container.addChild(targetNode);
      container.addChild(newNode);
    }
  }

  private applyNode(node: TreeNode, area: Rect, gap: number, tileables: WindowClass[]): void {
    node.lastGeometry = area.clone();
    if (node.isLeaf) {
      if (node.windowID) {
        const win = tileables.find(w => w.id === node.windowID);
        if (win) {
          win.state = WindowState.Tiled;
          win.geometry = area;
        }
      }
      return;
    }

    if (node.children.length > 0) {
      const isHorizontal = node.splitType === 'horizontal';
      // calculate sizes
      // assuming equal split for n children for simplicity in this minimal version,
      // ignoring custom splitRatio for n>2 or creating complex binary structures

      const count = node.children.length;
      const totalGap = (count - 1) * gap;
      const availableSize = (isHorizontal ? area.width : area.height) - totalGap;
      const weights = this.getSplitWeights(node);
      let allocatedSize = 0;

      let currentPos = isHorizontal ? area.x : area.y;

      node.children.forEach((child, i) => {
        const mySize = i === count - 1
          ? availableSize - allocatedSize
          : Math.floor(availableSize * weights[i]);
        allocatedSize += mySize;

        const myRect = new Rect(
          isHorizontal ? currentPos : area.x,
          isHorizontal ? area.y : currentPos,
          isHorizontal ? mySize : area.width,
          isHorizontal ? area.height : mySize
        );

        this.applyNode(child, myRect, gap, tileables);

        currentPos += mySize + gap;
      });
    }
  }

  // stub for clone to satisfy potentially external usage
  public clone(): ILayout {
    return new BinaryTreeLayout();
  }

  public toString(): string {
    return "BinaryTreeLayout()";
  }
}
