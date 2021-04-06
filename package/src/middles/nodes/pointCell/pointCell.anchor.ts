import { Node } from '../../../models/node'
import { Point } from '../../../models/point'
import { Direction } from '../../../models/direction'

export function pointCellAnchors (node: Node,ctx?: CanvasRenderingContext2D) {
  const x = node.rect.x || 0
  const y = node.rect.y || 0
  const w = node.rect.width
  const h = node.rect.height

  if (node.anchorCoordinate) {
    node.anchorCoordinate.map(it=>{
      switch (it.direction) {
        case "Up":
          node.anchors.push(new Point(x+w*it.x, y + h*it.y, Direction.Up))
          break;
        case "Bottom":
          node.anchors.push(new Point(x+w*it.x, y + h*it.y, Direction.Bottom))
          break;
        case "Left":
          node.anchors.push(new Point(x+w*it.x, y + h*it.y, Direction.Left))
          break;
        case "Right":
          node.anchors.push(new Point(x+w*it.x, y + h*it.y, Direction.Right))
          break;
        default:
          node.anchors.push(new Point(x+w*it.x y + h*it.y, Direction.None))
          break; 
      }
    })
  }
}

