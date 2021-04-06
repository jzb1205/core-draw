"use strict";
exports.__esModule = true;
exports.lineAnchors = void 0;
var point_1 = require("../../../models/point");
var direction_1 = require("../../../models/direction");
function lineAnchors(node) {
    var y = node.rect.center.y;
    // node.anchors.push(new Point(node.rect.x, y, Direction.Left));
    // node.anchors.push(new Point(node.rect.x + node.rect.width, y, Direction.Right));
    for (var i = node.rect.x; i < node.rect.ex; i += 1) {
        var pt = new point_1.Point(i, y, direction_1.Direction.Bottom);
        pt.hidden = true;
        node.anchors.push(pt);
    }
}
exports.lineAnchors = lineAnchors;
