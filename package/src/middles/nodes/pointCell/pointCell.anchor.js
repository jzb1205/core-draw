"use strict";
exports.__esModule = true;
exports.pointCellAnchors = void 0;
var point_1 = require("../../../models/point");
var direction_1 = require("../../../models/direction");
function pointCellAnchors(node, ctx) {
    var x = node.rect.x || 0;
    var y = node.rect.y || 0;
    var w = node.rect.width;
    var h = node.rect.height;
    if (node.anchorCoordinate) {
        node.anchorCoordinate.map(function (it) {
            switch (it.direction) {
                case "Up":
                    node.anchors.push(new point_1.Point(x + w * it.x, y + h * it.y, direction_1.Direction.Up));
                    break;
                case "Bottom":
                    node.anchors.push(new point_1.Point(x + w * it.x, y + h * it.y, direction_1.Direction.Bottom));
                    break;
                case "Left":
                    node.anchors.push(new point_1.Point(x + w * it.x, y + h * it.y, direction_1.Direction.Left));
                    break;
                case "Right":
                    node.anchors.push(new point_1.Point(x + w * it.x, y + h * it.y, direction_1.Direction.Right));
                    break;
                default:
                    node.anchors.push(new point_1.Point(x + w * it.x, y + h * it.y, direction_1.Direction.None));
                    break;
            }
        });
    }
}
exports.pointCellAnchors = pointCellAnchors;
