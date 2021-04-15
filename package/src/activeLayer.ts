import { Store } from './store/index';

import { Options } from './options';
import { Pen, PenType } from './models/pen';
import { Node } from './models/node';
import { Line } from './models/line';
import { Rect } from './models/rect';
import { Point } from './models/point';
import { TopologyData } from './models/data';
import { Lock } from './models/status';

import { drawLineFns } from './middles';
import { flatNodes } from './middles/functions/node';
import { getBezierPoint } from './middles/lines/curve';
import { Layer } from './layer';

export class ActiveLayer extends Layer {
  // debugger
  protected data: TopologyData;

  rotateCPs: Point[] = []; //旋转控制点
  sizeCPs: Point[] = []; //尺寸控制点
  rect: Rect;
  controlSize:number = 3 //控制点大小

  pens: Pen[] = [];

  // nodes: Node[] = [];
  // lines: Line[] = [];

  rotate = 0;

  // 备份初始位置，方便移动事件处理
  initialSizeCPs: Point[] = [];
  nodeRects: Rect[] = [];
  childrenRects: { [key: string]: Rect; } = {};
  childrenRotate: { [key: string]: number; } = {};

  // nodes移动时，停靠点的参考位置
  dockWatchers: Point[] = [];

  rotating = false;
  constructor(public options: Options = {}, TID: String) {
    super(TID)
    this.data = Store.get(this.generateStoreKey('topology-data'));
    Store.set(this.generateStoreKey('LT:ActiveLayer'), this);
  }

  calcControlPoints() {
    if (this.pens.length === 1 && this.pens[0] instanceof Node) {
      this.rect = this.pens[0].rect;
      const rect = this.pens[0].rect
      if(this.pens[0].xCP){
        this.sizeCPs = [
          new Point(rect.center.x-rect.width/2, rect.center.y),
          new Point(rect.center.x+rect.width/2,  rect.center.y)
        ]
        this.rotateCPs = [
          new Point(this.pens[0].rect.x + this.pens[0].rect.width / 2, this.pens[0].rect.y - 15),
          new Point(this.pens[0].rect.x + this.pens[0].rect.width / 2, this.pens[0].rect.y + rect.height/2)
        ];
      }else{
        this.sizeCPs = this.pens[0].rect.toPoints();
        this.rotateCPs = [
          new Point(this.pens[0].rect.x + this.pens[0].rect.width / 2, this.pens[0].rect.y - 15),
          new Point(this.pens[0].rect.x + this.pens[0].rect.width / 2, this.pens[0].rect.y)
        ];
      }

      if (this.rotate || this.pens[0].rotate) {
        for (const pt of this.sizeCPs) {
          if (this.pens[0].rotate) {
            pt.rotate(this.pens[0].rotate, this.pens[0].rect.center);
          }
          if (this.rotate) {
            pt.rotate(this.rotate, this.rect.center);
          }
        }
        for (const pt of this.rotateCPs) {
          if (this.pens[0].rotate) {
            pt.rotate(this.pens[0].rotate, this.pens[0].rect.center);
          }
          if (this.rotate) {
            pt.rotate(this.rotate, this.rect.center);
          }
        }
      }

      if (this.options.hideRotateCP || this.pens[0].hideRotateCP) {
        this.rotateCPs = [new Point(-1000, -1000), new Point(-1000, -1000)];
      }

      return;
    }

    let x1 = 99999;
    let y1 = 99999;
    let x2 = -99999;
    let y2 = -99999;
    const pts = this.getPoints();
    for (const item of pts) {
      if (x1 > item.x) {
        x1 = item.x;
      }
      if (y1 > item.y) {
        y1 = item.y;
      }
      if (x2 < item.x) {
        x2 = item.x;
      }
      if (y2 < item.y) {
        y2 = item.y;
      }
    }
    this.rect = new Rect(x1, y1, x2 - x1, y2 - y1);
    this.sizeCPs = [new Point(x1, y1), new Point(x2, y1), new Point(x2, y2), new Point(x1, y2)];
    this.rotateCPs = [new Point(x1 + (x2 - x1) / 2, y1 - 35), new Point(x1 + (x2 - x1) / 2, y1)];

    if (this.options.hideRotateCP) {
      this.rotateCPs = [new Point(-1000, -1000), new Point(-1000, -1000)];
    }
  }

  locked() {
    for (const item of this.pens) {
      if (!item.locked) {
        return false;
      }
    }

    return true;
  }

