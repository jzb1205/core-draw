"use strict";
exports.__esModule = true;
exports.pointCell = void 0;
var core_symbol_1 = require("core-symbol");
var elesymbol = require('./elesymbol.json');
function pointCell(ctx, node) {
    var size = node.symbolSize || 1;
    var w = node.rect.width;
    var h = node.rect.height;
    var x = node.rect.x + w / 2 || 0;
    var y = node.rect.y + h / 2 || 0;
    var symbolStyle = {
        symbolid: node.realSymbolId,
        symbolsize: size,
        symbolcolor: node.fillStyle,
        color: node.fillStyle,
        angle: node.rotate,
        scale: size * node.scaleNum / node.fontScale,
        opacity: 1
    };
    var cellParams = elesymbol[node.realSymbolId];
    if (!cellParams) {
        return;
    }
    var symbol = new core_symbol_1["default"](cellParams);
    symbol.draw(ctx, { x: x, y: y }, cellParams, symbolStyle);
}
exports.pointCell = pointCell;
