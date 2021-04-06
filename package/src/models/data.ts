import { Pen } from './pen';
import { Node } from './node';
import { Line } from './line';
import { Lock } from './status';

export class TopologyData {
  pens: Pen[] = [];
  lineName = 'polyline';
  fromArrowType = 'none';
  toArrowType = 'none';
  scale = 20;
  locked = Lock.None;
  bkImage: string;
  bkColor: string;
  grid?: boolean;
  gridColor = '#f3f3f3';
  gridSize = 10;
  rule?: boolean;
  ruleColor = '#888';
  websocket?: string;
  data?: any;
  cellInfo:any;
  preAnchorInfo:any
  constructor(json?: any) {
    if (json) {
      this.pens = [];
      for (const item of json.pens) {
        if (item.from) {  //线和节点分支
          this.pens.push(new Line(item));
        } else {
          this.pens.push(new Node(item));
        }
      }
      this.lineName = json.lineName || 'polyline';  //连接线的样式  直线line  折线polyline  贝沙尔曲线curve  默认贝沙尔曲线
      this.fromArrowType = json.fromArrowType || 'none'; //连接线起始样式
      this.toArrowType = json.toArrowType || 'none'; //连接线终点样式
      this.scale = json.scale || 1;
      this.locked = json.locked || Lock.None; 
      this.bkImage = json.bkImage;
      this.bkColor = json.bkColor;
      this.grid = json.grid;

      if (typeof json.data === 'object') {
        this.data = JSON.parse(JSON.stringify(json.data));
      } else {
        this.data = json.data || '';
      }
    }
  }
}
