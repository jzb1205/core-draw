/*
 * @Author: your name
 * @Date: 2021-02-02 15:28:54
 * @LastEditTime: 2021-04-02 10:48:10
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \gongfengd:\专题图\auto-draw\public\js\core\src\middles\nodes\pointCell\pointCell.ts
 */
import { Node } from '../../../models/node';
// import PointSymbol from 'core-symbol'
import PointSymbol from './../../../../../../core-symbol/package/index'  //本地测试

export function pointCell(ctx: CanvasRenderingContext2D, node: Node) {
  const size = node.symbolSize || 1
  const w = node.rect.width
  const h = node.rect.height
  const x = node.rect.x + w/2 || 0
  const y = node.rect.y + h/2 || 0
  
  let symbolStyle = {
    symbolid:node.realSymbolId,
    symbolsize:size,
    symbolcolor:node.fillStyle,
    color:node.fillStyle,
    angle:node.rotate,
    scale:size*node.scaleNum/node.fontScale,
    opacity:1
  }
  
  if (!window.drawSymbol) {
    window.drawSymbol = new PointSymbol()
  }
  let symbol = window.drawSymbol
  
  symbol.draw(ctx, {x,y},symbolStyle);
}








