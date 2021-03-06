import { GraphDrawData } from './models/data';
import { Rect } from './models/rect';
import { Point } from './models/point';
import { Line } from './models/line';
import { Node } from './models/node';
import { Store } from './store/index';
import { Options } from './options';
import { Lock } from './models/status';
import { Layer } from './layer';

export class HoverLayer extends Layer {
  // debugger
  protected data: GraphDrawData;

  anchorRadius = 6;

  line: Line;
  // for move line.
  initLine: Line;
  node: Node;
  hoverLineCP: Point;
  lasthoverLineCP: Point;
  // The dock of to point of line.
  dockAnchor: Point;

  hoverAnchorIndex = -1;

  dockLineX = 0;
  dockLineY = 0;

  root: Node;
  dragRect: Rect;
  constructor(public options: Options = {}, TID: String) {
    super(TID);
    this.data = Store.get(this.generateStoreKey('topology-data'));
    Store.set(this.generateStoreKey('LT:HoverLayer'), this);
  }

  lineTo(to: Point, toArrow: string = 'none') {
    if (!this.line || this.line.locked) {
      return;
    }
    this.line.setTo(to, toArrow);
    if (this.line.from.id || this.line.to.id) {
      this.line.calcControlPoints();
    }
    Store.set(this.generateStoreKey('pts-') + this.line.id, null);
    Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
  }

  lineFrom(from: Point) {
    if (this.line.locked) {
      return;
    }

    this.line.setFrom(from, this.line.fromArrow);
    if (this.line.from.id || this.line.to.id) {
      this.line.calcControlPoints();
    }
    Store.set(this.generateStoreKey('pts-') + this.line.id, null);
    Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
  }

  lineMove(pt: Point, initPos: { x: number; y: number; }) {
    if (this.line.locked) {
      return;
    }
    const x = pt.x - initPos.x;
    const y = pt.y - initPos.y;
    this.line.setTo(new Point(this.initLine.to.x + x, this.initLine.to.y + y), this.line.toArrow);
    this.line.setFrom(new Point(this.initLine.from.x + x, this.initLine.from.y + y), this.line.fromArrow);
    for (let i = 0; i < this.initLine.controlPoints.length; ++i) {
      this.line.controlPoints[i].x = this.initLine.controlPoints[i].x + x;
      this.line.controlPoints[i].y = this.initLine.controlPoints[i].y + y;
    }
    Store.set(this.generateStoreKey('pts-') + this.line.id, null);
    Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.data.locked === Lock.NoEvent) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = this.options.hoverColor;
    ctx.fillStyle = '#fff';
    // anchors
    if (this.node && !this.data.locked) {
      if (!this.node.getTID()) {
        this.node.setTID(this.TID);
      }
      this.root = this.getRoot(this.node) || this.node;
      if (this.root) {
        ctx.save();
        ctx.strokeStyle = this.options.dragColor;
        ctx.globalAlpha = 0;
        if (this.root.rotate) {
          ctx.translate(this.root.rect.center.x, this.root.rect.center.y);
          ctx.rotate(((this.root.rotate + this.root.offsetRotate) * Math.PI) / 180);
          ctx.translate(-this.root.rect.center.x, -this.root.rect.center.y);
        }
        ctx.beginPath();
        ctx.strokeRect(this.root.rect.x, this.root.rect.y, this.root.rect.width, this.root.rect.height);
        ctx.restore();
      }
      if (!this.options.hideAnchor && this.node.name !== 'text') {
        for (let i = 0; i < this.node.rotatedAnchors.length; ++i) {
          if (this.node.locked || this.node.hideAnchor || (this.node.rotatedAnchors[i].hidden && this.hoverAnchorIndex !== i)) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.node.rotatedAnchors[i].x, this.node.rotatedAnchors[i].y, this.anchorRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = this.options.hoverColor;
    if (this.dockAnchor) {
      ctx.beginPath();
      ctx.arc(this.dockAnchor.x, this.dockAnchor.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hoverLineCP) {
      ctx.beginPath();
      ctx.arc(this.hoverLineCP.x, this.hoverLineCP.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = this.options.hoverColor + '80';
    ctx.lineWidth = 1;

    if (this.dockLineX > 0) {
      const size = Store.get(this.generateStoreKey('LT:size'));
      ctx.beginPath();
      ctx.moveTo(this.dockLineX, 0);
      ctx.lineTo(this.dockLineX, size.height);
      ctx.stroke();
    }

    if (this.dockLineY > 0) {
      const size = Store.get(this.generateStoreKey('LT:size'));
      // console.log('Store',Store,this.data)
      ctx.beginPath();
      ctx.moveTo(0, this.dockLineY);
      ctx.lineTo(size.width, this.dockLineY);
      ctx.stroke();
    }

    // Select nodes by drag.
    if (this.dragRect) {
      ctx.fillStyle = this.options.dragColor;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.strokeRect(this.dragRect.x, this.dragRect.y, this.dragRect.width, this.dragRect.height);
      ctx.fillRect(this.dragRect.x, this.dragRect.y, this.dragRect.width, this.dragRect.height);
    }

    ctx.restore();
  }

  getRoot(node: Node) {
    if (!node.parentId) {
      return null;
    }

    for (const item of this.data.pens) {
      if (item instanceof Node && item.id === node.parentId) {
        const n = this.getRoot(item);
        return n ? n : item;
      }
    }

    return null;
  }

  clear() {
    this.node = null;
    this.line = null;
  }
}
