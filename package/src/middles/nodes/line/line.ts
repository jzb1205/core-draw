import { Node } from '../../../models/node';

export function line(ctx: CanvasRenderingContext2D, node: Node) {
  ctx.beginPath();
  ctx.strokeStyle = node.fillStyle
  ctx.lineWidth = 4
  // node.rect.height = 4
  const y = node.rect.y+node.rect.height/2;
  ctx.moveTo(node.rect.x, y);
  ctx.lineTo(node.rect.x + node.rect.width, y);
  ctx.stroke();
}
