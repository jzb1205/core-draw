"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.RenderLayer = void 0;
var index_1 = require("./store/index");
var canvas_1 = require("./canvas");
var RenderLayer = /** @class */ (function (_super) {
    __extends(RenderLayer, _super);
    function RenderLayer(parentElem, options, TID) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, parentElem, options, TID) || this;
        _this.parentElem = parentElem;
        _this.options = options;
        _this.render = function () {
            // console.log('renderLayerrenderLayerrenderLayerre')
            var ctx = _this.canvas.getContext('2d');
            // if (this.data.bkImage && !this.bkImgRect) {
            //   this.loadBkImg(this.render);
            //   return;
            // }
            // if (!this.width || !this.height || !this.offscreen) {
            //   return;
            // }
            ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            // if (this.data.bkColor) {
            //   ctx.fillStyle = this.data.bkColor;
            //   ctx.fillRect(0, 0, this.width, this.height);
            // }
            // if (this.bkImg && this.bkImgRect) {
            //   ctx.drawImage(this.bkImg, this.bkImgRect.x, this.bkImgRect.y, this.bkImgRect.width,
            //     this.bkImgRect.height, 0, 0, this.width, this.height);
            // }
            ctx.drawImage(_this.offscreen, 0, 0, _this.width, _this.height);
        };
        _this.offscreen = index_1.Store.get(_this.generateStoreKey('LT:offscreen'));
        _this.parentElem.appendChild(_this.canvas);
        _this.ctx = _this.canvas.getContext('2d');
        return _this;
    }
    RenderLayer.prototype.loadBkImg = function (cb) {
        var _this = this;
        if (!this.data.bkImage) {
            return;
        }
        this.bkImg = new Image();
        this.bkImg.crossOrigin = 'anonymous';
        this.bkImg.src = this.data.bkImage;
        this.bkImg.onload = function () {
            _this.bkImgRect = _this.coverRect(_this.canvas.width, _this.canvas.height, _this.bkImg.width, _this.bkImg.height);
            if (cb) {
                cb();
            }
        };
    };
    RenderLayer.prototype.clearBkImg = function () {
        this.bkImgRect = null;
    };
    RenderLayer.prototype.coverRect = function (canvasWidth, canvasHeight, imgWidth, imgHeight) {
        var x = 0;
        var y = 0;
        var width = imgWidth;
        var height = imgHeight;
        if (imgWidth > imgHeight || (imgWidth === imgHeight && canvasWidth < canvasHeight)) {
            width = canvasWidth * height / canvasHeight;
            x = (imgWidth - width) / 2;
        }
        else if (imgWidth < imgHeight || (imgWidth === imgHeight && canvasWidth > canvasHeight)) {
            height = canvasHeight * width / canvasWidth;
            y = (imgHeight - height) / 2;
        }
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    };
    return RenderLayer;
}(canvas_1.Canvas));
exports.RenderLayer = RenderLayer;