  getPoints() {
    const points: Point[] = [];
    for (const item of this.pens) {
      if (item.type === PenType.Node) {
        const pts = item.rect.toPoints();
        if (item.rotate) {
          for (const pt of pts) {
            pt.rotate(item.rotate, item.rect.center);
          }
        }
        points.push.apply(points, pts);
      } else if (item instanceof Line) {
        points.push(item.from);
        points.push(item.to);
        if (item.name === 'curve') {
          for (let i = 0.01; i < 1; i += 0.02) {
            points.push(getBezierPoint(i, item.from, item.controlPoints[0], item.controlPoints[1], item.to));
          }
        }
      }
    }

    return points;
  }

  clear() {
    this.pens = [];
    this.sizeCPs = [];
    this.rotateCPs = [];
    Store.set(this.generateStoreKey('LT:activeNode'), null);
  }

  // 即将缩放选中的nodes，备份nodes最初大小，方便缩放比例计算
  saveNodeRects() {
    this.nodeRects = [];
    this.childrenRects = {};
    for (const item of this.pens) {
      this.nodeRects.push(new Rect(item.rect.x, item.rect.y, item.rect.width, item.rect.height));
      this.saveChildrenRects(item);
    }

    this.initialSizeCPs = [];
    for (const item of this.sizeCPs) {
      this.initialSizeCPs.push(item.clone());
    }

    this.getDockWatchers();
  }

  private saveChildrenRects(node: Pen) {
    if (!(node instanceof Node) || !node.children) {
      return;
    }

    for (const item of node.children) {
      this.childrenRects[item.id] = new Rect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
      this.childrenRotate[item.id] = item.rotate;
      this.saveChildrenRects(item);
    }
  }

  // pt1 - the point of mouse down.
  // pt2 - the point of mouse move.
  resize(type: number, pt1: { x: number; y: number; }, pt2: { x: number; y: number; }) {
    const p1 = new Point(pt1.x, pt1.y);
    const p2 = new Point(pt2.x, pt2.y);
    if (this.pens.length === 1 && this.pens[0].rotate % 360) {
      p1.rotate(-this.pens[0].rotate, this.nodeRects[0].center);
      p2.rotate(-this.pens[0].rotate, this.nodeRects[0].center);
    }
    
    let offsetX = p2.x - p1.x;
    let offsetY = p2.y - p1.y;
    if (this.pens[0].xCP) {
      offsetY = 0
    }
    const lines: Line[] = [];

    switch (type) {
      case 0:
        offsetX = -offsetX;
        offsetY = -offsetY;
        break;
      case 1:
        offsetY = -offsetY;
        break;
      case 3:
        offsetX = -offsetX;
        break;
    }
    let i = 0;
    for (const item of this.pens) {
      if (item.locked) {
        continue;
      }

      switch (item.type) {
        case PenType.Line:
          break;
        default:
          
          item.rect.width = this.nodeRects[i].width + offsetX;
          item.rect.height = this.nodeRects[i].height + offsetY;

          if (item.rect.width < 10) {
            item.rect.width = 10;
          }
          if (item.rect.height < 10) {
            item.rect.height = 10;
          }

          switch (type) {
            case 0:
              item.rect.x = item.rect.ex - item.rect.width;
              item.rect.y = item.rect.ey - item.rect.height;
              break;
            case 1:
              item.rect.ex = item.rect.x + item.rect.width;
              item.rect.y = item.rect.ey - item.rect.height;
              break;
            case 2:
              item.rect.ex = item.rect.x + item.rect.width;
              item.rect.ey = item.rect.y + item.rect.height;
              break;
            case 3:
              item.rect.x = item.rect.ex - item.rect.width;
              item.rect.ey = item.rect.y + item.rect.height;
              break;
          }
          item.rect.calcCenter();
          (item as Node).init();
          (item as Node).calcChildrenRect();
          break;
      }

      ++i;
    }

    this.updateLines();
  }

  move(x: number, y: number) {
    if (this.nodeRects.length !== this.pens.length) {
      return;
    }
    let i = 0;
    for (const item of this.pens) {
      if (item.locked) {
        continue;
      }
      if (item instanceof Node) {
        const offsetX = this.nodeRects[i].x + x - item.rect.x;
        const offsetY = this.nodeRects[i].y + y - item.rect.y;
        item.translate(offsetX, offsetY);
        const lines = this.getLinesOfNode(item);
        for (const line of lines) {
          line.translate(offsetX, offsetY);
        }
        item.calcChildrenRect();

        if (item.parentId && !item.locked) {
          let parent: Node;
          for (const n of this.data.pens) {
            if (n.id === item.parentId) {
              parent = n as Node;
              item.calcRectInParent(parent);
              break;
            }
          }
        }
      }

      if (item instanceof Line) {

      }

      ++i;
    }

    this.updateLines();

    if (this.options.on) {
      this.options.on('move', this.pens);
    }
  }

