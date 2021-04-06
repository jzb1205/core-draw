"use strict";
exports.__esModule = true;
exports.getRect = void 0;
var node_1 = require("../models/node");
var line_1 = require("../models/line");
var curve_1 = require("../middles/lines/curve");
var rect_1 = require("../models/rect");
function getRect(pens, rectScale) {
    if (rectScale === void 0) { rectScale = 5; }
    var x1 = 99999;
    var y1 = 99999;
    var x2 = -99999;
    var y2 = -99999;
    var points = [];
    for (var _i = 0, pens_1 = pens; _i < pens_1.length; _i++) {
        var item = pens_1[_i];
        if (item instanceof node_1.Node) {
            var pts = item.rect.toPoints();
            if (item.rotate) {
                for (var _a = 0, pts_1 = pts; _a < pts_1.length; _a++) {
                    var pt = pts_1[_a];
                    pt.rotate(item.rotate, item.rect.center);
                }
            }
            points.push.apply(points, pts);
        }
        else if (item instanceof line_1.Line) {
            points.push(item.from);
            points.push(item.to);
            if (item.psrType) {
                for (var i = 0; i < item.controlPoints.length; i++) {
                    points.push(item.controlPoints[i]);
                }
            }
            if (item.name === 'curve') {
                for (var i = 0.01; i < 1; i += 0.02) {
                    points.push(curve_1.getBezierPoint(i, item.from, item.controlPoints[0], item.controlPoints[1], item.to));
                }
            }
        }
    }
    for (var _b = 0, points_1 = points; _b < points_1.length; _b++) {
        var item = points_1[_b];
        if (x1 > item.x) {
            x1 = item.x;
        }
        if (y1 > item.y) {
            y1 = item.y;
        }
        if (x2 < item.x) {
            x2 = item.x;
        }
        if (y2 < item.y) {
            y2 = item.y;
        }
    }
    rectScale = 0;
    return new rect_1.Rect(x1 - rectScale, y1 - rectScale, x2 - x1 + rectScale, y2 - y1 + rectScale);
}
exports.getRect = getRect;
