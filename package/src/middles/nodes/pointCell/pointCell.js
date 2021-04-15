"use strict";
exports.__esModule = true;
exports.pointCell = void 0;
// import PointSymbol from 'core-symbol'
var index_1 = require("./../../../../../../core-symbol/package/index"); //本地测试
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
    if (!window.drawSymbol) {
        window.drawSymbol = new index_1["default"]();
    }
    var symbol = window.drawSymbol;
    symbol.draw(ctx, { x: x, y: y }, symbolStyle);
}
exports.pointCell = pointCell;
