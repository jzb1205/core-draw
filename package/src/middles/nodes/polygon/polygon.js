"use strict";
exports.__esModule = true;
exports.polygon = void 0;
function polygon(ctx, node) {
    // ctx.beginPath();
    ctx.moveTo(node.rect.x, node.rect.y);
    ctx.lineTo(node.rect.x + node.rect.width, node.rect.y);
    ctx.lineTo(node.rect.x + node.rect.width, node.rect.y + node.rect.height);
    ctx.lineTo(node.rect.x, node.rect.y + node.rect.height);
    // ctx.closePath();
    ctx.strokeStyle = node.strokeStyle || '#333';
    ctx.stroke();
}
exports.polygon = polygon;
