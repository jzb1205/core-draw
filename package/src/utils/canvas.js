"use strict";
exports.__esModule = true;
exports.curveLen = exports.lineLen = exports.pointInLine = exports.find = exports.pointInRect = void 0;
var point_1 = require("../models/point");
function pointInRect(point, vertices) {
    if (vertices.length < 3) {
        return false;
    }
    var isIn = false;
    var last = vertices[vertices.length - 1];
    for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
        var item = vertices_1[_i];
        if ((item.y < point.y && last.y >= point.y) || (item.y >= point.y && last.y < point.y)) {
            if (item.x + ((point.y - item.y) * (last.x - item.x)) / (last.y - item.y) > point.x) {
                isIn = !isIn;
            }
        }
        last = item;
    }
    return isIn;
}
exports.pointInRect = pointInRect;
function find(idOrTag, pens) {
    var result = [];
    pens.forEach(function (item) {
        if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
            result.push(item);
        }
        if (item.children) {
            var children = find(idOrTag, item.children);
            if (children && children.length > 1) {
                result.push.apply(result, children);
            }
            else if (children) {
                result.push(children);
            }
        }
    });
    if (result.length === 0) {
        return;
    }
    else if (result.length === 1) {
        return result[0];
    }
    return result;
}
exports.find = find;
function pointInLine(point, from, to) {
    var points = [
        new point_1.Point(from.x - 8, from.y - 8),
        new point_1.Point(to.x - 8, to.y - 8),
        new point_1.Point(to.x + 8, to.y + 8),
        new point_1.Point(from.x + 8, from.y + 8)
    ];
    return pointInRect(point, points);
}
exports.pointInLine = pointInLine;
function lineLen(from, to) {
    var len = Math.sqrt(Math.pow(Math.abs(from.x - to.x), 2) + Math.pow(Math.abs(from.y - to.y), 2));
    return len | 0;
}
exports.lineLen = lineLen;
function curveLen(from, cp1, cp2, to) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', "M" + from.x + " " + from.y + " C" + cp1.x + " " + cp1.y + " " + cp2.x + " " + cp2.y + " " + to.x + " " + to.y);
    return path.getTotalLength() | 0;
}
exports.curveLen = curveLen;
