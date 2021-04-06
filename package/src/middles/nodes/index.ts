
//line
import { line } from './line/line'
import { lineAnchors } from './line/line.anchor'
import { lineIconRect,lineTextRect} from './line/line.rect'
//rectangle
import { rectangle } from './rectangle/rectangle'
import { rectangleIconRect,rectangleTextRect} from './rectangle/rectangle.rect'
//text
import { getWords,getLines,fillText,text,iconfont} from './text/text'
//polygon
import { polygon } from './polygon/polygon'
import { polygonAnchors } from './polygon/polygon.anchor'
import { polygonIconRect,polygonTextRect} from './polygon/polygon.rect'
//polygon
import { pointCell } from './pointCell/pointCell'
import { pointCellAnchors } from './pointCell/pointCell.anchor'
import { pointCellIconRect,pointCellTextRect} from './pointCell/pointCell.rect'

export default {
    //line
    line,
    lineAnchors,
    lineIconRect,
    lineTextRect,
    //message
    //rectangle
    rectangle,
    rectangleIconRect,
    rectangleTextRect,
    //text
    getWords,
    getLines,
    fillText,
    text,
    iconfont,
    //triangle
    //polygon
    polygon,
    polygonAnchors,
    polygonIconRect,
    polygonTextRect,
    //pointCell
    pointCell,
    pointCellAnchors,
    pointCellIconRect,
    pointCellTextRect
}