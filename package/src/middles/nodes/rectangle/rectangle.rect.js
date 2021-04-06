"use strict";
exports.__esModule = true;
exports.rectangleTextRect = exports.rectangleIconRect = void 0;
var rect_1 = require("../../../models/rect");
function rectangleIconRect(node) {
    node.iconRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.height - node.paddingTopNum - node.paddingBottomNum, node.rect.height - node.paddingTopNum - node.paddingBottomNum);
    node.fullIconRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum, node.rect.height - node.paddingTopNum - node.paddingBottomNum);
}
exports.rectangleIconRect = rectangleIconRect;
function rectangleTextRect(node) {
    // debugger
    var height = node.rect.height - node.paddingTopNum - node.paddingBottomNum;
    node.textRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum + height, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum - height, height);
    node.fullTextRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum, height);
}
exports.rectangleTextRect = rectangleTextRect;
