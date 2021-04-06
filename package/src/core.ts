import { Store } from './store/index';

import { Options, KeyType, KeydownType, DefalutOptions, Padding  } from './options';
import { Pen, PenType } from './models/pen';
import { Node, images } from './models/node';
import { Point } from './models/point';
import { Line } from './models/line';
import { TopologyData } from './models/data';
import { Lock, AnchorMode } from './models/status';
import { drawNodeFns, drawLineFns } from './middles/index';
import { Offscreen } from './offscreen';
import { RenderLayer } from './renderLayer';
import { HoverLayer } from './hoverLayer';
import { ActiveLayer } from './activeLayer';
import { AnimateLayer } from './animateLayer';
import { DivLayer } from './divLayer';
import { Rect } from './models/rect';
import { s8 } from './utils/uuid';
import { pointInRect } from './utils/canvas';
import { getRect } from './utils/rect';
import { formatPadding } from './utils/padding';
import { Socket } from './socket';

const resizeCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
enum MoveInType {
  None,
  Line,
  LineMove,
  LineFrom,
  LineTo,
  LineControlPoint,
  Nodes,
  ResizeCP,
  HoverAnchors,
  Rotate
}

interface ICaches {
  index: number;
  list: TopologyData[];
}

const dockOffset = 10;

export class Topology {
  id: String;
  data: TopologyData = new TopologyData();
  clipboard: TopologyData;
  caches: ICaches = {
    index: 0,
    list: []
  };
  options: Options;

  parentElem: HTMLElement;
  canvas: RenderLayer;
  offscreen: Offscreen;
  hoverLayer: HoverLayer;
  activeLayer: ActiveLayer;
  animateLayer: AnimateLayer;
  divLayer: DivLayer;

  private subcribe: Observer;
  private subcribeRender: Observer;
  private subcribeImage: Observer;
  private imageTimer: any;
  private subcribeAnimateEnd: Observer;
  private subcribeAnimateMoved: Observer;
  private subcribeMediaEnd: Observer;

  touchedNode: any;
  lastHoverNode: Node;
  lastHoverLine: Line;
  input = document.createElement('textarea');
  inputObj: Pen;
  mouseDown: { x: number; y: number; };
  lastTranlated = { x: 0, y: 0 };
  moveIn: {
    type: MoveInType;
    activeAnchorIndex: number;
    hoverAnchorIndex: number;
    hoverNode: Node;
    hoverLine: Line;
    activeNode: Node;
    lineControlPoint: Point;
  } = {
      type: MoveInType.None,
      activeAnchorIndex: 0,
      hoverAnchorIndex: 0,
      hoverNode: null,
      hoverLine: null,
      activeNode: null,
      lineControlPoint: null
    };
  needCache = false;

  private tip = '12315';
  tipMarkdown: HTMLElement;
  tipElem: HTMLElement;

  private scheduledAnimationFrame = false;
  private socket: Socket;
  private boundingRect: any;
  private scrolling = false;
  private rendering = false;

  mutilData:[]
  relativeTextNode:[] //图元关联文本集合
  rectangleWrap:boolean //ctrl+外框能拖动整个图形  
  pasteMouseDown: { x: number; y: number; };
  cacheHighLight:any[] //缓存高亮
  preAnchorInfo:any
  pasteDirection:string  //top left bottom right
  lineLinkML:{ //
    line:Line,
    fOrt:string  //from端连接母线还是 to端连接母线
  } = {
    line:null,
    fOrt:'from'
  }
  lines:any[]
  initCopyData:Pen[]
  isMLNode:Node
  
  constructor(parent: string | HTMLElement, options?: Options) {
    this.id = s8();
    this.initCopyData = []
    Store.set(this.generateStoreKey('topology-data'), this.data);
    
    if (!options) {
      options = {};
    }
    const font = Object.assign({}, DefalutOptions.font, options.font);
    options.font = font;
    this.options = Object.assign({}, DefalutOptions, options);

    if (typeof parent === 'string') {
      this.parentElem = document.getElementById(parent);
    } else {
      this.parentElem = parent;
    }
    this.parentElem.style.position = 'relative';
    this.rectangleWrap = false

    const id = this.id;
    this.activeLayer = new ActiveLayer(this.options, id);
    this.hoverLayer = new HoverLayer(this.options, id);
    this.animateLayer = new AnimateLayer(this.options, id);
    this.offscreen = new Offscreen(this.parentElem, this.options, id);
    this.canvas = new RenderLayer(this.parentElem, this.options, id);
    this.divLayer = new DivLayer(this.parentElem, this.options, id);

    this.resize();

    this.divLayer.canvas.ondragover = event => event.preventDefault();
    this.divLayer.canvas.ondrop = event => {
      this.ondrop(event);
    };
    this.boundingRect = this.divLayer.canvas.getBoundingClientRect();

    this.subcribe = Store.subscribe(this.generateStoreKey('LT:render'), () => {
      this.render();
    });
    this.subcribeRender = Store.subscribe('LT:render', () => {
      this.render();
    });
    this.subcribeImage = Store.subscribe(this.generateStoreKey('LT:imageLoaded'), () => {
      if (this.imageTimer) {
        clearTimeout(this.imageTimer);
      }
      this.imageTimer = setTimeout(() => {
        this.render();
      }, 100);
    });
    this.subcribeAnimateMoved = Store.subscribe(this.generateStoreKey('LT:rectChanged'), (e: any) => {
      this.activeLayer.updateLines(this.data.pens);
    });
    this.subcribeMediaEnd = Store.subscribe(this.generateStoreKey('mediaEnd'), (node: Node) => {
      if (node.nextPlay) {
        this.animateLayer.readyPlay(node.nextPlay);
        this.animateLayer.animate();
      }
      this.dispatch('mediaEnd', node);
    });
    this.subcribeAnimateEnd = Store.subscribe(this.generateStoreKey('animateEnd'), (e: any) => {
      if (!e) {
        return;
      }
      switch (e.type) {
        case 'node':
          this.offscreen.render();
          break;
      }
      this.divLayer.playNext(e.data.nextAnimate);
      this.dispatch('animateEnd', e);
    });
    this.divLayer.canvas.onmousemove = this.onMouseMove;
    this.divLayer.canvas.onmousedown = this.onmousedown;
    this.divLayer.canvas.onmouseup = this.onmouseup;
    this.divLayer.canvas.ondblclick = this.ondblclick;
    this.divLayer.canvas.tabIndex = 0;
    this.divLayer.canvas.onblur = () => {
      this.mouseDown = null;
      this.pasteMouseDown = null
    };
    this.divLayer.canvas.onwheel = event => {
      if (this.options.disableScale) {
        return;
      }
      switch (this.options.scaleKey) {
        // case KeyType.None:
        //   break;
        // case KeyType.Ctrl:
        //   if (!event.ctrlKey) {
        //     return;
        //   }
        //   break;
        // case KeyType.Shift:
        //   if (!event.shiftKey) {
        //     return;
        //   }
        //   break;
        // case KeyType.Alt:
        //   if (!event.altKey) {
        //     return;
        //   }
        //   break;
        // default:
        //   if (!event.ctrlKey && !event.altKey) {
        //     return;
        //   }
      }
      event.preventDefault();

      let obj = new Point(event.offsetX,event.offsetY)
      if (event.deltaY < 0) {
        if (this.data.scale>100) {
          return
        }
        this.scale(DefalutOptions.maxZoom, obj);
      } else {
        if (this.data.scale<18) {
          return;
        }
        this.scale(DefalutOptions.minZoom, obj);
      }

      this.divLayer.canvas.focus();

      return false;
    };

    this.divLayer.canvas.ontouchend = event => {
      this.ontouched(event);
    };

    switch (this.options.keydown) {
      case KeydownType.Document:
        document.onkeydown = this.onkeydown;
        break;
      case KeydownType.Canvas:
        this.divLayer.canvas.onkeydown = this.onkeydown;
        break;
    }

    this.input.style.position = 'absolute';
    this.input.style.zIndex = '-1';
    this.input.style.left = '-1000px';
    this.input.style.width = '0';
    this.input.style.height = '0';
    this.input.style.outline = 'none';
    this.input.style.border = '1px solid #cdcdcd';
    this.input.style.resize = 'none';
    this.parentElem.appendChild(this.input);

    this.createMarkdownTip();

    this.cache();

    window.addEventListener('resize', this.winResize);
    (window as any).topology = this;
    
    this.mutilData = []
  }

