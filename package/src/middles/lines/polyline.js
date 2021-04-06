"use strict";
exports.__esModule = true;
exports.dockPolylineControlPoint = exports.pointInPolyline = exports.calcPolylineControlPoints = exports.polylineControlPoints = exports.polyline = void 0;
var point_1 = require("../../models/point");
var direction_1 = require("../../models/direction");
var canvas_1 = require("../../utils/canvas");
var minDistance = 0;
function polyline(ctx, l) {
    ctx.beginPath();
    ctx.moveTo(l.from.x, l.from.y);
    for (var _i = 0, _a = l.controlPoints; _i < _a.length; _i++) {
        var item = _a[_i];
        ctx.lineTo(item.x, item.y);
    }
    ctx.lineTo(l.to.x, l.to.y);
    ctx.stroke();
}
exports.polyline = polyline;
function polylineControlPoints(ctx, l) {
    if (l.hideCP)
        return;
    console.log('l.hideCP', l.hideCP);
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;
    var r = l.fromArrowSize || 10;
    for (var _i = 0, _a = l.controlPoints; _i < _a.length; _i++) {
        var item = _a[_i];
        ctx.beginPath();
        ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
    }
    ctx.restore();
}
exports.polylineControlPoints = polylineControlPoints;
function calcPolylineControlPoints(l) {
    l.controlPoints = [];
    var from = getDirectionPoint(l.from, l.to);
    if (l.from.direction) {
        l.controlPoints.push(from);
    }
    var to = getDirectionPoint(l.to, l.from);
    var pts;
    switch (from.direction) {
        case direction_1.Direction.Up:
            pts = getNextPointByUp(from, to);
            break;
        case direction_1.Direction.Right:
            pts = getNextPointByRight(from, to);
            break;
        case direction_1.Direction.Bottom:
            pts = getNextPointByBottom(from, to);
            break;
        case direction_1.Direction.Left:
            pts = getNextPointByLeft(from, to);
            break;
    }
    l.controlPoints.push.apply(l.controlPoints, pts);
    if (l.to.direction) {
        l.controlPoints.push(to);
    }
    if (l.controlPoints.length === 1) {
        if (l.from.direction === 0) {
            l.controlPoints[0].x = l.from.x;
            l.controlPoints[0].y = l.to.y;
        }
        if (l.to.direction === 0) {
            l.controlPoints[0].x = l.to.x;
            l.controlPoints[0].y = l.from.y;
        }
    }
}
exports.calcPolylineControlPoints = calcPolylineControlPoints;
function pointInPolyline(point, l) {
    if (!l.controlPoints || !l.controlPoints.length) {
        return canvas_1.pointInLine(point, l.from, l.to);
    }
    if (canvas_1.pointInLine(point, l.from, l.controlPoints[0])) {
        return true;
    }
    if (canvas_1.pointInLine(point, l.to, l.controlPoints[l.controlPoints.length - 1])) {
        return true;
    }
    for (var i = 0; i < l.controlPoints.length - 1; ++i) {
        if (canvas_1.pointInLine(point, l.controlPoints[i], l.controlPoints[i + 1])) {
            return true;
        }
    }
    return false;
}
exports.pointInPolyline = pointInPolyline;
function dockPolylineControlPoint(point, l) {
    var pts = [l.from];
    pts.push.apply(pts, l.controlPoints);
    pts.push(l.to);
    for (var _i = 0, pts_1 = pts; _i < pts_1.length; _i++) {
        var item = pts_1[_i];
        if (Math.abs(point.x - item.x) < 7) {
            point.x = item.x;
        }
        if (Math.abs(point.y - item.y) < 7) {
            point.y = item.y;
        }
    }
}
exports.dockPolylineControlPoint = dockPolylineControlPoint;
function getDirectionPoint(pt, to) {
    var point = pt.clone();
    switch (pt.direction) {
        case direction_1.Direction.Up:
            if (to.y < pt.y) {
                point.y -= Math.floor((pt.y - to.y) / 2);
            }
            else {
                point.y -= minDistance;
            }
            break;
        case direction_1.Direction.Right:
            if (to.x > pt.x) {
                point.x += Math.floor((to.x - pt.x) / 2);
            }
            else {
                point.x += minDistance;
            }
            break;
        case direction_1.Direction.Bottom:
            if (to.y > pt.y) {
                point.y += Math.floor((to.y - pt.y) / 2);
            }
            else {
                point.y += minDistance;
            }
            break;
        case direction_1.Direction.Left:
            if (to.x < pt.x) {
                point.x -= Math.floor((pt.x - to.x) / 2);
            }
            else {
                point.x -= minDistance;
            }
            break;
    }
    return point;
}
function getNextPointByCenter(from, to) {
    if (from.x === to.x || from.y === to.y) {
        return [];
    }
    return [new point_1.Point(to.x, from.y)];
}
function getNextPointByUp(from, to) {
    if (from.x === to.x || from.y === to.y) {
        return [];
    }
    // return [new Point(to.x, from.y)];
    // The to point above the from point.
    if (from.y > to.y) {
        if (to.direction === direction_1.Direction.Up && from.y - to.y > 3 * minDistance) {
            if (from.x < to.x) {
                if (to.x - from.x < minDistance) {
                    return [new point_1.Point(from.x - 2 * minDistance, from.y), new point_1.Point(from.x - 2 * minDistance, to.y)];
                }
                return [new point_1.Point(from.x, to.y)];
            }
            else {
                if (from.x - to.x < minDistance) {
                    return [new point_1.Point(from.x + 2 * minDistance, from.y), new point_1.Point(from.x + 2 * minDistance, to.y)];
                }
                return [new point_1.Point(from.x, to.y)];
            }
        }
        else {
            // Left top
            if ((to.direction === direction_1.Direction.Left && from.x > to.x) || (to.direction === direction_1.Direction.Right && from.x < to.x)) {
                return [new point_1.Point(to.x, from.y)];
            }
            return [new point_1.Point(from.x, to.y)];
        }
        // The to point below the from point.
    }
    else {
        if (to.direction === direction_1.Direction.Bottom) {
            if (from.x < to.x) {
                return getHorizontalPoints(from, to);
            }
            else {
                var pts = getHorizontalPoints(to, from);
                return [pts[1], pts[0]];
            }
        }
        else {
            return [new point_1.Point(to.x, from.y)];
        }
    }
}
function getNextPointByBottom(from, to) {
    if (from.x === to.x || from.y === to.y) {
        return [];
    }
    // The to point below the from point.
    if (from.y < to.y) {
        if (to.direction === direction_1.Direction.Bottom && to.y - from.y > 3 * minDistance) {
            if (from.x < to.x) {
                if (to.x - from.x < minDistance) {
                    return [new point_1.Point(from.x - 2 * minDistance, from.y), new point_1.Point(from.x - 2 * minDistance, to.y)];
                }
                return [new point_1.Point(from.x, to.y)];
            }
            else {
                if (from.x - to.x < minDistance) {
                    return [new point_1.Point(from.x + 2 * minDistance, from.y), new point_1.Point(from.x + 2 * minDistance, to.y)];
                }
                return [new point_1.Point(from.x, to.y)];
            }
        }
        else {
            if ((to.direction === direction_1.Direction.Left && from.x > to.x) || (to.direction === direction_1.Direction.Right && from.x < to.x)) {
                return [new point_1.Point(to.x, from.y)];
            }
            return [new point_1.Point(from.x, to.y)];
        }
        // The to point below the from point.
    }
    else {
        if (to.direction === direction_1.Direction.Up) {
            if (from.x < to.x) {
                return getHorizontalPoints(from, to);
            }
            else {
                var pts = getHorizontalPoints(to, from);
                return [pts[1], pts[0]];
            }
        }
        else {
            return [new point_1.Point(to.x, from.y)];
        }
    }
}
function getNextPointByLeft(from, to) {
    if (from.x === to.x || from.y === to.y) {
        return [];
    }
    // The to point is on the left.
    if (from.x > to.x) {
        if (to.direction === direction_1.Direction.Left && from.x - to.x > 3 * minDistance) {
            if (from.y < to.y) {
                if (to.y - from.y < minDistance) {
                    return [new point_1.Point(from.x, from.y + 2 * minDistance), new point_1.Point(to.x, from.y + 2 * minDistance)];
                }
                return [new point_1.Point(to.x, from.y)];
            }
            else {
                if (from.y - to.y < minDistance) {
                    return [new point_1.Point(from.x, from.y - 2 * minDistance), new point_1.Point(to.x, from.y - 2 * minDistance)];
                }
                return [new point_1.Point(to.x, from.y)];
            }
        }
        else {
            if (to.direction === direction_1.Direction.Left ||
                (to.direction === direction_1.Direction.Up && from.y < to.y) ||
                (to.direction === direction_1.Direction.Bottom && from.y > to.y)) {
                return [new point_1.Point(to.x, from.y)];
            }
            return [new point_1.Point(from.x, to.y)];
        }
        // The to point is on the right.
    }
    else {
        if (to.direction === direction_1.Direction.Right) {
            if (from.y < to.y) {
                return getVerticalPoints(from, to);
            }
            else {
                var pts = getVerticalPoints(to, from);
                return [pts[1], pts[0]];
            }
        }
        else {
            return [new point_1.Point(from.x, to.y)];
        }
    }
}
function getNextPointByRight(from, to) {
    if (from.x === to.x || from.y === to.y) {
        return [];
    }
    // The to point is on the right.
    if (from.x < to.x) {
        if (to.direction === direction_1.Direction.Right && to.x - from.x > 3 * minDistance) {
            if (from.y < to.y) {
                if (to.y - from.y < minDistance) {
                    return [new point_1.Point(from.x, from.y - 2 * minDistance), new point_1.Point(to.x, from.y - 2 * minDistance)];
                }
                return [new point_1.Point(to.x, from.y)];
            }
            else {
                if (from.y - to.y < minDistance) {
                    return [new point_1.Point(from.x, from.y + 2 * minDistance), new point_1.Point(to.x, from.y + 2 * minDistance)];
                }
                return [new point_1.Point(to.x, from.y)];
            }
        }
        else {
            if (to.direction === direction_1.Direction.Right ||
                (to.direction === direction_1.Direction.Up && from.y < to.y) ||
                (to.direction === direction_1.Direction.Bottom && from.y > to.y)) {
                return [new point_1.Point(to.x, from.y)];
            }
            return [new point_1.Point(from.x, to.y)];
        }
        // The to point is on the left.
    }
    else {
        if (to.direction === direction_1.Direction.Left) {
            if (from.y < to.y) {
                return getVerticalPoints(from, to);
            }
            else {
                var pts = getVerticalPoints(to, from);
                return [pts[1], pts[0]];
            }
        }
        else {
            return [new point_1.Point(from.x, to.y)];
        }
    }
}
function getHorizontalPoints(left, right) {
    var x = left.x + (right.x - left.x) / 2;
    return [new point_1.Point(x, left.y), new point_1.Point(x, right.y)];
}
function getVerticalPoints(up, bottom) {
    var y = up.y + (bottom.y - up.y) / 2;
    return [new point_1.Point(up.x, y), new point_1.Point(bottom.x, y)];
}
