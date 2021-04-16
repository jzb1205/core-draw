"use strict";
exports.__esModule = true;
exports.pointCell = void 0;
var core_symbol_1 = require("core-symbol"); //第三方包
// import { PointSymbol } from '../../../../../../core-symbol/package/index'  //本地测试 原代码
// import { PointSymbol } from '../../../../../../core-symbol/lib/pointSymbol'  //本地测试 打包代码
function pointCell(ctx, node) {
    var size = node.symbolSize || 1;
    var w = node.rect.width;
    var h = node.rect.height;
    var x = node.rect.x + w / 2 || 0;
    var y = node.rect.y + h / 2 || 0;
    var symbolStyle = {
        symbolid: node.realSymbolId,
        symbolsize: size * node.scaleNum / node.fontScale,
        symbolcolor: node.fillStyle,
        angle: node.rotate,
        opacity: 1
    };
    if (!window.drawSymbol) {
        window.drawSymbol = new core_symbol_1.PointSymbol();
    }
    var symbol = window.drawSymbol;
    symbol.draw(ctx, { x: x, y: y }, symbolStyle);
}
exports.pointCell = pointCell;
