"use strict";
exports.__esModule = true;
exports.Layer = void 0;
var Layer = /** @class */ (function () {
    function Layer(TID) {
        this.TID = TID;
    }
    Layer.prototype.generateStoreKey = function (key) {
        return this.TID + "-" + key;
    };
    return Layer;
}());
exports.Layer = Layer;
