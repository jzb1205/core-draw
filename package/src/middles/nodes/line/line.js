"use strict";
exports.__esModule = true;
exports.line = void 0;
function line(ctx, node) {
    ctx.beginPath();
    ctx.strokeStyle = node.fillStyle;
    ctx.lineWidth = 4;
    // node.rect.height = 4
    var y = node.rect.y + node.rect.height / 2;
    ctx.moveTo(node.rect.x, y);
    ctx.lineTo(node.rect.x + node.rect.width, y);
    ctx.stroke();
}
exports.line = line;
