"use strict";
exports.__esModule = true;
exports.polygonAnchors = void 0;
var point_1 = require("../../../models/point");
var direction_1 = require("../../../models/direction");
function polygonAnchors(node) {
    var y = node.rect.y + node.rect.height / 2;
    node.anchors.push(new point_1.Point(node.rect.x, y, direction_1.Direction.Left));
    node.anchors.push(new point_1.Point(node.rect.x + node.rect.width, y, direction_1.Direction.Right));
    for (var i = node.rect.x + 5; i < node.rect.ex; i += 5) {
        var pt = new point_1.Point(i, y, direction_1.Direction.Bottom);
        pt.hidden = true;
        node.anchors.push(pt);
    }
}
exports.polygonAnchors = polygonAnchors;
