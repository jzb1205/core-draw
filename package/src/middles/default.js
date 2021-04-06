"use strict";
exports.__esModule = true;
exports.registerArrow = exports.registerLine = exports.registerNode = exports.drawArrowFns = exports.drawLineFns = exports.anchorsFns = exports.textRectFns = exports.iconRectFns = exports.drawNodeFns = void 0;
var lines_1 = require("./lines"); //线类型
var arrows_1 = require("./arrows"); //箭头类型
// ********图元库*******
var nodes_1 = require("./nodes"); //common
exports.drawNodeFns = {}; // Functions of drawing a node.
exports.iconRectFns = {}; // Calc the occupy rect of icon.
exports.textRectFns = {}; // Calc the occupy rect of text.
exports.anchorsFns = {}; // Calc the anchors of node.
exports.drawLineFns = {}; // Functions of drawing a line.
exports.drawArrowFns = {}; // Functions of drawing a arrow.
function init() {
    // ********Default nodes.*******
    // Combine
    exports.drawNodeFns.combine = nodes_1["default"].rectangle;
    // Div
    exports.drawNodeFns.div = nodes_1["default"].rectangle;
    // Square
    exports.drawNodeFns.square = nodes_1["default"].rectangle;
    // Rectangle
    exports.drawNodeFns.rectangle = nodes_1["default"].rectangle;
    exports.iconRectFns.rectangle = nodes_1["default"].rectangleIconRect;
    exports.textRectFns.rectangle = nodes_1["default"].rectangleTextRect;
    // Ciricle
    exports.drawNodeFns.circle = nodes_1["default"].circle;
    exports.iconRectFns.circle = nodes_1["default"].circleIconRect;
    exports.textRectFns.circle = nodes_1["default"].circleTextRect;
    exports.anchorsFns.circle = nodes_1["default"].circleAnchors;
    // Triangle
    exports.drawNodeFns.triangle = nodes_1["default"].triangle;
    exports.anchorsFns.triangle = nodes_1["default"].triangleAnchors;
    exports.iconRectFns.triangle = nodes_1["default"].triangleIconRect;
    exports.textRectFns.triangle = nodes_1["default"].triangleTextRect;
    // Diamond
    exports.drawNodeFns.diamond = nodes_1["default"].diamond;
    exports.iconRectFns.diamond = nodes_1["default"].diamondIconRect;
    exports.textRectFns.diamond = nodes_1["default"].diamondTextRect;
    // Hexagon
    exports.drawNodeFns.hexagon = nodes_1["default"].hexagon;
    exports.iconRectFns.hexagon = nodes_1["default"].hexagonIconRect;
    exports.textRectFns.hexagon = nodes_1["default"].hexagonTextRect;
    exports.anchorsFns.hexagon = nodes_1["default"].hexagonAnchors;
    // Pentagon
    exports.drawNodeFns.pentagon = nodes_1["default"].pentagon;
    exports.iconRectFns.pentagon = nodes_1["default"].pentagonIconRect;
    exports.textRectFns.pentagon = nodes_1["default"].pentagonTextRect;
    exports.anchorsFns.pentagon = nodes_1["default"].pentagonAnchors;
    // Pentagram
    exports.drawNodeFns.pentagram = nodes_1["default"].pentagram;
    exports.iconRectFns.pentagram = nodes_1["default"].pentagramIconRect;
    exports.textRectFns.pentagram = nodes_1["default"].pentagramTextRect;
    exports.anchorsFns.pentagram = nodes_1["default"].pentagramAnchors;
    // Left arrow
    exports.drawNodeFns.leftArrow = nodes_1["default"].leftArrow;
    exports.anchorsFns.leftArrow = nodes_1["default"].arrowAnchors;
    exports.iconRectFns.leftArrow = nodes_1["default"].leftArrowIconRect;
    exports.textRectFns.leftArrow = nodes_1["default"].leftArrowTextRect;
    // Right arrow
    exports.drawNodeFns.rightArrow = nodes_1["default"].rightArrow;
    exports.anchorsFns.rightArrow = nodes_1["default"].arrowAnchors;
    exports.iconRectFns.rightArrow = nodes_1["default"].rightArrowIconRect;
    exports.textRectFns.rightArrow = nodes_1["default"].rightArrowTextRect;
    // Two-way arrow
    exports.drawNodeFns.twowayArrow = nodes_1["default"].twowayArrow;
    exports.anchorsFns.twowayArrow = nodes_1["default"].arrowAnchors;
    exports.iconRectFns.twowayArrow = nodes_1["default"].twowayArrowIconRect;
    exports.textRectFns.twowayArrow = nodes_1["default"].twowayArrowTextRect;
    // Cloud
    exports.drawNodeFns.cloud = nodes_1["default"].cloud;
    exports.anchorsFns.cloud = nodes_1["default"].cloudAnchors;
    exports.iconRectFns.cloud = nodes_1["default"].cloudIconRect;
    exports.textRectFns.cloud = nodes_1["default"].cloudTextRect;
    // Message
    exports.drawNodeFns.message = nodes_1["default"].message;
    exports.anchorsFns.message = nodes_1["default"].messageAnchors;
    exports.iconRectFns.message = nodes_1["default"].messageIconRect;
    exports.textRectFns.message = nodes_1["default"].messageTextRect;
    // File
    exports.drawNodeFns.file = nodes_1["default"].file;
    // Text
    exports.drawNodeFns.text = nodes_1["default"].text;
    // iconRectFns.text = common.lineIconRect;
    // Line
    exports.drawNodeFns.line = nodes_1["default"].line;
    exports.anchorsFns.line = nodes_1["default"].lineAnchors;
    exports.iconRectFns.line = nodes_1["default"].lineIconRect;
    exports.textRectFns.line = nodes_1["default"].lineTextRect;
    // Cube
    exports.drawNodeFns.cube = nodes_1["default"].cube;
    exports.anchorsFns.cube = nodes_1["default"].cubeAnchors;
    exports.iconRectFns.cube = nodes_1["default"].cubeIconRect;
    exports.textRectFns.cube = nodes_1["default"].cubeTextRect;
    // people
    exports.drawNodeFns.people = nodes_1["default"].people;
    exports.iconRectFns.people = nodes_1["default"].peopleIconRect;
    exports.textRectFns.people = nodes_1["default"].peopleTextRect;
    // Polygon
    exports.drawNodeFns.polygon = nodes_1["default"].polygon;
    exports.iconRectFns.polygon = nodes_1["default"].polygonIconRect;
    exports.textRectFns.polygon = nodes_1["default"].polygonTextRect;
    // pointCell
    exports.drawNodeFns.pointCell = nodes_1["default"].pointCell;
    exports.anchorsFns.pointCell = nodes_1["default"].pointCellAnchors;
    exports.iconRectFns.pointCell = nodes_1["default"].pointCellIconRect;
    exports.textRectFns.pointCell = nodes_1["default"].pointCellTextRect;
    // ********end********
    // ********Default lines.*******
    exports.drawLineFns.line = {
        drawFn: lines_1["default"].line,
        drawControlPointsFn: lines_1["default"].lineControlPoints,
        controlPointsFn: lines_1["default"].calcLineControlPoints,
        pointIn: lines_1["default"].pointInPolyline
    };
    exports.drawLineFns.polyline = {
        drawFn: lines_1["default"].polyline,
        drawControlPointsFn: lines_1["default"].polylineControlPoints,
        controlPointsFn: lines_1["default"].calcPolylineControlPoints,
        dockControlPointFn: lines_1["default"].dockPolylineControlPoint,
        pointIn: lines_1["default"].pointInPolyline
    };
    exports.drawLineFns.curve = {
        drawFn: lines_1["default"].curve,
        drawControlPointsFn: lines_1["default"].curveControlPoints,
        controlPointsFn: lines_1["default"].calcCurveControlPoints,
        pointIn: lines_1["default"].pointInCurve
    };
    exports.drawLineFns.mind = {
        drawFn: lines_1["default"].curve,
        drawControlPointsFn: lines_1["default"].curveControlPoints,
        controlPointsFn: lines_1["default"].calcMindControlPoints,
        pointIn: lines_1["default"].pointInCurve
    };
    // ********end********
    // ********Default arrows.*******
    exports.drawArrowFns.triangleSolid = arrows_1["default"].triangleSolid;
    exports.drawArrowFns.triangle = arrows_1["default"].triangle;
    exports.drawArrowFns.diamondSolid = arrows_1["default"].diamondSolid;
    exports.drawArrowFns.diamond = arrows_1["default"].diamond;
    exports.drawArrowFns.circleSolid = arrows_1["default"].circleSolid;
    exports.drawArrowFns.circle = arrows_1["default"].circle;
    exports.drawArrowFns.line = arrows_1["default"].line;
    exports.drawArrowFns.lineUp = arrows_1["default"].lineUp;
    exports.drawArrowFns.lineDown = arrows_1["default"].lineDown;
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
function registerNode(name, drawFn, anchorsFn, iconRectFn, textRectFn, force) {
    // Exist
    if (exports.drawNodeFns[name] && !force) {
        return false;
    }
    exports.drawNodeFns[name] = drawFn;
    exports.anchorsFns[name] = anchorsFn;
    exports.iconRectFns[name] = iconRectFn;
    exports.textRectFns[name] = textRectFn;
    return true;
}
exports.registerNode = registerNode;
// registerLine: Register a custom line.
// name - The name of line.
// drawFn - How to draw.
// drawControlPointsFn - Draw the control points.
// controlPointsFn - How to get the controlPoints.
// dockControlPointFn - Dock a point to horizontal/vertial or related position.
// force - Overwirte the node if exists.
function registerLine(name, drawFn, drawControlPointsFn, controlPointsFn, dockControlPointFn, pointInFn, force) {
    // Exist
    if (exports.drawLineFns[name] && !force) {
        return false;
    }
    exports.drawLineFns[name] = {
        drawFn: drawFn,
        drawControlPointsFn: drawControlPointsFn,
        controlPointsFn: controlPointsFn,
        dockControlPointFn: dockControlPointFn,
        pointIn: pointInFn
    };
    return true;
}
exports.registerLine = registerLine;
// registerArrow: Register a custom arrow.
// name - the name of arrow.
// drawFn - how to draw.
// force - Overwirte the node if exists.
function registerArrow(name, drawFn, force) {
    // Exist
    if (exports.drawArrowFns[name] && !force) {
        return false;
    }
    exports.drawArrowFns[name] = drawFn;
    return true;
}
exports.registerArrow = registerArrow;
