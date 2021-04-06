"use strict";
exports.__esModule = true;
exports.s8 = exports.s4 = void 0;
function s4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
exports.s4 = s4;
function s8() {
    return s4() + s4();
}
exports.s8 = s8;
