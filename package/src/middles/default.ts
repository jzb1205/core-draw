import { Line } from './../models/line'
import { Node } from './../models/node'
import { Point } from './../models/point'

import lines from './lines' //线类型
import arrows from './arrows'//箭头类型

// ********图元库*******
import common from './nodes'//common

export const drawNodeFns: any = {};// Functions of drawing a node.
export const iconRectFns: any = {};// Calc the occupy rect of icon.
export const textRectFns: any = {};// Calc the occupy rect of text.
export const anchorsFns: any = {};// Calc the anchors of node.
export const drawLineFns: any = {};// Functions of drawing a line.
export const drawArrowFns: any = {};// Functions of drawing a arrow.

function init() {

  // ********Default nodes.*******
  // Combine
  drawNodeFns.combine = common.rectangle;

  // Div
  drawNodeFns.div = common.rectangle;

  // Square
  drawNodeFns.square = common.rectangle;

  // Rectangle
  drawNodeFns.rectangle = common.rectangle;
  iconRectFns.rectangle = common.rectangleIconRect;
  textRectFns.rectangle = common.rectangleTextRect;

  // Ciricle
  drawNodeFns.circle = common.circle;
  iconRectFns.circle = common.circleIconRect;
  textRectFns.circle = common.circleTextRect;
  anchorsFns.circle = common.circleAnchors;

  // Triangle
  drawNodeFns.triangle = common.triangle;
  anchorsFns.triangle = common.triangleAnchors;
  iconRectFns.triangle = common.triangleIconRect;
  textRectFns.triangle = common.triangleTextRect;

  // Diamond
  drawNodeFns.diamond = common.diamond;
  iconRectFns.diamond = common.diamondIconRect;
  textRectFns.diamond = common.diamondTextRect;

  // Hexagon
  drawNodeFns.hexagon = common.hexagon;
  iconRectFns.hexagon = common.hexagonIconRect;
  textRectFns.hexagon = common.hexagonTextRect;
  anchorsFns.hexagon = common.hexagonAnchors;

  // Pentagon
  drawNodeFns.pentagon = common.pentagon;
  iconRectFns.pentagon = common.pentagonIconRect;
  textRectFns.pentagon = common.pentagonTextRect;
  anchorsFns.pentagon = common.pentagonAnchors;

  // Pentagram
  drawNodeFns.pentagram = common.pentagram;
  iconRectFns.pentagram = common.pentagramIconRect;
  textRectFns.pentagram = common.pentagramTextRect;
  anchorsFns.pentagram = common.pentagramAnchors;

  // Left arrow
  drawNodeFns.leftArrow = common.leftArrow;
  anchorsFns.leftArrow = common.arrowAnchors;
  iconRectFns.leftArrow = common.leftArrowIconRect;
  textRectFns.leftArrow = common.leftArrowTextRect;

  // Right arrow
  drawNodeFns.rightArrow = common.rightArrow;
  anchorsFns.rightArrow = common.arrowAnchors;
  iconRectFns.rightArrow = common.rightArrowIconRect;
  textRectFns.rightArrow = common.rightArrowTextRect;

  // Two-way arrow
  drawNodeFns.twowayArrow = common.twowayArrow;
  anchorsFns.twowayArrow = common.arrowAnchors;
  iconRectFns.twowayArrow = common.twowayArrowIconRect;
  textRectFns.twowayArrow = common.twowayArrowTextRect;

  // Cloud
  drawNodeFns.cloud = common.cloud;
  anchorsFns.cloud = common.cloudAnchors;
  iconRectFns.cloud = common.cloudIconRect;
  textRectFns.cloud = common.cloudTextRect;

  // Message
  drawNodeFns.message = common.message;
  anchorsFns.message = common.messageAnchors;
  iconRectFns.message = common.messageIconRect;
  textRectFns.message = common.messageTextRect;

  // File
  drawNodeFns.file = common.file;

  // Text
  drawNodeFns.text = common.text;
  // iconRectFns.text = common.lineIconRect;

  // Line
  drawNodeFns.line = common.line;
  anchorsFns.line = common.lineAnchors;
  iconRectFns.line = common.lineIconRect;
  textRectFns.line = common.lineTextRect;

  // Cube
  drawNodeFns.cube = common.cube;
  anchorsFns.cube = common.cubeAnchors;
  iconRectFns.cube = common.cubeIconRect;
  textRectFns.cube = common.cubeTextRect;

  // people
  drawNodeFns.people = common.people;
  iconRectFns.people = common.peopleIconRect;
  textRectFns.people = common.peopleTextRect;

  // Polygon
  drawNodeFns.polygon = common.polygon;
  iconRectFns.polygon = common.polygonIconRect;
  textRectFns.polygon = common.polygonTextRect;

  // pointCell
  drawNodeFns.pointCell = common.pointCell;
  anchorsFns.pointCell = common.pointCellAnchors;
  iconRectFns.pointCell = common.pointCellIconRect;
  textRectFns.pointCell = common.pointCellTextRect;
  // ********end********

  // ********Default lines.*******
  drawLineFns.line = {
    drawFn: lines.line,
    drawControlPointsFn:lines.lineControlPoints,
    controlPointsFn: lines.calcLineControlPoints,
    pointIn: lines.pointInPolyline
  };
  drawLineFns.polyline = {
    drawFn: lines.polyline,
    drawControlPointsFn: lines.polylineControlPoints,
    controlPointsFn: lines.calcPolylineControlPoints,
    dockControlPointFn: lines.dockPolylineControlPoint,
    pointIn: lines.pointInPolyline
  };
  drawLineFns.curve = {
    drawFn: lines.curve,
    drawControlPointsFn: lines.curveControlPoints,
    controlPointsFn: lines.calcCurveControlPoints,
    pointIn: lines.pointInCurve
  };
  drawLineFns.mind = {
    drawFn: lines.curve,
    drawControlPointsFn: lines.curveControlPoints,
    controlPointsFn: lines.calcMindControlPoints,
    pointIn: lines.pointInCurve
  };
  // ********end********

  // ********Default arrows.*******
  drawArrowFns.triangleSolid = arrows.triangleSolid;
  drawArrowFns.triangle = arrows.triangle;

  drawArrowFns.diamondSolid = arrows.diamondSolid;
  drawArrowFns.diamond = arrows.diamond;

  drawArrowFns.circleSolid = arrows.circleSolid;
  drawArrowFns.circle = arrows.circle;

  drawArrowFns.line = arrows.line;
  drawArrowFns.lineUp = arrows.lineUp;
  drawArrowFns.lineDown = arrows.lineDown;
  // ********end********
}
init();

