"use strict";
exports.__esModule = true;
exports.calcMindControlPoints = exports.getBezierPoint = exports.pointInCurve = exports.calcCurveControlPoints = exports.curveControlPoints = exports.curve = void 0;
var index_1 = require("./../../store/index");
var point_1 = require("../../models/point");
var direction_1 = require("../../models/direction");
var canvas_1 = require("../../utils/canvas");
var distance = 80;
function curve(ctx, l) {
    ctx.beginPath();
    ctx.moveTo(l.from.x, l.from.y);
    ctx.bezierCurveTo(l.controlPoints[0].x, l.controlPoints[0].y, l.controlPoints[1].x, l.controlPoints[1].y, l.to.x, l.to.y);
    ctx.stroke();
}
exports.curve = curve;
function curveControlPoints(ctx, l) {
    ctx.save();
    // ctx.fillStyle = ctx.strokeStyle + '80';
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.moveTo(l.from.x, l.from.y);
    // ctx.lineTo(l.controlPoints[0].x, l.controlPoints[0].y);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.moveTo(l.to.x, l.to.y);
    // ctx.lineTo(l.controlPoints[1].x, l.controlPoints[1].y);
    // ctx.stroke();
    // ctx.fillStyle = '#fff';
    // ctx.lineWidth = 2;
    // for (const item of l.controlPoints) {
    //   ctx.beginPath();
    //   ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
    //   ctx.stroke();
    //   ctx.fill();
    // }
    ctx.restore();
}
exports.curveControlPoints = curveControlPoints;
function calcCurveControlPoints(l) {
    if (!l.from.direction) {
        l.from.direction = direction_1.Direction.Bottom;
    }
    if (!l.to.direction) {
        l.to.direction = (l.from.direction + 2) % 4;
        if (!l.to.direction) {
            l.to.direction = direction_1.Direction.Left;
        }
    }
    l.controlPoints = [getControlPt(l.from, l.to), getControlPt(l.to, l.from)];
    index_1.Store.set(generateStoreKey(l, 'pts-') + l.id, null);
}
exports.calcCurveControlPoints = calcCurveControlPoints;
function pointInCurve(point, l) {
    var points = index_1.Store.get(generateStoreKey(l, 'pts-') + l.id);
    if (!points) {
        points = [l.from];
        for (var i = 0.01; i < 1; i += 0.01) {
            points.push(getBezierPoint(i, l.from, l.controlPoints[0], l.controlPoints[1], l.to));
        }
        points.push(l.to);
        index_1.Store.set(generateStoreKey(l, 'pts-') + l.id, points);
    }
    var cnt = points.length - 1;
    for (var i = 0; i < cnt; ++i) {
        if (canvas_1.pointInLine(point, points[i], points[i + 1])) {
            return true;
        }
    }
    return false;
}
exports.pointInCurve = pointInCurve;
// Get a point in bezier.
// pos - The position of point in bezier. It is expressed as a percentage(0 - 1).
function getBezierPoint(pos, from, cp1, cp2, to) {
    var x1 = from.x, y1 = from.y;
    var x2 = to.x, y2 = to.y;
    var cx1 = cp1.x, cy1 = cp1.y;
    var cx2 = cp2.x, cy2 = cp2.y;
    var x = x1 * (1 - pos) * (1 - pos) * (1 - pos) +
        3 * cx1 * pos * (1 - pos) * (1 - pos) +
        3 * cx2 * pos * pos * (1 - pos) +
        x2 * pos * pos * pos;
    var y = y1 * (1 - pos) * (1 - pos) * (1 - pos) +
        3 * cy1 * pos * (1 - pos) * (1 - pos) +
        3 * cy2 * pos * pos * (1 - pos) +
        y2 * pos * pos * pos;
    return new point_1.Point(x, y);
}
exports.getBezierPoint = getBezierPoint;
function getControlPt(pt, to) {
    var point = new point_1.Point(pt.x, pt.y, pt.direction, pt.anchorIndex, pt.id);
    var dis = distance;
    if ((pt.direction === direction_1.Direction.Up || pt.direction === direction_1.Direction.Bottom) && Math.abs(pt.x - to.x) < 3) {
        if (to.y > pt.y) {
            dis = Math.floor((to.y - pt.y) / 3);
            point.y += dis;
        }
        else {
            dis = Math.floor((pt.y - to.y) / 3);
            point.y -= dis;
        }
        return point;
    }
    if ((pt.direction === direction_1.Direction.Left || pt.direction === direction_1.Direction.Right) && Math.abs(pt.y - to.y) < 3) {
        if (to.x > pt.x) {
            dis = Math.floor((to.x - pt.x) / 3);
            point.x += dis;
        }
        else {
            dis = Math.floor((pt.x - to.x) / 3);
            point.x -= dis;
        }
        return point;
    }
    switch (pt.direction) {
        case direction_1.Direction.Up:
            point.y -= dis;
            break;
        case direction_1.Direction.Right:
            point.x += dis;
            break;
        case direction_1.Direction.Bottom:
            point.y += dis;
            break;
        case direction_1.Direction.Left:
            point.x -= dis;
            break;
    }
    return point;
}
function calcMindControlPoints(l) {
    var w = l.to.x - l.from.x;
    var h = l.to.y - l.from.y;
    if (l.from.direction === direction_1.Direction.Left || l.from.direction === direction_1.Direction.Right) {
        l.controlPoints = [new point_1.Point(l.from.x, l.from.y + h / 2), new point_1.Point(l.from.x, l.to.y)];
    }
    else {
        l.controlPoints = [new point_1.Point(l.from.x + w / 2, l.from.y), new point_1.Point(l.to.x, l.from.y)];
    }
    index_1.Store.set(generateStoreKey(l, 'pts-') + l.id, null);
}
exports.calcMindControlPoints = calcMindControlPoints;
function generateStoreKey(pen, key) {
    return pen.getTID() + "-" + key;
}
