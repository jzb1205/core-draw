"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Offscreen = void 0;
var index_1 = require("./store/index");
var canvas_1 = require("./canvas");
var Offscreen = /** @class */ (function (_super) {
    __extends(Offscreen, _super);
    function Offscreen(parentElem, options, TID) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, parentElem, options, TID) || this;
        _this.parentElem = parentElem;
        _this.options = options;
        _this.activeLayer = index_1.Store.get(_this.generateStoreKey('LT:ActiveLayer'));
        _this.hoverLayer = index_1.Store.get(_this.generateStoreKey('LT:HoverLayer'));
        _this.animateLayer = index_1.Store.get(_this.generateStoreKey('LT:AnimateLayer'));
        index_1.Store.set(_this.generateStoreKey('LT:offscreen'), _this.canvas);
        return _this;
    }
    Offscreen.prototype.render = function () {
        // console.log('offscreenoffscreenoffscreenoffscreenoffscreen')
        _super.prototype.render.call(this);
        var ctx = this.canvas.getContext('2d');
        ctx.strokeStyle = this.options.color;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (!item.getTID()) {
                item.setTID(this.TID);
            }
            // if (item.xCP && item.type === 0) {
            //   item.rect.ex = item.anchors && item.anchors[0].y
            //   item.rect.y = item.anchors && item.anchors[0].y
            //   item.rect.height = 4
            // }
            item.render(ctx);
        }
        this.activeLayer.render(ctx);
        // this.animateLayer.render(ctx);
        this.hoverLayer.render(ctx);
    };
    return Offscreen;
}(canvas_1.Canvas));
exports.Offscreen = Offscreen;
