"use strict";
exports.__esModule = true;
exports.defaultAnchors = void 0;
var point_1 = require("../models/point");
var direction_1 = require("../models/direction");
function defaultAnchors(node) {
    if (['combine'].includes(node.name)) {
        return;
    }
    node.anchors.push(new point_1.Point(node.rect.x, node.rect.y + node.rect.height / 2, direction_1.Direction.Left));
    node.anchors.push(new point_1.Point(node.rect.x + node.rect.width / 2, node.rect.y, direction_1.Direction.Up));
    node.anchors.push(new point_1.Point(node.rect.x + node.rect.width, node.rect.y + node.rect.height / 2, direction_1.Direction.Right));
    node.anchors.push(new point_1.Point(node.rect.x + node.rect.width / 2, node.rect.y + node.rect.height, direction_1.Direction.Bottom));
}
exports.defaultAnchors = defaultAnchors;