  getLinesOfNode(node: Node) {
    const result: Line[] = [];

    const nodes: Node[] = flatNodes([node]);

    for (const pen of this.data.pens) {
      if (!(pen instanceof Line)) {
        continue;
      }
      const line = pen as Line;
      let fromIn = false;
      let toIn = false;
      for (const item of nodes) {
        if (line.from.id === item.id) {
          fromIn = true;
        }
        if (line.to.id === item.id) {
          toIn = true;
        }
      }

      if (fromIn && toIn) {
        result.push(line);
      }
    }

    return result;
  }

  updateLines(pens?: Pen[]) {
    if (!pens) {
      pens = this.pens;
    }
    let lines: Line[] = [];
    if (pens.length === 1 && pens[0] instanceof Line) {
      lines.push(pens[0] as Line)
    }else{
      const nodes = flatNodes(pens);
      for (const line of this.data.pens) {
        if (!(line instanceof Line)) {
          continue;
        }
        for (const item of nodes) {
          let cnt = 0;
          if (line.from.id === item.id && item.rotatedAnchors[line.from.anchorIndex]) {
            line.from.x = item.rotatedAnchors[line.from.anchorIndex].x;
            line.from.y = item.rotatedAnchors[line.from.anchorIndex].y;
            ++cnt;
          }
          if (item.rotatedAnchors.length>1) {
            if (line.to.id === item.id  && item.rotatedAnchors[line.to.anchorIndex]) {
              line.to.x = item.rotatedAnchors[line.to.anchorIndex].x;
              line.to.y = item.rotatedAnchors[line.to.anchorIndex].y;
              ++cnt;
            }
          }
          if (cnt) {
            line.calcControlPoints();
          }
          // console.log('updateLines')
          line.textRect = null;
          Store.set(this.generateStoreKey('pts-') + line.id, null);
          lines.push(line);
        }
      }
    }
    Store.set(this.generateStoreKey('LT:updateLines'), lines);
  }

  offsetRotate(angle: number) {
    this.rotating = true;
    let i = 0;
    for (const item of this.pens) {
      if (!(item instanceof Node)) {
        continue;
      }
      const center = this.nodeRects[i].center.clone();
      if (this.pens.length > 1) {
        center.rotate(angle, this.rect.center);
      }
      item.rect.x = center.x - item.rect.width / 2;
      item.rect.y = center.y - item.rect.height / 2;
      item.rect.ex = item.rect.x + item.rect.width;
      item.rect.ey = item.rect.y + item.rect.height;
      item.rect.calcCenter();
      item.init();
      item.offsetRotate = angle;
      item.calcRotateAnchors(item.rotate + item.offsetRotate);
      this.rotateChildren(item);
      ++i;
    }
    this.rotate = angle;

    if (this.options.on) {
      this.options.on('rotated', this.pens);
    }
  }

  rotateChildren(node: Pen) {
    if (node.type !== PenType.Node || !(node as Node).children) {
      return;
    }

    for (const item of (node as Node).children) {
      if (item.type !== PenType.Node) {
        continue;
      }
      const oldCenter = this.childrenRects[item.id].center.clone();
      const newCenter = this.childrenRects[item.id].center.clone().rotate(this.rotate, this.rect.center);
      const rect = this.childrenRects[item.id].clone();
      rect.translate(newCenter.x - oldCenter.x, newCenter.y - oldCenter.y);
      item.rect = rect;
      item.rotate = this.childrenRotate[item.id] + this.rotate;
      (item as Node).init();
      this.rotateChildren(item);
    }
  }

  updateRotate() {
    for (const item of this.pens) {
      item.rotate += item.offsetRotate;
      item.offsetRotate = 0;
    }
    this.rotate = 0;
    this.rotating = false;
  }

  add(pen: Pen) {
    // debugger
    if (this.has(pen)) {
      return;
    }

    this.pens.push(pen);
    if (pen instanceof Node) {
      Store.set(this.generateStoreKey('LT:activeNode'), pen);
    }
  }

  setPens(pens: Pen[]) {

    // debugger
    this.pens = pens;
    if (this.pens.length === 1 && this.pens[0] instanceof Node) {
      Store.set(this.generateStoreKey('LT:activeNode'), this.pens[0]);
    }
  }

  has(pen: Pen) {
    for (const item of this.pens) {
      if (item.id === pen.id) {
        return true;
      }
    }
  }