// registerNode: Register a custom node.
// name - The name of node.
// drawFn - How to draw.
// anchorsFn - How to get the anchors.
// iconRectFn - How to get the icon rect.
// textRectFn - How to get the text rect.
// force - Overwirte the node if exists.
export function registerNode(
  name: string,
  drawFn: (ctx: CanvasRenderingContext2D, node: Node) => void,
  anchorsFn?: (node: Node,ctx: CanvasRenderingContext2D) => void,
  iconRectFn?: (node: Node) => void,
  textRectFn?: (node: Node) => void,
  force?: boolean
) {
  // Exist
  if (drawNodeFns[name] && !force) {
    return false;
  }

  drawNodeFns[name] = drawFn;
  anchorsFns[name] = anchorsFn;
  iconRectFns[name] = iconRectFn;
  textRectFns[name] = textRectFn;

  return true;
}

// registerLine: Register a custom line.
// name - The name of line.
// drawFn - How to draw.
// drawControlPointsFn - Draw the control points.
// controlPointsFn - How to get the controlPoints.
// dockControlPointFn - Dock a point to horizontal/vertial or related position.
// force - Overwirte the node if exists.
export function registerLine(
  name: string,
  drawFn: (ctx: CanvasRenderingContext2D, line: Line) => void,
  drawControlPointsFn?: (ctx: CanvasRenderingContext2D, line: Line) => void,
  controlPointsFn?: (line: Line) => void,
  dockControlPointFn?: (point: Point, line: Line) => void,
  pointInFn?: (point: Point, line: Line) => boolean,
  force?: boolean
) {
  // Exist
  if (drawLineFns[name] && !force) {
    return false;
  }

  drawLineFns[name] = {
    drawFn: drawFn,
    drawControlPointsFn: drawControlPointsFn,
    controlPointsFn: controlPointsFn,
    dockControlPointFn: dockControlPointFn,
    pointIn: pointInFn
  };
  return true;
}

// registerArrow: Register a custom arrow.
// name - the name of arrow.
// drawFn - how to draw.
// force - Overwirte the node if exists.
export function registerArrow(
  name: string,
  drawFn: (ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) => void,
  force?: boolean
) {
  // Exist
  if (drawArrowFns[name] && !force) {
    return false;
  }

  drawArrowFns[name] = drawFn;
  return true;
}
