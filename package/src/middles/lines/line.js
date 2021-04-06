"use strict";
exports.__esModule = true;
exports.calcLineControlPoints = exports.lineControlPoints = exports.line = void 0;
function line(ctx, l) {
    ctx.beginPath();
    ctx.moveTo(l.from.x, l.from.y);
    ctx.lineTo(l.to.x, l.to.y);
    ctx.stroke();
}
exports.line = line;
function lineControlPoints(ctx, l) { }
exports.lineControlPoints = lineControlPoints;
function calcLineControlPoints(l) {
    l.controlPoints = [];
}
exports.calcLineControlPoints = calcLineControlPoints;