  winResize = () => {
    let timer: any;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      this.resize();
      this.overflow();
    }, 100);
  };

  resize(size?: { width: number; height: number; }) {
    this.canvas.resize(size);
    this.offscreen.resize(size);
    this.divLayer.resize(size);

    this.render();
    this.dispatch('resize', size);
  }

  private ondrop(event: DragEvent) {
    event.preventDefault();
    try {
      const json = JSON.parse(event.dataTransfer.getData('Text'));
      json.rect.x = (event.offsetX - json.rect.width / 2) << 0;
      json.rect.y = (event.offsetY - json.rect.height / 2) << 0;

      if (json.name === 'lineAlone') {
        this.addLine({
          name: this.data.lineName,
          from: new Point(json.rect.x, json.rect.y),
          fromArrow: this.data.fromArrowType,
          to: new Point(json.rect.x + json.rect.width, json.rect.y + json.rect.height),
          toArrow: this.data.toArrowType,
          strokeStyle: this.options.color
        },
          true
        );
      } else {
        const node = new Node(json);
        node.setTID(this.id);
        this.addNode(node, true);
        if (node.name === 'div') {
          this.dispatch('LT:addDiv', node);
        }
      }
      this.divLayer.canvas.focus();
    } catch (e) {
    }
  }

  getTouchOffset(touch: Touch) {
    let currentTarget: any = this.parentElem;
    let x = 0;
    let y = 0;
    while (currentTarget) {
      x += currentTarget.offsetLeft;
      y += currentTarget.offsetTop;
      currentTarget = currentTarget.offsetParent;
    }
    return { offsetX: touch.pageX - x, offsetY: touch.pageY - y };
  }

  private ontouched(event: TouchEvent) {
    if (!this.touchedNode) {
      return;
    }

    const pos = this.getTouchOffset(event.changedTouches[0]);
    this.touchedNode.rect.x = pos.offsetX - this.touchedNode.rect.width / 2;
    this.touchedNode.rect.y = pos.offsetY - this.touchedNode.rect.height / 2;

    const node = new Node(this.touchedNode);
    node.setTID(this.id);
    this.addNode(node, true);
    this.touchedNode = undefined;
  }

  addNode(node: Node | any, focus = false) {
    if (this.data.locked || !drawNodeFns[node.name]) {
      return null;
    }

    // if it's not a Node
    if (!node.init) {
      node = new Node(node);
    }

    if (!node.strokeStyle && this.options.color) {
      node.strokeStyle = this.options.color;
    }

    for (const key in node.font) {
      if (!node.font[key]) {
        node.font[key] = this.options.font[key];
      }
    }

    if (this.data.scale !== 1) {
      node.scale(this.data.scale);
    }

    this.data.pens.push(node);

    if (focus) {
      this.activeLayer.setPens([node]);
      this.render();
      this.cache();
      this.dispatch('addNode', node);
    }

    return node;
  }

  addLine(line: any, focus = false) {
    if (this.data.locked) {
      return null;
    }

    if (!line.clone) {
      line = new Line(line);
      line.calcControlPoints(true);
    }
    this.data.pens.push(line);

    if (focus) {
      this.activeLayer.setPens([line]);
      this.render();
      this.cache();
    }
    this.dispatch('addLine', line);

    return line;
  }

  // Render or redraw
  render(noFocus = false) {
    if (noFocus) {
      this.activeLayer.pens = [];
      this.hoverLayer.node = null;
      this.hoverLayer.line = null;
    }
    if (this.rendering) {
      return this;
    }
    this.rendering = true;
    this.offscreen.render();
    this.canvas.render();
    this.rendering = false;
  }

  // open - redraw by the data
  open(data?: any) {
    if (!data) {
      data = { pens: [] };
      this.activeLayer.clear()
      this.hoverLayer.clear()
    }
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    this.divLayer.clear();
    // tslint:disable-next-line:forin
    for (const key in images) {
      delete images[key];
    }

    this.animateLayer.stop();
    this.lock(data.locked || Lock.None);

    if (data.lineName) {
      this.data.lineName = data.lineName;
    }
    this.data.fromArrowType = data.fromArrowType;
    this.data.toArrowType = data.toArrowType;
    
    this.data.scale = data.scale || 1;
    Store.set(this.generateStoreKey('LT:scale'), this.data.scale);
    this.dispatch('scale', this.data.scale);

    this.data.bkColor = data.bkColor;
    this.data.bkImage = data.bkImage;
    this.data.pens = [];

    if (data.pens) {
      for (const item of data.pens) {
        if (!item.from) {
          this.data.pens.push(new Node(item));
        } else {
          this.data.pens.push(new Line(item));
        }
      }
    }

    this.data.websocket = data.websocket;
    this.data.grid = data.grid;
    this.data.gridColor = data.gridColor;
    this.data.gridSize = data.gridSize;
    this.data.rule = data.rule;
    this.data.ruleColor = data.ruleColor;
    if (typeof data.data === 'object') {
      this.data.data = JSON.parse(JSON.stringify(data.data));
    } else {
      this.data.data = data.data || '';
    }

    this.caches.list = [];
    this.cache();

    this.overflow();
    this.render(true);

    this.animate(true);
    this.openSocket();
  }

  openSocket(url?: string) {
    this.closeSocket();
    if (url || this.data.websocket) {
      this.socket = new Socket(url || this.data.websocket, this.data.pens);
    }
  }

  closeSocket() {
    if (this.socket) {
      this.socket.close();
    }
  }

  overflow() {
    const rect = this.getRect();
    let { width, height } = this.canvas;
    const { ex, ey } = rect;
    if (ex > width) {
      width = ex + 200;
    }
    if (ey > height) {
      height = ey + 200;
    }
    this.resize({ width, height });
  }


  private setNodeText() {
    this.inputObj.text = this.input.value;
    this.input.style.zIndex = '-1';
    this.input.style.left = '-1000px';
    this.input.style.width = '0';
    this.cache();
    this.offscreen.render();

    this.dispatch('setText', this.inputObj);

    this.inputObj = null;
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.scheduledAnimationFrame || this.data.locked === Lock.NoEvent) {
      return;
    }

    if (this.data.locked && this.mouseDown && this.moveIn.type !== MoveInType.None) {
      return;
    }
    this.scheduledAnimationFrame = true;
    const pos = new Point(e.x - this.boundingRect.x + this.parentElem.scrollLeft, e.y - this.boundingRect.y + this.parentElem.scrollTop);
    requestAnimationFrame(() => {
      if (!this.mouseDown) {
        this.getMoveIn(pos);
        // Render hover anchors.
        if (this.moveIn.hoverNode !== this.lastHoverNode) {
          if (this.lastHoverNode) {
            // Send a move event.
            this.dispatch('moveOutNode', this.lastHoverNode);

            this.hideTip();

            // Clear hover anchors.
            this.hoverLayer.node = null;
          }

          if (this.moveIn.hoverNode) {
            this.hoverLayer.node = this.moveIn.hoverNode;

            // Send a move event.
            this.dispatch('moveInNode', this.moveIn.hoverNode);

            this.showTip(this.moveIn.hoverNode, pos);
          }
        }

        // if (this.moveIn.hoverLine !== this.lastHoverLine) {
          if (this.lastHoverLine) {
            this.dispatch('moveOutLine', this.lastHoverLine);

            this.hideTip();
          }

          if (this.moveIn.hoverLine) {
            this.dispatch('moveInLine', this.moveIn.hoverLine);

            this.showTip(this.moveIn.hoverLine, pos);
          }
        // }

        if (this.moveIn.type === MoveInType.LineControlPoint) {
          this.hoverLayer.hoverLineCP = this.moveIn.lineControlPoint;
        } else if (this.hoverLayer.hoverLineCP) {
          this.hoverLayer.hoverLineCP = null;
        }
        if (
          this.moveIn.hoverNode !== this.lastHoverNode ||
          this.moveIn.type === MoveInType.HoverAnchors ||
          this.hoverLayer.lasthoverLineCP !== this.hoverLayer.hoverLineCP
        ) {
          this.hoverLayer.lasthoverLineCP = this.hoverLayer.hoverLineCP;
          this.render();
        }

        this.scheduledAnimationFrame = false;
        return;
      }

      // Move out parent element.
      const moveOutX =
        pos.x + 50 > this.parentElem.clientWidth + this.parentElem.scrollLeft;
      const moveOutY = pos.y + 50 > this.parentElem.clientHeight + this.parentElem.scrollTop;
      if (!this.options.disableMoveOutParent && (moveOutX || moveOutY)) {
        this.dispatch('moveOutParent', pos);

        let resize = false;
        if (pos.x + 50 > this.divLayer.canvas.clientWidth) {
          this.canvas.width += 200;
          resize = true;
        }
        if (pos.y + 50 > this.divLayer.canvas.clientHeight) {
          this.canvas.height += 200;
          resize = true;
        }
        if (resize) {
          this.resize({ width: this.canvas.width, height: this.canvas.height });
        }

        this.scroll(moveOutX ? 100 : 0, moveOutY ? 100 : 0);
      }

      const moveLeft = pos.x - 100 < this.parentElem.scrollLeft;
      const moveTop = pos.y - 100 < this.parentElem.scrollTop;
      if (moveLeft || moveTop) {
        this.scroll(moveLeft ? -100 : 0, moveTop ? -100 : 0);
      }
      switch (this.moveIn.type) {
        case MoveInType.None:
          if (this.data.locked === Lock.NoEvent) {
            return
          }
          if (this.mouseDown && (this.moveIn.type === MoveInType.None || this.rectangleWrap)) {
            if (!e.ctrlKey && !e.shiftKey) { 
              this.translate(e.x - this.boundingRect.x - this.mouseDown.x + this.parentElem.scrollLeft, e.y - this.boundingRect.y - this.mouseDown.y + this.parentElem.scrollTop, true);
            }
          }
          if (e.ctrlKey && !e.shiftKey) {
            this.unCombineAll()
            this.hoverLayer.dragRect = new Rect(
              this.mouseDown.x,
              this.mouseDown.y,
              pos.x - this.mouseDown.x,
              pos.y - this.mouseDown.y
            );
          }
          break;
        case MoveInType.Nodes:
          
          if (this.activeLayer.locked()) {
            break;
          }
          const x = pos.x - this.mouseDown.x;
          const y = pos.y - this.mouseDown.y;

         if (this.moveIn.hoverNode && this.moveIn.hoverNode.name === 'combine') {   //拖动到母线连接topo
          console.log(1111111111)
            let allML = this.data.pens.filter(it=> it instanceof Node && it.anchors.length>4)
            this.moveIn.hoverNode.children.map(it=>{
              if (it instanceof Line) {
                  allML.forEach(is=>{
                    if (it.from.x>is.rect.x && it.from.x<is.rect.ex && it.from.y>is.rect.y && it.from.y<is.rect.ey ) {
                        is.strokeStyle = this.options.activeColor
                        is.fillStyle = this.options.activeColor
                        it.from.id = is.id
                        it.from.anchorIndex = Math.floor(it.from.x -is.rect.x)
                    }
                    // else{
                    //   is.strokeStyle = is.sourceColor
                    //   is.fillStyle =  is.sourceColor
                    //   it.from.id = ""
                    // }
                    if (it.to.x>is.rect.x && it.to.x<is.rect.ex && it.to.y>is.rect.y && it.to.y<is.rect.ey ) {
                        is.strokeStyle = this.options.activeColor
                        is.fillStyle = this.options.activeColor
                        it.to.id = is.id
                        it.to.anchorIndex = Math.floor(it.to.x -is.rect.x)
                    }
                    // else{
                    //   is.strokeStyle = is.sourceColor
                    //   is.fillStyle =  is.sourceColor
                    //   it.to.id = ""
                    // }
                  })
              }
            })
         }


          if ((x || y) && this.moveIn.hoverNode && !this.moveIn.hoverNode.xCP ) {
            //点击图元为单端子时 把连接线的from端指向当前图元 （移动，否者拖链接但是拖动先不跟着移动）
            if (this.moveIn.hoverNode && this.moveIn.hoverNode.anchorCount === 1 && this.mouseDown.x) {
              this.lines.map((it) => {
                if (it.type === 1 && it.to.id === this.moveIn.hoverNode.id) {
                  let from = it.from,
                    to = it.to;
                  it.from = to;
                  it.to = from;
                  it.controlPoints = it.controlPoints;
                }
              });
            }
            const offset = this.getDockPos(x, y);
            this.activeLayer.move(offset.x ? offset.x : x, offset.y ? offset.y : y);
            this.needCache = true;
          }
          break;
        case MoveInType.ResizeCP:
          if (this.moveIn.activeNode && this.moveIn.activeNode.xCP && this.moveIn.activeNode.mlMinWidth+5 > this.moveIn.activeNode.rect.width) {
            this.moveIn.activeNode.rect.width = this.moveIn.activeNode.mlMinWidth + 5
          }
          this.dispatch('ResizeCP',this.moveIn.activeNode)
          if (!(this.moveIn.activeNode.xCP && this.moveIn.activeAnchorIndex === 0)) {
            this.activeLayer.resize(this.moveIn.activeAnchorIndex, this.mouseDown, pos);
          }
          this.needCache = true;
          break;
        case MoveInType.LineTo:
        case MoveInType.HoverAnchors:
          if (this.moveIn.hoverNode) {
            let x = this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x
            let y = this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y
            if (this.hoverLayer.line) {
              this.hoverLayer.line.name = 'line'
           
              if ((x-this.options.tolarence < e.pageX && e.pageX< x+this.options.tolarence) || (y-this.options.tolarence < e.pageY && e.pageY< y+this.options.tolarence)) {
                this.hoverLayer.line.visible = true
                this.hoverLayer.line.hideCP = true
                this.activeLayer.pens = [this.hoverLayer.line];
              }else{
                this.hoverLayer.line.visible = false
              } 
          }
          }
          let arrow = this.data.toArrowType;
          if (this.moveIn.hoverLine) {
            arrow = this.moveIn.hoverLine.toArrow;
          }
          this.hoverLayer.line && this.hoverLayer.lineTo(this.getLineDock(pos), arrow);
          this.needCache = true;
          break;
        case MoveInType.LineFrom:
          this.hoverLayer.line && this.hoverLayer.lineFrom(this.getLineDock(pos));
          this.needCache = true;
          break;
        case MoveInType.LineMove:
          this.hoverLayer.lineMove(pos, this.mouseDown);
          this.needCache = true;
          break;
        case MoveInType.LineControlPoint:
          if (!(this.moveIn.hoverLine && this.moveIn.hoverLine.symbolType === "Polygon" && this.moveIn.hoverLine.old === 1)) {
            this.moveIn.hoverLine.controlPoints[this.moveIn.lineControlPoint.id].x = pos.x;
            this.moveIn.hoverLine.controlPoints[this.moveIn.lineControlPoint.id].y = pos.y;
            this.moveIn.hoverLine.textRect = null;
            if (drawLineFns[this.moveIn.hoverLine.name] && drawLineFns[this.moveIn.hoverLine.name].dockControlPointFn) {
              drawLineFns[this.moveIn.hoverLine.name].dockControlPointFn(
                this.moveIn.hoverLine.controlPoints[this.moveIn.lineControlPoint.id],
                this.moveIn.hoverLine
              );
            }
            this.needCache = true;
            Store.set(this.generateStoreKey('LT:updateLines'), [this.moveIn.hoverLine]);
          }
          break;
        case MoveInType.Rotate:
          let ang = this.getAngle(pos)
          if (ang < -360) {
            ang = -360
          }
          if (ang > 360) {
            ang = 360
          }
          let curAng = 0
          if ((0<= ang && ang<45) || (315<= ang && ang<=360)) {
            curAng = 0
          }else if ((45<= ang && ang<135) || (-315<= ang && ang<-215)) {
            curAng = 90
          }else if ((135<= ang && ang<225) || (-225<= ang && ang<-135)) {
            curAng = 180
          }else if ((225<= ang && ang<315) || (-135<= ang && ang<-45)) {
            curAng = 270
          }
          if (this.activeLayer.pens.length) {
            this.activeLayer.offsetRotate(curAng);
            this.activeLayer.updateLines();
          }
          this.needCache = true;
          break;
      }

      this.render();
      this.scheduledAnimationFrame = false;
    });
  };

  private onmousedown = (e: MouseEvent) => {
    //兼容谷歌60
    if (!this.boundingRect.x && this.boundingRect.x !== 0) {
      this.boundingRect.x = 0
      this.boundingRect.y = 0
    }
    this.lines = this.data.pens.filter(it=>it.type === 1)
    this.mouseDown = { x: e.x - this.boundingRect.x + this.parentElem.scrollLeft, y: e.y - this.boundingRect.y + this.parentElem.scrollTop };
    this.pasteMouseDown = this.mouseDown
    this.isMLNode = null
    if (e.altKey) {
      this.divLayer.canvas.style.cursor = 'pointer';
    }
    if (this.inputObj) {
      this.setNodeText();
    }
    switch (this.moveIn.type) {
      // Click the space.
      case MoveInType.None:
        this.activeLayer.clear();
        this.hoverLayer.clear();
        // this.clearHighLight()
        this.dispatch('space', this.mouseDown);
        break;
      // Click a line.
      case MoveInType.Line:
      case MoveInType.LineControlPoint:
        if (e.ctrlKey) {
          this.activeLayer.add(this.moveIn.hoverLine);
          this.dispatch('multi', this.activeLayer.pens);
        } else {
          this.activeLayer.pens = [this.moveIn.hoverLine];
          this.dispatch('line', this.moveIn.hoverLine);
        }

        this.highLight('line')
        break;
      case MoveInType.LineMove:
        this.hoverLayer.initLine = new Line(this.moveIn.hoverLine);
        this.moveIn.hoverLine.click();
      // tslint:disable-next-line:no-switch-case-fall-through
      case MoveInType.LineFrom:
      case MoveInType.LineTo:
        this.data.cellInfo = null
        this.activeLayer.pens = [this.moveIn.hoverLine];
        this.dispatch('line', this.moveIn.hoverLine);

        this.hoverLayer.line = this.moveIn.hoverLine;

        break;
      case MoveInType.HoverAnchors:
        let index = this.moveIn.hoverAnchorIndex
        this.preAnchorInfo = {
          node:this.moveIn.hoverNode,
          hoverAnchorIndex:index
        }
        // if (this.data.cellInfo ) {
          this.hoverLayer.line = this.addLine({
            name: this.data.lineName,
            from: new Point(
              this.moveIn.hoverNode.rotatedAnchors[index].x,
              this.moveIn.hoverNode.rotatedAnchors[index].y,
              this.moveIn.hoverNode.rotatedAnchors[index].direction,
              index,
              this.moveIn.hoverNode.id
            ),
            fromArrow: this.data.fromArrowType,
            to: new Point(
              this.moveIn.hoverNode.rotatedAnchors[index].x,
              this.moveIn.hoverNode.rotatedAnchors[index].y,
            ),
            toArrow: this.data.toArrowType,
            strokeStyle: this.options.color
          });
        // }
        

      // tslint:disable-next-line:no-switch-case-fall-through
      case MoveInType.Nodes:
        if (this.moveIn.hoverNode && this.moveIn.hoverNode.name === "rectangle") {
          this.rectangleWrap = true
        }else{
          this.rectangleWrap = false
        }
        this.activeLayer.clear();
        if (!this.moveIn.activeNode) {
          break;
        }
        
        this.isMLNode = this.moveIn.hoverNode

        if (e.ctrlKey) {
          if (this.moveIn.hoverNode && this.activeLayer.hasInAll(this.moveIn.hoverNode)) {
            this.activeLayer.setPens([this.moveIn.hoverNode]);
            this.dispatch('node', this.moveIn.hoverNode);
          } else if (!this.activeLayer.has(this.moveIn.activeNode)) {
            this.activeLayer.add(this.moveIn.activeNode);
            if (this.activeLayer.pens.length > 1) {
              this.dispatch('multi', this.activeLayer.pens);
            } else {
              this.dispatch('node', this.moveIn.activeNode);
            }
          }
        } else if (e.shiftKey) {
          if (this.moveIn.hoverNode) {
            this.activeLayer.setPens([this.moveIn.hoverNode]);
            this.dispatch('node', this.moveIn.hoverNode);
          } else if (this.moveIn.hoverLine) {
            this.activeLayer.setPens([this.moveIn.hoverLine]);
            this.dispatch('line', this.moveIn.hoverLine);
          }
        } else if (this.activeLayer.pens.length < 2) {
          this.activeLayer.setPens([this.moveIn.activeNode]);
          this.dispatch('node', this.moveIn.activeNode);
        }

        this.moveIn.activeNode.click();
        
        // this.highLight('node')

        if (this.moveIn.activeNode.name === 'rectangle') {
            let item = this.moveIn.activeNode
            let n = 5
            let bool = ((item.rect.x-n < this.mouseDown.x && item.rect.x+n > this.mouseDown.x) || (item.rect.ex-n < this.mouseDown.x && item.rect.ex+n > this.mouseDown.x)) && (item.rect.y - n < this.mouseDown.y && item.rect.ey + n > this.mouseDown.y)
                      || ((item.rect.y-n < this.mouseDown.y && item.rect.y+n > this.mouseDown.y) || (item.rect.ey-n < this.mouseDown.y && item.rect.ey+n > this.mouseDown.y)) && (item.rect.x - n < this.mouseDown.x && item.rect.ex + n > this.mouseDown.x)
            if(!bool){
              this.activeLayer.clear()
            }
        }
        break;
    }

    // Save node rects to move.
    if (this.activeLayer.pens.length) {
      this.activeLayer.saveNodeRects();
    }

    // this.render();
  };
  highLight(type){
    this.clearHighLight()
    let pens = this.data.pens || []
    let activeCell = this.activeLayer.pens[0]
    if (activeCell) {
      for (let i = 0; i < pens.length; i++) {
        let pen = pens[i]
        if (type==='node' && pen instanceof Line) {
          if (activeCell.id === pen.from.id || activeCell.id === pen.to.id) {
              pen.strokeStyle = this.activeLayer.options.activeColor
              pen.fillStyle = this.activeLayer.options.activeColor
              this.cacheHighLight.push(pen)
          }
        }
        if (type==='line' &&  pen instanceof Node && ((activeCell as Line).from || (activeCell as Line).to)) {
          if ((activeCell as Line).from.id === pen.id || (activeCell as Line).to.id === pen.id) {
              pen.strokeStyle = this.activeLayer.options.activeColor
              pen.fillStyle = this.activeLayer.options.activeColor
              this.cacheHighLight.push(pen)
          }
        }
      }
    }
  }
  clearHighLight(){
    let pens = this.data.pens || []
    if (this.cacheHighLight && this.cacheHighLight.length>0) {
      pens.map(pen=>{
        pen.strokeStyle = pen.sourceColor
        pen.fillStyle = pen.sourceColor
        return pen
      })
    }
    this.cacheHighLight = []
  }
  private onmouseup = (e: MouseEvent) => {
    if (this.hoverLayer.line && this.data.cellInfo && !(this.data.cellInfo.data.name === 'rectangle' || this.data.cellInfo.code === 'ml')) {   //放开鼠标左键绘制
      const json = this.data.cellInfo.data
      json.scaleNum = this.data.scale

      let px = 0
      let py = 0

      let x = this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x,
          y = this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y,
          ex = e.pageX,
          ey = e.pageY,
          x12=Math.abs(e.pageX-this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x),
          y12=Math.abs(e.pageY-this.moveIn.hoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y)

      if (this.moveIn.hoverNode) {  //偏移容差
        if (x-this.options.tolarence < e.pageX && e.pageX< x+this.options.tolarence) {
          px = this.moveIn.hoverNode.rotatedAnchors[this.hoverLayer.hoverAnchorIndex].x
          py = e.pageY
        }
        if (y-this.options.tolarence < e.pageY && e.pageY< y+this.options.tolarence) {
          px = e.pageX
          py = this.moveIn.hoverNode.rotatedAnchors[this.hoverLayer.hoverAnchorIndex].y
        }
      }
      json.rect.x = (px - json.rect.width / 2) << 0;
      json.rect.y = (py - json.rect.height) << 0;
      const node = new Node(json);
      let reverseSymbolList = this.options.reverseSymbolList
      if (this.moveIn.hoverNode) {
        if (x12>y12) {  
          if (ex>x) {   
            node.rotate = 180
            if (reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
              node.rotate = 0
            }
            if (json.anchorCount === 4) {
              node.rotate = 315
            }
          }else{    
            node.rotate = 0
            if (reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
              node.rotate = 180
            }
            if (json.anchorCount === 4) {
              node.rotate = 135
            }
          }
          
        }else{
          
          if (ey>y) {
            node.rotate = 270
            if (reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
              node.rotate = 90
            }
            if (json.anchorCount === 4) {
              node.rotate = 45
            }
          }else{
            node.rotate = 90
            if (reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
              node.rotate = 270
            }
            if (json.anchorCount === 4) {
              node.rotate = 225
            }
          }
        }
        switch (json.anchorCount) {
          case 1:
            this.hoverLayer.line.to.direction = 0
            this.hoverLayer.line.to.anchorIndex = 0
            this.hoverLayer.line.to.id = node.id
            this.hoverLayer.line.to.x = node.rotatedAnchors[0].x
            this.hoverLayer.line.to.y = node.rotatedAnchors[0].y
            break;
            
          case 2:
            if (!reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {  //变压器倒置
              this.hoverLayer.line.to.direction = 4
              this.hoverLayer.line.to.anchorIndex = 0
              this.hoverLayer.line.to.id = node.id
              this.hoverLayer.line.to.x = node.rotatedAnchors[0].x
              this.hoverLayer.line.to.y = node.rotatedAnchors[0].y
            }else{
              this.hoverLayer.line.to.direction = 2
              this.hoverLayer.line.to.anchorIndex = 0
              this.hoverLayer.line.to.id = node.id
              this.hoverLayer.line.to.x = node.rotatedAnchors[0].x
              this.hoverLayer.line.to.y = node.rotatedAnchors[0].y
            }
            break;
            
          case 3:
            
            this.hoverLayer.line.to.direction = 2
            this.hoverLayer.line.to.anchorIndex = 0
            this.hoverLayer.line.to.id = node.id
            this.hoverLayer.line.to.x = node.rotatedAnchors[0].x
            this.hoverLayer.line.to.y = node.rotatedAnchors[0].y
            break;
            
          case 4:
            
            this.hoverLayer.line.to.direction = 1
            this.hoverLayer.line.to.anchorIndex = 0
            this.hoverLayer.line.to.id = node.id
            this.hoverLayer.line.to.x = node.rotatedAnchors[0].x
            this.hoverLayer.line.to.y = node.rotatedAnchors[0].y
            break;
        }
      }
      
      node.setTID(this.id);
      this.addNode(node, true);
      switch (node.rotate) {
        case 0:
        case 135:
          if (!reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
            node.translate(-node.rect.width/2,0)
          }else{
            node.translate(node.rect.width/2,0)
          }
          break;
        case 90:
        case 225:
          if (!reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
            node.translate(0,-node.rect.width/2)
          }else{
            node.translate(0,node.rect.width/2)
          }
          break;
        case 180:
        case 315:
          if (!reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
            node.translate(node.rect.width/2,0)
          }else{
            node.translate(-node.rect.width/2,0)
          }
          break;
        case 270:
        case 45:
          if (!reverseSymbolList.includes(this.data.cellInfo.sbzlx)) {
            node.translate(0,node.rect.width/2)
          }else{
            node.translate(0,-node.rect.width/2)
          }
          break;
      }
      if (node.name === 'div') {
        this.dispatch('LT:addDiv', node);
      }
      this.activeLayer.clear()
      this.hoverLayer.clear()
      this.needCache = true;
    }

    if (this.data.cellInfo && this.data.cellInfo.data.name === 'rectangle') {  //直接在画布上画框
      let node = new Node({
        name: 'rectangle',
        rect: this.hoverLayer.dragRect,
        strokeStyle: this.data.cellInfo.data.strokeStyle,
        fillStyle: this.data.cellInfo.data.fillStyle,
        label: this.data.cellInfo.data.label,
        psrSubType: this.data.cellInfo.data.psrSubType,
        psrType: this.data.cellInfo.data.psrType,
        realSymbolId: this.data.cellInfo.data.symbolId,
        symbolId: this.data.cellInfo.data.symbolId,
        voltage: this.data.cellInfo.data.voltage,
        scaleNum: this.data.cellInfo.data.scaleNum,
        hideAnchor:true
      })

      this.data.pens.push(node)
      this.hoverLayer.dragRect = null
      this.data.cellInfo = null
      this.dispatch('addNode',node)
    }
    if (this.hoverLayer.dragRect) {
      this.getPensInRectCopy(this.hoverLayer.dragRect);

      if (this.activeLayer.pens && this.activeLayer.pens.length) {
        this.dispatch('multi', this.activeLayer.pens);
      }
    } else {
      switch (this.moveIn.type) {
        // Add the line.
        case MoveInType.HoverAnchors:
          // New active.
          if (this.hoverLayer.line) {
            if ( this.hoverLayer.line && !this.options.disableEmptyLine && this.hoverLayer.line.from.id && this.hoverLayer.line.to.id) {
              this.activeLayer.pens = [this.hoverLayer.line];
              this.dispatch('addLine', this.hoverLayer.line);

            } else {
              this.data.pens.pop();
            }
          }

          this.offscreen.render();

          this.hoverLayer.line = null;
          break;
        case MoveInType.Rotate:
          this.activeLayer.updateRotate();
          break;

        case MoveInType.LineControlPoint:
          Store.set(this.generateStoreKey('pts-') + this.moveIn.hoverLine.id, null);
          break;
      }
    }
    
    this.mouseDown = null;
    this.lastTranlated.x = 0;
    this.lastTranlated.y = 0;
    this.hoverLayer.dockAnchor = null;
    this.hoverLayer.dockLineX = 0;
    this.hoverLayer.dockLineY = 0;
    this.divLayer.canvas.style.cursor = 'default';
    this.relativeTextNode = []
    this.data.cellInfo = null
    this.hoverLayer.line = null
    this.hoverLayer.dragRect = null;
    this.render();

    if (this.needCache) {
      this.cache();
    }
    this.needCache = false;
  };

  private ondblclick = (e: MouseEvent) => {
    // debugger
    this.options.disableScale = false
    this.clipboard = null

    if (this.moveIn.hoverNode) {
      this.dispatch('dblclick', {
        node: this.moveIn.hoverNode
      });


      if (this.moveIn.hoverNode.getTextRect() && this.moveIn.hoverNode.getTextRect().hit(new Point(e.x - this.boundingRect.x + this.parentElem.scrollLeft, e.y - this.boundingRect.y + this.parentElem.scrollTop))) {
        this.showInput(this.moveIn.hoverNode);
      }

      this.moveIn.hoverNode.dblclick();
    } else if (this.moveIn.hoverLine) {
      this.dispatch('dblclick', {
        line: this.moveIn.hoverLine
      });

      if (!this.moveIn.hoverLine.text || this.moveIn.hoverLine.getTextRect().hit(new Point(e.x - this.boundingRect.x + this.parentElem.scrollLeft, e.y - this.boundingRect.y + this.parentElem.scrollTop))) {
        this.showInput(this.moveIn.hoverLine);
      }

      this.moveIn.hoverLine.dblclick();
    }
  };

  private onkeydown = (key: KeyboardEvent) => {
    if (this.data.locked || (key.target as HTMLElement).tagName === 'INPUT' || (key.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    let done = false;
    let moveX = 0;
    let moveY = 0;
    let code = ''
    if (key.ctrlKey) {
      code = `ctrl_${key.key}`
    }else if(key.shiftKey){
      code = `shift_${key.key}`
    } else {
      code = key.key
    }
    switch (code) {
      case 'ctrl_a':
      case 'ctrl_A':
        this.activeLayer.pens = []
        this.activeLayer.pens = [...this.data.pens]
        done = true;
        break;
      case 'Delete':
      // case 'Backspace':
        this.delete();
        break;
      case 'ArrowLeft':
        moveX = -DefalutOptions.moveSize;
        if (key.ctrlKey) {
          moveX = -DefalutOptions.moveSize;
        }
        done = true;
        break;
      case 'ArrowUp':
        moveY = -DefalutOptions.moveSize;
        if (key.ctrlKey) {
          moveY = -DefalutOptions.moveSize;
        }
        done = true;
        break;
      case 'ArrowRight':
        moveX = DefalutOptions.moveSize;
        if (key.ctrlKey) {
          moveX = DefalutOptions.moveSize;
        }
        done = true;
        break;
      case 'ArrowDown':
        moveY = DefalutOptions.moveSize;
        if (key.ctrlKey) {
          moveY = DefalutOptions.moveSize;
        }
        done = true;
        break;
      case 'ctrl_x':
      case 'ctrl_X':
        this.cut();
        break;
      case 'ctrl_c':
      case 'ctrl_C':
        this.copy("first");
        break;
      case 'ctrl_v':
      case 'ctrl_V':
        this.paste();
        break;
      case 'ctrl_y':
      case 'ctrl_Y':
        if (key.ctrlKey) {
          this.redo();
        }
        break;
      case 'ctrl_z':
      case 'ctrl_Z':
        if (key.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        break;
      case 'ctrl_t':
        console.log('KeyT')
        break;
    }

    if (!done) {
      return;
    }

    key.preventDefault();

    if (moveX || moveY) {
      this.activeLayer.saveNodeRects();
      this.activeLayer.move(moveX, moveY);
      this.overflow();
      this.animateLayer.animate();
    }

    this.render();
    this.cache();
  };

  private getMoveIn(pt: Point) {
    this.lastHoverNode = this.moveIn.hoverNode;
    this.lastHoverLine = this.moveIn.hoverLine;
    this.moveIn.type = MoveInType.None;
    this.moveIn.hoverNode = null;
    this.moveIn.lineControlPoint = null;
    this.moveIn.hoverLine = null;
    this.hoverLayer.hoverAnchorIndex = -1;

    if (
      !this.data.locked &&
      !(this.activeLayer.pens.length === 1 && this.activeLayer.pens[0].type) &&
      !this.activeLayer.locked() &&
      this.activeLayer.rotateCPs[0] &&
      this.activeLayer.rotateCPs[0].hit(pt, 15)
    ) {
      this.moveIn.type = MoveInType.Rotate;
      this.divLayer.canvas.style.cursor = `url("${this.options.rotateCursor}"), auto`;
      return;
    }

    if (this.activeLayer.pens.length > 1 && pointInRect(pt, this.activeLayer.sizeCPs)) {
      this.moveIn.type = MoveInType.Nodes;
    }
    if (!this.data.locked && !this.activeLayer.locked() && !this.options.hideSizeCP) {
      if (this.activeLayer.pens.length > 1 || (!this.activeLayer.pens[0].type && !this.activeLayer.pens[0].hideSizeCP)) {
        for (let i = 0; i < this.activeLayer.sizeCPs.length; ++i) {
          if (this.activeLayer.sizeCPs[i].hit(pt, 10)) {
            this.moveIn.type = MoveInType.ResizeCP;
            this.moveIn.activeAnchorIndex = i;
            this.divLayer.canvas.style.cursor = resizeCursors[i];
            return;
          }
        }
      }
    }

    // In active pen.
    for (const item of this.activeLayer.pens) {
      if (item instanceof Node && this.inNode(pt, item)) {
        return;
      }

      if (item instanceof Line) {
        for (let i = 0; i < item.controlPoints.length; ++i) {
          if (!item.locked && item.controlPoints[i].hit(pt, 10)) {
            item.controlPoints[i].id = i;
            this.moveIn.type = MoveInType.LineControlPoint;
            this.moveIn.lineControlPoint = item.controlPoints[i];
            this.moveIn.hoverLine = item;
            this.divLayer.canvas.style.cursor = 'pointer';
            return;
          }
        }
        if (this.inLine(pt, item)) {
          return;
        }
      }
    }

    this.divLayer.canvas.style.cursor = 'default';
    const len = this.data.pens.length;
    for (let i = len - 1; i > -1; --i) {
      if (this.data.pens[i].type === PenType.Node && this.inNode(pt, this.data.pens[i] as Node)) {
        return;
      } else if (this.data.pens[i].type === PenType.Line && this.inLine(pt, this.data.pens[i] as Line)) {
        return;
      }
    }
  }

  inChildNode(pt: Point, children: Pen[]) {
    if (!children) {
      return null;
    }

    for (const item of children) {
      if (item.type === PenType.Line) {
        if (this.inLine(pt, item as Line)) {
          return item;
        }
        continue;
      }
      let node = this.inChildNode(pt, (item as Node).children);
      if (node) {
        return node;
      }

      node = this.inNode(pt, item as Node, true);
      if (node) {
        return node;
      }
    }

    return null;
  }

  inNode(pt: Point, node: Node, inChild = false) {
    if (this.data.locked === Lock.NoEvent || !node.visible || node.locked === Lock.NoEvent) {
      return null;
    }

    const child = this.inChildNode(pt, node.children);
    if (child) {
      if (child.type === PenType.Line) {
        this.moveIn.activeNode = node;
        this.moveIn.type = MoveInType.Nodes;
      } else if (child.stand) {
        this.moveIn.activeNode = child;
        this.moveIn.type = MoveInType.Nodes;
      }
      return child;
    }

    if (node.hit(pt)) {
      this.moveIn.hoverNode = node;
      this.moveIn.type = MoveInType.Nodes;
      !node.locked && (this.divLayer.canvas.style.cursor = 'move');

      // Too small
      if (!(this.options.hideAnchor || node.hideAnchor)) {
        for (let j = 0; j < node.rotatedAnchors.length; ++j) {
          if (node.rotatedAnchors[j].hit(pt, 10)) {
            if (!this.mouseDown && node.rotatedAnchors[j].mode === AnchorMode.In) {
              continue;
            }
            this.moveIn.type = MoveInType.HoverAnchors;
            this.moveIn.hoverAnchorIndex = j;
            this.hoverLayer.hoverAnchorIndex = j;
            // console.log('hit',j)
            if (this.moveIn.hoverNode.name === 'combine') {
              this.divLayer.canvas.style.cursor = 'move';
            }else{
              this.divLayer.canvas.style.cursor = 'crosshair';
            }
            break;
          }
        }
      }

      if (!inChild) {
        this.moveIn.activeNode = this.moveIn.hoverNode;
      }

      return node;
    }

    if (this.options.hideAnchor || node.hideAnchor || this.data.locked || node.locked) {
      return null;
    }

    if (node.hit(pt, 10)) {
      for (let j = 0; j < node.rotatedAnchors.length; ++j) {
        if (node.rotatedAnchors[j].hit(pt, 10)) {
          if (!this.mouseDown && node.rotatedAnchors[j].mode === AnchorMode.In) {
            continue;
          }
          this.moveIn.hoverNode = node;
          this.moveIn.type = MoveInType.HoverAnchors;
          this.moveIn.hoverAnchorIndex = j;
          this.hoverLayer.hoverAnchorIndex = j;
          this.divLayer.canvas.style.cursor = 'crosshair';

          if (!inChild) {
            this.moveIn.activeNode = node;
          }

          return node;
        }
      }
    }

    return null;
  }

  inLine(point: Point, line: Line) {
    if (!line.visible) {
      return null;
    }

    if (line.from.hit(point, 5)) {
      this.moveIn.type = MoveInType.LineFrom;
      this.moveIn.hoverLine = line;
      if (this.data.locked || line.locked) {
        this.divLayer.canvas.style.cursor = 'pointer';
      } else {
        this.divLayer.canvas.style.cursor = 'move';
      }
      return line;
    }

    if (line.to.hit(point, 5)) {
      this.moveIn.type = MoveInType.LineTo;
      this.moveIn.hoverLine = line;
      if (this.data.locked || line.locked) {
        this.divLayer.canvas.style.cursor = 'pointer';
      } else {
        this.divLayer.canvas.style.cursor = 'move';
      }
      return line;
    }

    if (line.pointIn(point)) {
      this.moveIn.type = MoveInType.LineMove;
      this.moveIn.hoverLine = line;
      this.divLayer.canvas.style.cursor = 'pointer';
      if (line.from.id || line.to.id) {
        this.moveIn.type = MoveInType.Line;
      }
      return line;
    }

    return null;
  }

  private getLineDock(point: Point) {
    this.hoverLayer.dockAnchor = null;
    for (const item of this.data.pens) {
      if (item instanceof Node) {
        if (item.rect.hit(point, 10)) {
          this.hoverLayer.node = item;
        }
        for (let i = 0; i < item.rotatedAnchors.length; ++i) {
          if (item.rotatedAnchors[i].mode && item.rotatedAnchors[i].mode !== AnchorMode.In) {
            continue;
          }
          if (item.rotatedAnchors[i].hit(point, 10)) {
            point.id = item.id;
            point.anchorIndex = i;
            point.direction = item.rotatedAnchors[point.anchorIndex].direction;
            point.x = item.rotatedAnchors[point.anchorIndex].x;
            point.y = item.rotatedAnchors[point.anchorIndex].y;
            this.hoverLayer.dockAnchor = item.rotatedAnchors[i];
            break;
          }
        }
      } else if (item instanceof Line) {
        if (item.id === this.hoverLayer.line.id) {
          continue;
        }

        if (item.from.hit(point, 10)) {
          point.x = item.from.x;
          point.y = item.from.y;
          this.hoverLayer.dockAnchor = item.from;
          break;
        }

        if (item.to.hit(point, 10)) {
          point.x = item.to.x;
          point.y = item.to.y;
          this.hoverLayer.dockAnchor = item.to;
          break;
        }

        if (item.controlPoints) {
          for (const cp of item.controlPoints) {
            if (cp.hit(point, 10)) {
              point.x = cp.x;
              point.y = cp.y;
              this.hoverLayer.dockAnchor = cp;
              break;
            }
          }
        }
      }

      if (this.hoverLayer.dockAnchor) {
        break;
      }
    }

    return point;
  }

  private getPensInRect(rect: Rect) {
    if (rect.width < 0) {
      rect.width = -rect.width;
      rect.x = rect.ex;
      rect.ex = rect.x + rect.width;
    }
    if (rect.height < 0) {
      rect.height = -rect.height;
      rect.y = rect.ey;
      rect.ey = rect.y + rect.height;
    }
    this.activeLayer.pens = [];
    for (const item of this.data.pens) {
      if (item.locked === Lock.NoEvent) {
        continue;
      }
      if (item instanceof Node) {
        if (rect.hitByRect(item.rect)) {
          this.activeLayer.add(item);
        }
      }
      if (item instanceof Line) {
        if (rect.hit(item.from) && rect.hit(item.to)) {
          this.activeLayer.add(item);
        }
      }
    }
  }
  
  private getPensInRectCopy(rect: Rect) {
    if (rect.width < 0) {
      rect.width = -rect.width;
      rect.x = rect.ex;
      rect.ex = rect.x + rect.width;
    }
    if (rect.height < 0) {
      rect.height = -rect.height;
      rect.y = rect.ey;
      rect.ey = rect.y + rect.height;
    }
    this.activeLayer.pens = [];
    for (const item of this.data.pens) {
      if (item.locked === Lock.NoEvent) {
        continue;
      }
      let isIn = false
      if (item instanceof Node) {
        isIn = item.rotatedAnchors.every(it=>{
          return rect.x<it.x &&　it.x<rect.ex　&& rect.y<it.y &&　it.y<rect.ey
        })
        isIn && this.activeLayer.add(item);
      }
      if (item instanceof Line) {
        let points = []
        points.push(item.from)
        points.push(item.to)
        if (item.controlPoints.length>0) {
          points.push(...item.controlPoints)
        }
        isIn = points.every(it=>{
          return rect.x<it.x &&　it.x<rect.ex　&& rect.y<it.y &&　it.y<rect.ey
        })
        isIn && this.activeLayer.add(item);
      }
    }
  }

  private getAngle(pt: Point) {
    if (pt.x === this.activeLayer.rect.center.x) {
      return pt.y <= this.activeLayer.rect.center.y ? 0 : 180;
    }

    if (pt.y === this.activeLayer.rect.center.y) {
      return pt.x < this.activeLayer.rect.center.x ? 270 : 90;
    }

    const x = pt.x - this.activeLayer.rect.center.x;
    const y = pt.y - this.activeLayer.rect.center.y;
    let angle = (Math.atan(Math.abs(x / y)) / (2 * Math.PI)) * 360;
    if (x > 0 && y > 0) {
      angle = 180 - angle;
    } else if (x < 0 && y > 0) {
      angle += 180;
    } else if (x < 0 && y < 0) {
      angle = 360 - angle;
    }
    if (this.activeLayer.pens.length === 1) {
      return angle - this.activeLayer.pens[0].rotate;
    }

    return angle;
  }

  private showInput(item: Pen) {
    if (this.data.locked || item.locked || item.hideInput || this.options.hideInput || item.name!=='text') {
    // if (this.data.locked || item.locked || item.hideInput || this.options.hideInput) {
      return;
    }
    this.inputObj = item;
    const textRect = item.getTextRect();
    this.input.value = item.text || '';
    this.input.style.left = textRect.x + 'px';
    this.input.style.top = textRect.y + 'px';
    this.input.style.width = textRect.width + 'px';
    this.input.style.height = textRect.height + 'px';
    this.input.style.zIndex = '1000';
    this.input.focus();
  }

  getRect(pens?: Pen[]) {
    if (!pens) {
      pens = this.data.pens;
    }
    return getRect(pens,this.data.scale);
  }

  // Get a dock rect for moving nodes.
  getDockPos(offsetX: number, offsetY: number) {
    this.hoverLayer.dockLineX = 0;
    this.hoverLayer.dockLineY = 0;

    const offset = {
      x: 0,
      y: 0
    };

    let x = 0;
    let y = 0;
    let disX = dockOffset;
    let disY = dockOffset;

    for (const activePt of this.activeLayer.dockWatchers) {
      for (const item of this.data.pens) {
        if (!(item instanceof Node) || this.activeLayer.has(item) || item.name === 'text') {
          continue;
        }

        if (!item.dockWatchers) {
          item.getDockWatchers();
        }
        for (const p of item.dockWatchers) {
          x = Math.abs(p.x - activePt.x - offsetX);
          if (x < disX) {
            disX = -99999;
            offset.x = p.x - activePt.x;
            this.hoverLayer.dockLineX = p.x | 0;
          }

          y = Math.abs(p.y - activePt.y - offsetY);
          if (y < disY) {
            disY = -99999;
            offset.y = p.y - activePt.y;
            this.hoverLayer.dockLineY = p.y | 0;
          }
        }
      }
    }

    return offset;
  }

  cache() {
    if (this.caches.index < this.caches.list.length - 1) {
      this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
    }
    const data = new TopologyData(this.data);
    this.caches.list.push(data);
    if (this.caches.list.length > this.options.cacheLen) {
      this.caches.list.shift();
    }

    this.caches.index = this.caches.list.length - 1;
  }

  cacheReplace(pens: Pen[]) {
    if (pens && pens.length) {
      const needPenMap = {};
      for (let i = 0, len = pens.length; i < len; i++) {
        const pen = pens[i];
        const id = pen.id;
        if (pen instanceof Node) {
          needPenMap[id] = new Node(pen);
        } else if (pen instanceof Line) {
          needPenMap[id] = new Line(pen);
        }
      }
      const cacheListData: TopologyData = this.caches.list[0];
      if (!cacheListData) {
        return;
      }
      for (let i = 0, len = cacheListData.pens.length; i < len; i++) {
        const id = cacheListData.pens[i].id;
        if (needPenMap[id]) {
          cacheListData.pens[i] = needPenMap[id];
        }
      }
    }
  }

  undo(noRedo = false) {
    if (this.data.locked || this.caches.index < 1) {
      return;
    }
    this.divLayer.clear();
    const data = new TopologyData(this.caches.list[--this.caches.index]);
    this.data.pens.splice(0, this.data.pens.length);
    this.data.pens.push.apply(this.data.pens, data.pens);
    this.render(true);
    this.divLayer.render();

    if (noRedo) {
      this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
    }

    this.dispatch('undo', this.data);
  }

  redo() {
    if (this.data.locked || this.caches.index > this.caches.list.length - 2) {
      return;
    }
    this.divLayer.clear();
    const data = new TopologyData(this.caches.list[++this.caches.index]);
    this.data.pens.splice(0, this.data.pens.length);
    this.data.pens.push.apply(this.data.pens, data.pens);
    this.render(true);
    this.divLayer.render();

    this.dispatch('redo', this.data);
  }

  toImage(
    type?: string,
    quality?: any,
    callback?: any,
    padding?: { left: number; top: number; right: number; bottom: number; },
    thumbnail = true
  ): string {
    let rect = new Rect(0, 0, this.canvas.width, this.canvas.height);
    if (thumbnail) {
      rect = this.getRect();
    }
    if (!padding) {
      padding = {
        left: 10,
        top: 10,
        right: 10,
        bottom: 10
      };
    }
    rect.x -= padding.left;
    rect.y -= padding.top;
    rect.width += padding.left + padding.right;
    rect.height += padding.top + padding.bottom;
    rect.round();
    const srcRect = rect.clone();
    srcRect.scale(this.offscreen.getDpiRatio(), new Point(0, 0));
    srcRect.round();

    const canvas = document.createElement('canvas');
    canvas.width = srcRect.width;
    canvas.height = srcRect.height;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (type && type !== 'image/png') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(
      this.canvas.canvas,
      srcRect.x,
      srcRect.y,
      srcRect.width,
      srcRect.height,
      0,
      0,
      srcRect.width,
      srcRect.height
    );

    if (callback) {
      canvas.toBlob(callback);
      return '';
    }

    return canvas.toDataURL(type, quality);
  }

  saveAsImage(
    name?: string,
    type?: string,
    quality?: any,
    padding?: { left: number; top: number; right: number; bottom: number; },
    thumbnail = true
  ) {
    const a = document.createElement('a');
    a.setAttribute('download', name || '1.png');
    a.setAttribute('href', this.toImage(type, quality, null, padding, thumbnail));
    const evt = document.createEvent('MouseEvents');
    evt.initEvent('click', true, true);
    a.dispatchEvent(evt);
  }

  delete(force?: boolean) {
    const pens: Pen[] = [];
    let i = 0;
    for (const pen of this.activeLayer.pens) {
      if (!force && pen.locked) {
        continue;
      }

      i = this.find(pen);
      if (i > -1) {
        if (this.data.pens[i].type === PenType.Node) {
          this.divLayer.removeDiv(this.data.pens[i] as Node);
        }
        pens.push.apply(pens, this.data.pens.splice(i, 1));
      }

      this.animateLayer.pens.delete(pen.id);
    }

    if (!pens.length) {
      return;
    }

    this.render(true);
    this.cache();

    this.dispatch('delete', pens);

  }

  removeNode(node: Node) {
    const i = this.find(node);
    if (i > -1) {
      this.divLayer.removeDiv(this.data.pens[i] as Node);
      const nodes = this.data.pens.splice(i, 1);
      this.dispatch('delete', {
        nodes
      });

    }

    this.render(true);
    this.cache();
  }

  removeLine(line: Line) {
    const i = this.find(line);
    if (i > -1) {
      const lines = this.data.pens.splice(i, 1);
      this.dispatch('delete', {
        lines
      });
    }

    this.render(true);
    this.cache();
  }

  cut() {
    if (this.data.locked) {
      return;
    }

    this.clipboard = new TopologyData({
      pens: []
    });
    for (const pen of this.activeLayer.pens) {
      this.clipboard.pens.push(pen.clone());
      const i = this.find(pen);
      if (i > -1) {
        if (pen.type === PenType.Node) {
          this.divLayer.removeDiv(this.data.pens[i] as Node);
        }
        this.data.pens.splice(i, 1);
      }
    }

    this.cache();

    this.activeLayer.clear();
    this.hoverLayer.node = null;
    this.moveIn.hoverLine = null;
    this.moveIn.hoverNode = null;

    this.render();

    this.dispatch('delete', {
      pens: this.clipboard.pens
    });

  }

  copy(type?:string) {

    this.options.disableScale = true

    this.clipboard = new TopologyData({
      pens: [],
    });
    if (type === 'first') {
      this.initCopyData = []
    }
    if (this.initCopyData.length === 0) {
      this.initCopyData = [...this.activeLayer.pens]
    }
    let pens = this.initCopyData || this.activeLayer.pens
    let  sourceColorList = [] //保存复制前的颜色值
    for (const pen of pens) {
      pen.copyPreventRotate = true
      if (pen.name === 'combine') {
        pen.children.forEach(it => {
          sourceColorList.push(it.sourceColor)
        });
      }else{
        sourceColorList.push(pen.sourceColor)
      }
      let penCopy = pen.clone()
      if (penCopy.name === 'combine') {
        penCopy.children.map((it,i) => {
          it.sourceColor = sourceColorList[i]
        });
      }else{
        penCopy.sourceColor = sourceColorList[0]
      }
      this.clipboard.pens.push(penCopy);
    }
  }

  paste() {
    this.unCombineAll()

    if (!this.clipboard || this.data.locked) {
      return;
    }
    let pens = this.clipboard.pens

    let bool = false
    if (pens.length === 1 && pens[0].name === 'combine' && pens[0].children.length>0) {
      bool = pens[0].children.some(it=>it.xCP)
    }
    console.log('this.isMLNode',this.isMLNode)
    if (!bool && (!this.isMLNode || (this.isMLNode && !this.isMLNode.xCP))) {
      return
    }
    this.hoverLayer.node = null;
    this.hoverLayer.line = null;
    this.activeLayer.pens = [];

    const idMaps: any = {};
    for (const pen of pens) {
      let relativeX = 20
      let relativeY = -20
      if (this.pasteMouseDown) {
        relativeX = this.pasteMouseDown.x -pen.rect.x
        relativeY = this.pasteMouseDown.y -pen.rect.y
      }
      if (pen.name === 'combine') {
        this.newId(pen, idMaps);
        pen.rect.x += relativeX;
        pen.rect.ex += relativeX;
        pen.rect.y += relativeY;
        pen.rect.ey += relativeY;
        pen.rect.center.x += relativeX;
        pen.rect.center.y += relativeY;
        (pen as Node).init();
        pen.children.map(penSub=>{
          return this.calcCopyPen(penSub,idMaps,relativeX,relativeY)
        })
      }else{

        if (pen.type === PenType.Node) {
          this.newId(pen, idMaps);
          pen.rect.x += relativeX;
          pen.rect.ex += relativeX;
          pen.rect.y += relativeY;
          pen.rect.ey += relativeY;
          pen.rect.center.x += relativeX;
          pen.rect.center.y += relativeY;
          (pen as Node).init();
        }
      }
      switch (this.pasteDirection) {
        case 'top':
          pen.translate(-pen.rect.width,-pen.rect.height)
          if (pen.name === 'combine') {
            pen.children.map(it=>{
              if (it.id === this.lineLinkML.line.id) {
                  if (this.lineLinkML.fOrt === 'from') {
                    it.from.y += pen.rect.height
                  }
                  if (this.lineLinkML.fOrt === 'to') {
                    it.to.y += pen.rect.height
                  }
              }
            })
          }
          break;
        case 'left':
          pen.translate(-pen.rect.width,-pen.rect.height)
          if (pen.name === 'combine') {
            pen.children.map(it=>{
              if (it.id === this.lineLinkML.line.id) {
                  if (this.lineLinkML.fOrt === 'from') {
                    it.from.x += pen.rect.width
                    it.from.y += pen.rect.height
                  }
                  if (this.lineLinkML.fOrt === 'to') {
                    it.to.x += pen.rect.width
                    it.to.x += pen.rect.height
                  }
              }
            })
          }
          break;
        case 'bottom':
          
          break;
        case 'right':
          if (pen.name === 'combine') {
            pen.children.map(it=>{
              if (it.id === this.lineLinkML.line.id) {
                  if (this.lineLinkML.fOrt === 'from') {
                    it.from.y += pen.rect.height
                  }
                  if (this.lineLinkML.fOrt === 'to') {
                    it.to.y += pen.rect.height
                  }
              }
            })
          }
          break;
      }
      this.data.pens.push(pen);
      this.activeLayer.add(pen);
      this.clipboard.pens = []
      
    }

    this.render();
    // this.animate(true);
    this.cache();
    this.copy();
    this.pasteMouseDown = null

    if (this.clipboard.pens.length > 1) {
      this.dispatch('paste', {
        pens: this.clipboard.pens,
      });
    } else if (this.activeLayer.pens.length > 0) {
      this.dispatch('paste', this.activeLayer.pens[0]);
    }
  }
  unCombineAll(){
    this.data.pens.map(it=>{  
      if (it.name === 'combine') {
        this.uncombine(it)
      }
    })
  }
  calcCopyPen(pen:Pen,idMaps,relativeX,relativeY){
    if (pen instanceof Line) {
      pen.id = s8();
      let from = new Point(
        pen.from.x + relativeX,
        pen.from.y + relativeY,
        pen.from.direction,
        pen.from.anchorIndex,
        idMaps[pen.from.id]
      );
      let to = new Point(pen.to.x +relativeX, pen.to.y + relativeY, pen.to.direction, pen.to.anchorIndex, idMaps[pen.to.id]);
      pen.from = from 
      pen.to = to 

      this.data.pens.map(it=>{
        if (it.type === 0 && idMaps[pen.to.id] === it.id) {
          pen.from = to 
          pen.to = from 
        }
      })

      const controlPoints = [];
      for (const pt of pen.controlPoints) {
        controlPoints.push(new Point(pt.x+relativeX, pt.y + relativeY));
      }
      pen.controlPoints = controlPoints;
      //判断粘贴方向 
      //组合复制粘贴到母线上形成topo关系
      if (this.lastHoverNode) { 
        if ([0,180].includes(this.lastHoverNode.rotate)) {
          if (!pen.from.id) {  //from端链接母线
            if (pen.from.y > pen.to.y) {
              this.pasteDirection = 'top'
            }else{
              this.pasteDirection = 'bottom'
            }
            this.lineLinkML.line = pen
            this.lineLinkML.fOrt = 'from'
            pen.from.anchorIndex = this.moveIn.hoverAnchorIndex
            pen.from.id = this.lastHoverNode.id
            pen.from.x = pen.to.x
            pen.from.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y
          }
          if (!pen.to.id) { //to端链接母线
            if (pen.from.y > pen.to.y) {
              this.pasteDirection = 'bottom'
            }else{
              this.pasteDirection = 'top'
            }
            this.lineLinkML.line = pen
            this.lineLinkML.fOrt = 'to'
            pen.to.anchorIndex = this.moveIn.hoverAnchorIndex
            pen.to.id = this.lastHoverNode.id
            pen.to.x = pen.from.x
            pen.to.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y
          }
        }else{
          if (!pen.from.id) {  //from端链接母线
            if (pen.from.x > pen.to.x) {
              this.pasteDirection = 'left'
            }else{
              this.pasteDirection = 'right'
            }
            this.lineLinkML.line = pen
            this.lineLinkML.fOrt = 'from'
            pen.from.anchorIndex = this.moveIn.hoverAnchorIndex
            pen.from.id = this.lastHoverNode.id
            pen.from.x = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x
            pen.from.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y
          }
          if (!pen.to.id) { //to端链接母线
            if (pen.from.x > pen.to.x) {
              this.pasteDirection = 'right'
            }else{
              this.pasteDirection = 'left'
            }
            this.lineLinkML.line = pen
            this.lineLinkML.fOrt = 'to'
            pen.to.anchorIndex = this.moveIn.hoverAnchorIndex
            pen.to.id = this.lastHoverNode.id
            pen.to.x = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x
            pen.to.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y
          }
        }
      }
      pen.strokeStyle = pen.sourceColor;
      pen.fillStyle = pen.sourceColor;
      return pen
    }
    if (pen.type === PenType.Node) {
      pen.rect.x += relativeX ;
      pen.rect.ex += relativeX ;
      pen.rect.y += relativeY;
      pen.rect.ey += relativeY;
      pen.rect.center.x += relativeX ;
      pen.rect.center.y += relativeY;
      (pen as Node).init();
    }
  }

  newId(node: any, idMaps: any) {
    const old = node.id;
    node.id = s8();
    node.ssjg = ''
    node.oid = ''
    node.old = 0
    node.zyId = ''
    node.scaleNum = this.data.scale*1.1
    node.optionType = 'add'
    idMaps[old] = node.id;
    if (node.children) {
      for (const item of node.children) {
        this.newId(item, idMaps);
      }
    }
  }

  animate(autoplay = false) {
    this.animateLayer.readyPlay(null, autoplay);
    this.animateLayer.animate();
  }

  updateProps(cache: boolean = true, pens?: Pen[], isUpdateLine?: boolean) {
    if (!pens) {
      pens = this.activeLayer.pens;
    }
    for (const pen of pens) {
      if (pen instanceof Node) {
        pen.init();
        pen.initRect();
      }
    }
    if (isUpdateLine) {  //点击不移动图元不更新线
      this.activeLayer.updateLines(pens);
    }
    this.activeLayer.calcControlPoints();
    this.activeLayer.saveNodeRects();

    this.render();
    // tslint:disable-next-line: no-unused-expression
    cache && this.cache();
  }

  lock(lock: number) {
    this.data.locked = lock;
    for (const item of this.data.pens) {
      (item as any).addToDiv && (item as any).addToDiv();
    }

    this.dispatch('locked', this.data.locked);
  }

  lockPens(pens: Pen[], lock: Lock) {
    for (const item of this.data.pens) {
      for (const pen of pens) {
        if (item.id === pen.id) {
          item.locked = lock;
          (item as any).addToDiv && (item as any).addToDiv();
          break;
        }
      }
    }

    this.dispatch('lockPens', {
      pens,
      lock
    });
  }

  top(pen: Pen) {
    const i = this.find(pen);
    if (i > -1) {
      this.data.pens.push(this.data.pens[i]);
      this.data.pens.splice(i, 1);
    }
  }

  bottom(pen: Pen) {
    const i = this.find(pen);
    if (i > -1) {
      this.data.pens.unshift(this.data.pens[i]);
      this.data.pens.splice(i + 1, 1);
    }
  }
  textCombine(pens?: Pen[], stand = true){
    if (!pens) {
      pens = this.activeLayer.pens;
    }
    const rect = this.getRect(pens);
    for (const item of pens) {
      const i = this.find(item);
      if (i > -1) {
        this.data.pens.splice(i, 1);
      }
    }
  }
  findIndex(pen: Pen, pens?: Pen[]) {
    if (!pens) {
      pens = this.data.pens;
    }

    return pens.findIndex((item: Pen) => item.id === pen.id);
  }
  combine(pens?: Pen[], stand = true) {
    if (!pens) {
      pens = this.activeLayer.pens;
    }
    const rect = this.getRect(pens);
    for (const item of pens) {
      const i = this.findIndex(item);
      if (i > -1) {
        this.data.pens.splice(i, 1);
      }
    }

    let node = new Node({
      name: 'combine',
      rect: new Rect(rect.x, rect.y, rect.width, rect.height),
      text: '',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      rotate: 0,
      strokeStyle: 'transparent',
      children: [],
    });
    for (let i = 0; i < pens.length; ++i) {
      if (pens[i].type === PenType.Node && rect.width === pens[i].rect.width && rect.height === pens[i].rect.height) {
        node = pens[i] as Node;
        if (!node.children) {
          node.children = [];
        }
        pens.splice(i, 1);
        break;
      }
    }

    for (const item of pens) {
      item.stand = stand;
      item.parentId = node.id;
      item.calcRectInParent(node);
      node.children.push(item);
    }
    this.data.pens.push(node);

    this.activeLayer.setPens([node]);

    this.dispatch('node', node);

    this.cache();
  }
  uncombine(node?: Pen) {
    if (!node) {
      node = this.activeLayer.pens[0];
    }

    if (!(node instanceof Node) && node.children) {
      return;
    }
    const children = []
    for (const item of node.children) {
      item.parentId = undefined;
      item.rectInParent = undefined;
      item.locked = Lock.None;
      if (item instanceof Node) {
        item.clickCount = 0;
      }
      this.data.pens.push(item);
      children.push(item)
    }

    const i = this.find(node);
    if (i > -1 && node.name === 'combine') {
      this.data.pens.splice(i, 1);
    } else {
      node.children = null;
    }

    this.cache();

    this.activeLayer.clear();
    this.hoverLayer.clear();
    return children
  }

  private find(pen: Pen) {
    for (let i = 0; i < this.data.pens.length; ++i) {
      if (pen.id === this.data.pens[i].id) {
        return i;
      }
    }

    return -1;
  }

  translate(x: number, y: number, process?: boolean,lastEmpty=false) {
    if (!process) {
      this.lastTranlated.x = 0;
      this.lastTranlated.y = 0;
    }
    const offsetX = x - this.lastTranlated.x;
    const offsetY = y - this.lastTranlated.y;

    for (const item of this.data.pens) {
      item.translate(offsetX, offsetY);
    }
    if (!lastEmpty) {
      this.lastTranlated.x = x;
      this.lastTranlated.y = y;
    }
    this.overflow();
    this.render();
    this.cache();

    this.dispatch('translate', { x, y });

  }
  //移动到指定点
  moveToAssignPoint(domId:string,id:string,scale){
    let pens = this.data.pens || []
    if (pens.length === 0) {
      return
    }
    const dom = document.getElementById(domId);
    let  height = dom.clientHeight,
    width = dom.clientWidth;
    pens.map((item) => {
      /// 找到当前节点变更样式并移动至画布中心
      if (id == item.id) {
        item.strokeStyle = this.options.activeColor;
        item.fillStyle = this.options.activeColor;

        if (this.data.scale < scale) {
          this.scaleTo(this.data.scale);
        }

        let x, y;

        /// 节点类型
        if (item instanceof Node) {
          x = -item.rect.center.x + width / 2;
          y = -item.rect.center.y + height / 2;
        }

        /// 线类型
        if (item instanceof Line) {
          x = -((item.from.x + item.to.x) / 2) + width / 2;
          y = -((item.from.y + item.to.y) / 2) + height / 2;
        }
        // 平移画布
        this.translate(x, y);
        setTimeout(() => {
          this.translate(0, 0);
        }, 0);
      }
    });
  }

  // scale for scaled canvas:
  //   > 1, expand
  //   < 1, reduce
  scale(scale: number, center?: Point) {
    this.data.scale *= scale;
    !center && (center = this.getRect().center);

    for (const item of this.data.pens) {
      item.scale(scale, center);
    }
    this.animateLayer.pens.forEach((pen) => {
      if (pen instanceof Line) {
        pen.scale(scale, center);
      }
    });
    Store.set(this.generateStoreKey('LT:scale'), this.data.scale);

    this.render();
    this.cache();

    this.dispatch('scale', this.data.scale);
  }

  // scale for origin canvas:
  scaleTo(scale: number, center?: Point) {
    this.scale(scale / this.data.scale, center);
    this.data.scale = scale;
  }

  round() {
    for (const item of this.data.pens) {
      if (item instanceof Node) {
        item.round();
      }
    }
  }

  private generateStoreKey(key) {
    return `${this.id}-${key}`;
  }

  private createMarkdownTip() {
    this.tipMarkdown = document.createElement('div');
    this.tipMarkdown.style.position = 'fixed';
    this.tipMarkdown.style.zIndex = '-1';
    this.tipMarkdown.style.left = '-9999px';
    this.tipMarkdown.style.width = 'auto';
    this.tipMarkdown.style.outline = 'none';
    this.tipMarkdown.style.border = '1px solid #d0d0d0';
    this.tipMarkdown.style.backgroundColor = '#fff';
    this.tipMarkdown.style.padding = '10px 15px';
    this.tipMarkdown.style.overflowY = 'auto';
    this.tipMarkdown.style.minHeight = '30px';
    this.tipMarkdown.style.borderRadius = '5px';
    this.tipMarkdown.style.maxHeight = '260px';
    document.body.appendChild(this.tipMarkdown);
    return this.tipMarkdown
  }



  private showTip(data: Pen, pos: { x: number, y: number; }) {
    if (!this.data.locked || !data || (!data.markdown && !data.tipId && !data.title) || data.id === this.tip) {
      return;
    }
    if (data.title) {
      this.divLayer.canvas.title = data.title;
      this.tip = data.id;
      return;
    }

    if (data.tipId) { 
      this.tipElem = document.getElementById(data.tipId);
    }

    let elem = this.tipElem;
    if (data.markdown) {
      elem = this.tipMarkdown;
      const marked = (window as any).marked;
      if (marked) {
        this.tipMarkdown.innerHTML = marked(data.markdown);
      } else {
        this.tipMarkdown.innerHTML = data.markdown;
      }
      const a = this.tipMarkdown.getElementsByTagName('A');
      for (let i = 0; i < a.length; ++i) {
        a[i].setAttribute('target', '_blank');
      }
    }

    if (!elem) {
      return 
    }
    const parentRect = this.parentElem.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();
    let x = pos.x + parentRect.left - elemRect.width / 2;
    let y = pos.y + parentRect.top;
    if (data instanceof Node) {
      x = parentRect.left + (data as Node).rect.center.x - elemRect.width / 2;
      y = parentRect.top + (data as Node).rect.ey;
    }

    x -= this.parentElem.scrollLeft;
    y -= this.parentElem.scrollTop;

    if (x < 0) {
      x = 0;
    }
    if (x + elemRect.width > document.body.clientWidth) {
      x = document.body.clientWidth - elemRect.width;
    }
    if (y + elemRect.height > document.body.clientHeight) {
      y = document.body.clientHeight - elemRect.height;
    }

    elem.style.position = 'fixed';
    elem.style.left = x + 100 + 'px';
    elem.style.top = y + 80 +  'px';
    elem.style.zIndex = '100';
    this.tip = data.id;

    this.dispatch('tip', elem);

  }

  private hideTip() {
    if (!this.tip) {
      return;
    }

    this.tipMarkdown.style.left = '-9999px';
    this.tipMarkdown.style.zIndex = '-1';
    if (this.tipElem) {
      this.tipElem.style.left = '-9999px';
      this.tipElem.style.zIndex = '-1';
      this.tipElem = null;
    }
    this.divLayer.canvas.title = '';

    this.tip = '';
  }

  scroll(x: number, y: number) {
    if (this.scrolling) {
      return;
    }
    this.scrolling = true;
    this.parentElem.scrollLeft += x;
    this.parentElem.scrollTop += y;
    setTimeout(() => {
      this.scrolling = false;
    }, 700);
  }

  toComponent(pens?: Pen[]) {
    if (!pens) {
      pens = this.data.pens;
    }

    const rect = this.getRect(pens);
    let node = new Node({
      name: 'combine',
      rect: new Rect(rect.x, rect.y, rect.width, rect.height),
      text: '',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      strokeStyle: 'transparent',
      children: []
    });

    for (const item of pens) {
      if (item.type === PenType.Node && rect.width === item.rect.width && rect.height === item.rect.height) {
        node = item as Node;
        if (!node.children) {
          node.children = [];
        }
        break;
      }
    }

    for (const item of pens) {
      if (item !== node) {
        item.parentId = node.id;
        item.calcRectInParent(node);
        node.children.push(item);
      }
    }

    return node;
  }

  clearBkImg() {
    this.canvas.clearBkImg();
  }

  dispatch(event: string, data: any) {
    if (this.options.on) {
      this.options.on(event, data);
    }
  }

  getValue(idOrTag: string, attr = 'text') {
    let pen: Pen;
    this.data.pens.forEach(item => {
      if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
        pen = item;
        return;
      }
    });

    return pen[attr];
  }

  setValue(idOrTag: string, val: any, attr = 'text') {
    let pen: Pen;
    this.data.pens.forEach(item => {
      if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
        pen = item;
        return;
      }
    });
    pen[attr] = val;
  }

  destroy() {
    this.subcribe.unsubscribe();
    this.subcribeRender.unsubscribe();
    this.subcribeImage.unsubscribe();
    this.subcribeAnimateEnd.unsubscribe();
    this.subcribeAnimateMoved.unsubscribe();
    this.subcribeMediaEnd.unsubscribe();
    this.animateLayer.destroy();
    this.divLayer.destroy();
    document.body.removeChild(this.tipMarkdown);
    window.removeEventListener('resize', this.winResize);
    this.closeSocket();
    (window as any).topology = null;
  }
  fitView(viewPadding?: Padding) {
    if (!this.hasView()) return;
    // 1. 重置画布尺寸为容器尺寸
    const { parentElem } = this.canvas;
    const { offsetWidth: width, offsetHeight: height } = parentElem;
    this.resize({
      width,
      height,
    });
    // 2. 图形居中
    this.centerView(viewPadding);
    // 3. 获取设置的留白值
    const padding = formatPadding(viewPadding || this.options.viewPadding);
    // 4. 获取图形尺寸
    const rect = this.getRect();
    // 6. 计算缩放比
    const w = (width - padding[1] - padding[3]) / rect.width;
    const h = (height - padding[0] - padding[2]) / rect.height;
    let ratio = w;
    if (w > h) {
      ratio = h;
    }
    this.scale(ratio);
  }

  centerView(padding?: Padding) {
    if (!this.hasView()) return;
    const rect = this.getRect();
    const viewCenter = this.getViewCenter(padding);
    const { center } = rect;
    this.translate(viewCenter.x - center.x, viewCenter.y - center.y);
    const { parentElem } = this.canvas;
    const x = (parentElem.scrollWidth - parentElem.offsetWidth) / 2;
    const y = (parentElem.scrollHeight - parentElem.offsetHeight) / 2;
    parentElem.scrollTop = y;
    parentElem.scrollLeft = x;
    return true;
  }
  hasView() {
    const rect = this.getRect();
    return !(rect.width === 99999 || rect.height === 99999);
  }
  getViewCenter(viewPadding?: Padding) {
    const padding = formatPadding(viewPadding || this.options.viewPadding);
    const { width, height } = this.canvas;
    return {
      x: (width - padding[1] - padding[3]) / 2 + padding[3],
      y: (height - padding[0] - padding[2]) / 2 + padding[0],
    };
  }
  throttle (fn, delay = 200) {
    let pre:number
    return function () {
      const args = arguments
      const that = this
      const now = Date.now()
      if (pre && now - pre > delay) {
        fn.apply(that, args)
        pre = Date.now()
      } else {
        fn.apply(that, args)
      }
    }
  }
  restoreColor(){
    this.data.pens.map(it => {
      if (it.children && it.children.length>0) {
        it.children.map(is=>{
          is.strokeStyle = is.sourceColor;
          is.fillStyle = is.sourceColor;
          if (is.name === "text") {
            is.font.color = is.sourceColor
          }
        })
        this.uncombine(it)
      }else{
        it.strokeStyle = it.sourceColor;
        it.fillStyle = it.sourceColor;
      }
      if (it.name === "text") {
        it.font.color = it.sourceColor
      }
    });
    this.render();
  }
}
