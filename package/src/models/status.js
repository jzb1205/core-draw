"use strict";
exports.__esModule = true;
exports.AnchorMode = exports.Lock = void 0;
var Lock;
(function (Lock) {
    Lock[Lock["None"] = 0] = "None";
    Lock[Lock["Readonly"] = 1] = "Readonly";
    Lock[Lock["NoEvent"] = 2] = "NoEvent";
})(Lock = exports.Lock || (exports.Lock = {}));
var AnchorMode;
(function (AnchorMode) {
    AnchorMode[AnchorMode["Default"] = 0] = "Default";
    AnchorMode[AnchorMode["In"] = 1] = "In";
    AnchorMode[AnchorMode["Out"] = 2] = "Out";
})(AnchorMode = exports.AnchorMode || (exports.AnchorMode = {}));
