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
exports.HoverLayer = void 0;
var point_1 = require("./models/point");
var node_1 = require("./models/node");
var index_1 = require("./store/index");
var status_1 = require("./models/status");
var layer_1 = require("./layer");
var HoverLayer = /** @class */ (function (_super) {
    __extends(HoverLayer, _super);
    function HoverLayer(options, TID) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, TID) || this;
        _this.options = options;
        _this.anchorRadius = 6;
        _this.hoverAnchorIndex = -1;
        _this.dockLineX = 0;
        _this.dockLineY = 0;
        _this.data = index_1.Store.get(_this.generateStoreKey('topology-data'));
        index_1.Store.set(_this.generateStoreKey('LT:HoverLayer'), _this);
        return _this;
    }
    HoverLayer.prototype.lineTo = function (to, toArrow) {
        if (toArrow === void 0) { toArrow = 'none'; }
        if (!this.line || this.line.locked) {
            return;
        }
        this.line.setTo(to, toArrow);
        if (this.line.from.id || this.line.to.id) {
            this.line.calcControlPoints();
        }
        index_1.Store.set(this.generateStoreKey('pts-') + this.line.id, null);
        index_1.Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
    };
    HoverLayer.prototype.lineFrom = function (from) {
        if (this.line.locked) {
            return;
        }
        this.line.setFrom(from, this.line.fromArrow);
        if (this.line.from.id || this.line.to.id) {
            this.line.calcControlPoints();
        }
        index_1.Store.set(this.generateStoreKey('pts-') + this.line.id, null);
        index_1.Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
    };
    HoverLayer.prototype.lineMove = function (pt, initPos) {
        if (this.line.locked) {
            return;
        }
        var x = pt.x - initPos.x;
        var y = pt.y - initPos.y;
        this.line.setTo(new point_1.Point(this.initLine.to.x + x, this.initLine.to.y + y), this.line.toArrow);
        this.line.setFrom(new point_1.Point(this.initLine.from.x + x, this.initLine.from.y + y), this.line.fromArrow);
        for (var i = 0; i < this.initLine.controlPoints.length; ++i) {
            this.line.controlPoints[i].x = this.initLine.controlPoints[i].x + x;
            this.line.controlPoints[i].y = this.initLine.controlPoints[i].y + y;
        }
        index_1.Store.set(this.generateStoreKey('pts-') + this.line.id, null);
        index_1.Store.set(this.generateStoreKey('LT:updateLines'), [this.line]);
    };
    HoverLayer.prototype.render = function (ctx) {
        if (this.data.locked === status_1.Lock.NoEvent) {
            return;
        }
        ctx.save();
        ctx.strokeStyle = this.options.hoverColor;
        ctx.fillStyle = '#fff';
        // anchors
        if (this.node && !this.data.locked) {
            if (!this.node.getTID()) {
                this.node.setTID(this.TID);
            }
            this.root = this.getRoot(this.node) || this.node;
            if (this.root) {
                ctx.save();
                ctx.strokeStyle = this.options.dragColor;
                ctx.globalAlpha = 0;
                if (this.root.rotate) {
                    ctx.translate(this.root.rect.center.x, this.root.rect.center.y);
                    ctx.rotate(((this.root.rotate + this.root.offsetRotate) * Math.PI) / 180);
                    ctx.translate(-this.root.rect.center.x, -this.root.rect.center.y);
                }
                ctx.beginPath();
                ctx.strokeRect(this.root.rect.x, this.root.rect.y, this.root.rect.width, this.root.rect.height);
                ctx.restore();
            }
            if (!this.options.hideAnchor && this.node.name !== 'text') {
                for (var i = 0; i < this.node.rotatedAnchors.length; ++i) {
                    if (this.node.locked || this.node.hideAnchor || (this.node.rotatedAnchors[i].hidden && this.hoverAnchorIndex !== i)) {
                        continue;
                    }
                    ctx.beginPath();
                    ctx.arc(this.node.rotatedAnchors[i].x, this.node.rotatedAnchors[i].y, this.anchorRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        ctx.fillStyle = this.options.hoverColor;
        if (this.dockAnchor) {
            ctx.beginPath();
            ctx.arc(this.dockAnchor.x, this.dockAnchor.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.hoverLineCP) {
            ctx.beginPath();
            ctx.arc(this.hoverLineCP.x, this.hoverLineCP.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = this.options.hoverColor + '80';
        ctx.lineWidth = 1;
        if (this.dockLineX > 0) {
            var size = index_1.Store.get(this.generateStoreKey('LT:size'));
            ctx.beginPath();
            ctx.moveTo(this.dockLineX, 0);
            ctx.lineTo(this.dockLineX, size.height);
            ctx.stroke();
        }
        if (this.dockLineY > 0) {
            var size = index_1.Store.get(this.generateStoreKey('LT:size'));
            // console.log('Store',Store,this.data)
            ctx.beginPath();
            ctx.moveTo(0, this.dockLineY);
            ctx.lineTo(size.width, this.dockLineY);
            ctx.stroke();
        }
        // Select nodes by drag.
        if (this.dragRect) {
            ctx.fillStyle = this.options.dragColor;
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.strokeRect(this.dragRect.x, this.dragRect.y, this.dragRect.width, this.dragRect.height);
            ctx.fillRect(this.dragRect.x, this.dragRect.y, this.dragRect.width, this.dragRect.height);
        }
        ctx.restore();
    };
    HoverLayer.prototype.getRoot = function (node) {
        if (!node.parentId) {
            return null;
        }
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof node_1.Node && item.id === node.parentId) {
                var n = this.getRoot(item);
                return n ? n : item;
            }
        }
        return null;
    };
    HoverLayer.prototype.clear = function () {
        this.node = null;
        this.line = null;
    };
    return HoverLayer;
}(layer_1.Layer));
exports.HoverLayer = HoverLayer;
