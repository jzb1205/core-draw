import { Store } from './store/index';
import { Options } from './options';
import { Canvas } from './canvas';
import { ActiveLayer } from './activeLayer';
import { HoverLayer } from './hoverLayer';
import { AnimateLayer } from './animateLayer';

export class Offscreen extends Canvas {
  public activeLayer: ActiveLayer;
  public hoverLayer: HoverLayer;
  public animateLayer: AnimateLayer;
  constructor(public parentElem: HTMLElement, public options: Options = {}, TID: String) {
    super(parentElem, options, TID);
    this.activeLayer = Store.get(this.generateStoreKey('LT:ActiveLayer'));
    this.hoverLayer = Store.get(this.generateStoreKey('LT:HoverLayer'));
    this.animateLayer = Store.get(this.generateStoreKey('LT:AnimateLayer'));
    Store.set(this.generateStoreKey('LT:offscreen'), this.canvas);
  }

  render() {
    // console.log('offscreenoffscreenoffscreenoffscreenoffscreen')
    super.render();
    const ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = this.options.color;

    for (const item of this.data.pens) {
      if (!item.getTID()) {
        item.setTID(this.TID);
      }
      
      // if (item.xCP && item.type === 0) {
      //   item.rect.ex = item.anchors && item.anchors[0].y
      //   item.rect.y = item.anchors && item.anchors[0].y
      //   item.rect.height = 4
      // }
      item.render(ctx);
    }
    this.activeLayer.render(ctx);
    // this.animateLayer.render(ctx);
    this.hoverLayer.render(ctx);
  }
}
