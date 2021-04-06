"use strict";
exports.__esModule = true;
exports.defaultTextRect = exports.defaultIconRect = void 0;
var rect_1 = require("../models/rect");
function defaultIconRect(node) {
    node.iconRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum, (node.rect.height * 3) / 4 - node.paddingTopNum - node.paddingBottomNum);
    node.fullIconRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum, node.rect.height - node.paddingTopNum - node.paddingBottomNum);
}
exports.defaultIconRect = defaultIconRect;
function defaultTextRect(node) {
    var height = node.rect.height - node.paddingTopNum - node.paddingBottomNum;
    node.textRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum + (height * 3) / 4, node.rect.width - node.paddingLeftNum - node.paddingRightNum, height / 4);
    node.fullTextRect = new rect_1.Rect(node.rect.x + node.paddingLeftNum, node.rect.y + node.paddingTopNum, node.rect.width - node.paddingLeftNum - node.paddingRightNum, height);
}
exports.defaultTextRect = defaultTextRect;
