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
exports.AnimateLayer = void 0;
var index_1 = require("./store/index");
var pen_1 = require("./models/pen");
var node_1 = require("./models/node");
var line_1 = require("./models/line");
var layer_1 = require("./layer");
var AnimateLayer = /** @class */ (function (_super) {
    __extends(AnimateLayer, _super);
    function AnimateLayer(options, TID) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, TID) || this;
        _this.options = options;
        _this.pens = new Map();
        _this.readyPens = new Map();
        _this.lastNow = 0;
        _this.data = index_1.Store.get(_this.generateStoreKey('topology-data'));
        index_1.Store.set(_this.generateStoreKey('LT:AnimateLayer'), _this);
        if (!_this.options.animateColor) {
            _this.options.animateColor = '#ff6600';
        }
        _this.subscribeUpdate = index_1.Store.subscribe(_this.generateStoreKey('LT:updateLines'), function (lines) {
            _this.updateLines(lines);
        });
        _this.subscribePlay = index_1.Store.subscribe(_this.generateStoreKey('LT:AnimatePlay'), function (params) {
            _this.readyPlay(params.tag, false);
            _this.animate();
        });
        return _this;
    }
    AnimateLayer.prototype.getAnimateLine = function (item) {
        var l = new line_1.Line(item);
        l.setTID(this.TID);
        l.isAnimate = true;
        l.toArrow = '';
        if (l.fromArrow && l.fromArrow.indexOf('line') < 0) {
            l.animateFromSize = l.fromArrowSize + l.lineWidth * 5;
        }
        if (l.toArrow && l.toArrow.indexOf('line') < 0) {
            l.animateToSize = l.toArrowSize + l.lineWidth * 5;
        }
        l.animateStart = item.animateStart;
        l.lineCap = 'round';
        l.fillStyle = '#fff';
        l.strokeStyle = l.animateColor || this.options.animateColor;
        l.length = l.getLen();
        if (!l.fromArrowColor) {
            l.fromArrowColor = l.strokeStyle || '#222';
        }
        if (!l.toArrowColor) {
            l.toArrowColor = l.strokeStyle || '#222';
        }
        return l;
    };
    AnimateLayer.prototype.find = function (pen) {
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.id === pen.id) {
                return item;
            }
        }
    };
    AnimateLayer.prototype.readyPlay = function (tag, auto, pens) {
        var _this = this;
        this.readyPens.clear();
        if (!pens) {
            pens = this.data.pens;
        }
        pens.forEach(function (pen) {
            pen.setTID(_this.TID);
            if (!pen.visible || _this.readyPens.get(pen.id)) {
                return;
            }
            if (_this.pens.get(pen.id)) {
                if (!pen.animateStart || pen.animateStart < 1) {
                    _this.pens["delete"](pen.id);
                }
                return;
            }
            if ((auto && pen.animatePlay) || (tag && pen.tags.indexOf(tag) > -1)) {
                if (!pen.animateStart || pen.animateStart < 1) {
                    pen.animateStart = Date.now();
                }
            }
            if (!pen.animateStart || pen.animateStart < 1) {
                return;
            }
            if (pen instanceof node_1.Node) {
                pen.initAnimateProps();
                _this.readyPens.set(pen.id, pen);
                if ((tag || auto) && pen.children && pen.children.length) {
                    _this.readyPlay(tag, auto, pen.children);
                }
            }
            else {
                _this.readyPens.set(pen.id, _this.getAnimateLine(pen));
            }
        });
    };
    AnimateLayer.prototype.animate = function () {
        var _this = this;
        if (this.timer) {
            cancelAnimationFrame(this.timer);
        }
        this.readyPens.forEach(function (pen, key) {
            _this.readyPens["delete"](key);
            _this.pens.set(key, pen);
        });
        this.timer = requestAnimationFrame(function () {
            var now = Date.now();
            if (now - _this.lastNow < 30) {
                _this.animate();
                return;
            }
            _this.lastNow = now;
            var animated = false;
            _this.pens.forEach(function (pen, key) {
                if (pen.animateStart < 1) {
                    _this.pens["delete"](key);
                    return;
                }
                if (pen.animateStart > now) {
                    return;
                }
                var next = pen.animate(now);
                if (pen.animateStart < 1) {
                    _this.pens["delete"](key);
                    if (pen.type === pen_1.PenType.Line) {
                        var line = _this.find(pen);
                        line && (line.animateStart = 0);
                    }
                    if (next) {
                        _this.readyPlay(next, false);
                    }
                }
                animated = true;
            });
            if (animated) {
                index_1.Store.set(_this.generateStoreKey('LT:render'), true);
                _this.animate();
            }
        });
    };
    AnimateLayer.prototype.updateLines = function (lines) {
        this.pens.forEach(function (line, key) {
            if (!(line instanceof line_1.Line)) {
                return;
            }
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var item = lines_1[_i];
                if (line.id === item.id) {
                    line.from = item.from;
                    line.to = item.to;
                    line.controlPoints = item.controlPoints;
                    line.length = line.getLen();
                }
            }
        });
    };
    AnimateLayer.prototype.render = function (ctx) {
        var _this = this;
        console.log('animateLayer');
        this.pens.forEach(function (line, key) {
            if (line.visible && line instanceof line_1.Line) {
                if (!line.getTID()) {
                    line.setTID(_this.TID);
                }
                line.render(ctx);
            }
        });
    };
    AnimateLayer.prototype.stop = function () {
        this.readyPens.clear();
        this.pens.clear();
        if (this.timer) {
            cancelAnimationFrame(this.timer);
        }
    };
    AnimateLayer.prototype.destroy = function () {
        this.stop();
        this.subscribeUpdate.unsubscribe();
        this.subscribePlay.unsubscribe();
    };
    return AnimateLayer;
}(layer_1.Layer));
exports.AnimateLayer = AnimateLayer;
