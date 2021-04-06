"use strict";
exports.__esModule = true;
exports.polygonTextRect = exports.polygonIconRect = void 0;
var rect_1 = require("../../../models/rect");
function polygonIconRect(node) {
    node.iconRect = new rect_1.Rect(0, 0, 0, 0);
}
exports.polygonIconRect = polygonIconRect;
function polygonTextRect(node) {
    node.fullTextRect = new rect_1.Rect(node.rect.x + 10, node.rect.y + node.rect.height / 2 - 20, node.rect.width - 20, 20);
    node.textRect = node.fullTextRect;
}
exports.polygonTextRect = polygonTextRect;
