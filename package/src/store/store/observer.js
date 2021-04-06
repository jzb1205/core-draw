"use strict";
exports.__esModule = true;
exports.Observer = void 0;
var data_1 = require("./data");
var Observer = /** @class */ (function () {
    function Observer(id, key, fn) {
        this.key = '';
        this.id = id;
        this.key = key;
        this.fn = fn;
    }
    Observer.prototype.unsubscribe = function () {
        delete data_1.observers[this.id];
    };
    return Observer;
}());
exports.Observer = Observer;
