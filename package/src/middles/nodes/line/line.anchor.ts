import { Node } from '../../../models/node';
import { Point } from '../../../models/point';
import { Direction } from '../../../models/direction';

export function lineAnchors(node: Node) {
  const y = node.rect.center.y;
  // node.anchors.push(new Point(node.rect.x, y, Direction.Left));
  // node.anchors.push(new Point(node.rect.x + node.rect.width, y, Direction.Right));
  for (let i = node.rect.x; i < node.rect.ex; i += 1) {
    const pt = new Point(
      i,
      y,
      Direction.Bottom
    );
    pt.hidden = true;
    node.anchors.push(pt);
  }
}