  hasInAll(pen: Pen, pens?: Pen[]) {
    if (!pens) {
      pens = this.pens;
    }

    for (const item of pens) {
      if (item.id === pen.id) {
        return true;
      }

      if ((item as any).children) {
        const has = this.hasInAll(pen, (item as any).children);
        if (has) {
          return true;
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.data.locked > Lock.Readonly) {
      return;
    }

    if (!this.pens.length) {
      return;
    }
    this.pens.forEach(pen => {
      if (!pen.getTID()) {
        pen.setTID(this.TID);
      }
    });

    if (this.pens.length === 1 || !this.rotating) {
      this.calcControlPoints();
    }

    ctx.save();

    ctx.strokeStyle = this.options.activeColor;
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 1;

    const TID = this.TID;
    for (const item of this.pens) {
      if (item instanceof Node) {
        // debugger
        const tmp = new Node(item, true);
        tmp.setTID(TID);
        tmp.data = null;
        tmp.fillStyle = null;
        tmp.bkType = 0;
        tmp.icon = '';
        tmp.image = '';
        tmp.text = '';
        if (tmp.strokeStyle !== 'transparent') {
          tmp.strokeStyle = '#ffffff';
          tmp.lineWidth += 2;
          tmp.render(ctx);

          tmp.strokeStyle = this.options.activeColor;
          tmp.lineWidth -= 2;
        }
        tmp.render(ctx);
      }

      if (item instanceof Line) {
        const tmp = new Line(item);
        tmp.setTID(TID);
        if (tmp.lineWidth < 3) {
          const bk = new Line(item);
          bk.setTID(TID);
          bk.strokeStyle = '#ffffff';
          bk.render(ctx);
        }
        tmp.strokeStyle = this.options.activeColor;
        tmp.fromArrowColor = this.options.activeColor;
        tmp.toArrowColor = this.options.activeColor;
        tmp.render(ctx);

        if (!item.locked) {
          drawLineFns[item.name].drawControlPointsFn(ctx, item);
        }
      }
    }

    if (this.pens.length === 1 && this.pens[0].type === PenType.Line) {
      return;
    }

    // This is diffence between single node and more.
    if (this.rotate && this.pens.length > 1) {
      ctx.translate(this.rect.center.x, this.rect.center.y);
      ctx.rotate((this.rotate * Math.PI) / 180);
      ctx.translate(-this.rect.center.x, -this.rect.center.y);
    }

    // Occupied territory.\
    if (this.pens.length > 1 || (this.pens.length ===1 && this.pens[0].name !== 'text')) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(0.5, 0.5);
      ctx.beginPath();
      ctx.moveTo(this.sizeCPs[0].x, this.sizeCPs[0].y);
      ctx.lineTo(this.sizeCPs[1].x, this.sizeCPs[1].y);
      if (!this.pens[0].xCP) {
        ctx.lineTo(this.sizeCPs[2].x, this.sizeCPs[2].y);
        ctx.lineTo(this.sizeCPs[3].x, this.sizeCPs[3].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    if (this.data.locked || this.locked()) {
      ctx.restore();
      return;
    }

    // Draw rotate control point.
    ctx.beginPath();
    ctx.moveTo(this.rotateCPs[0].x, this.rotateCPs[0].y);
    ctx.lineTo(this.rotateCPs[1].x, this.rotateCPs[1].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.rotateCPs[0].x, this.rotateCPs[0].y, this.controlSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw size control points.
    if (!this.options.hideSizeCP && (this.pens.length > 1 || !this.pens[0].hideSizeCP)) {
      ctx.lineWidth = 1;
      for (const item of this.sizeCPs) {
        ctx.save();
        ctx.beginPath();
        if (this.pens.length === 1 && (this.pens[0].rotate || this.rotate)) {
          ctx.translate(item.x, item.y);
          ctx.rotate(((this.pens[0].rotate + this.rotate) * Math.PI) / 180);
          ctx.translate(-item.x, -item.y);
        }
        ctx.fillRect(item.x - 4.5, item.y - 4.5, 8, 8);
        ctx.strokeRect(item.x - 5.5, item.y - 5.5, 10, 10);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  getDockWatchers() {
    if (this.pens.length === 1) {
      this.dockWatchers = this.nodeRects[0].toPoints();
      this.dockWatchers.unshift(this.nodeRects[0].center);
      return;
    }

    if (!this.rect) {
      return;
    }
    this.dockWatchers = this.rect.toPoints();
    this.dockWatchers.unshift(this.rect.center);
  }

}
