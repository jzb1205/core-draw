import { Node } from '../../../models/node';

export function rectangle(ctx: CanvasRenderingContext2D, node: Node) {
  // const wr = node.rect.width * node.borderRadius;
  // const hr = node.rect.height * node.borderRadius;
  // let r = wr < hr ? wr : hr;
  // if (node.rect.width < 2 * r) {
  //   r = node.rect.width / 2;
  // }
  // if (node.rect.height < 2 * r) {
  //   r = node.rect.height / 2;
  // }
  // ctx.beginPath();
  // ctx.moveTo(node.rect.x + r, node.rect.y);
  // ctx.arcTo(
  //   node.rect.x + node.rect.width,
  //   node.rect.y,
  //   node.rect.x + node.rect.width,
  //   node.rect.y + node.rect.height,
  //   r
  // );
  // ctx.arcTo(
  //   node.rect.x + node.rect.width,
  //   node.rect.y + node.rect.height,
  //   node.rect.x,
  //   node.rect.y + node.rect.height,
  //   r
  // );
  // ctx.arcTo(node.rect.x, node.rect.y + node.rect.height, node.rect.x, node.rect.y, r);
  // ctx.arcTo(node.rect.x, node.rect.y, node.rect.x + node.rect.width, node.rect.y, r);
  // ctx.closePath();
  // ctx.strokeStyle = node.fillStyle
  // ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(node.rect.x, node.rect.y);
  ctx.lineTo(node.rect.x+ node.rect.width, node.rect.y);
  ctx.lineTo(node.rect.x+ node.rect.width, node.rect.y + node.rect.height);
  ctx.lineTo(node.rect.x, node.rect.y + node.rect.height);
  ctx.lineTo(node.rect.x-1, node.rect.y-1);
  ctx.closePath();
  ctx.strokeStyle = node.strokeStyle || '#333'
  ctx.stroke();
}
