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
exports.Node = exports.images = void 0;
var pen_1 = require("./pen");
var rect_1 = require("./rect");
var point_1 = require("./point");
var line_1 = require("./line");
var middles_1 = require("../middles");
var default_anchor_1 = require("../middles/default.anchor");
var default_rect_1 = require("../middles/default.rect");
var text_1 = require("./../middles/nodes/text/text");
var index_1 = require("./../store/index");
var math_1 = require("../utils/math");
var uuid_1 = require("../utils/uuid");
var options_1 = require("./../options");
exports.images = {};
var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    //电网新增+++++
    function Node(json, noChild) {
        if (noChild === void 0) { noChild = false; }
        var _this = _super.call(this, json) || this;
        _this.is3D = false;
        _this.zRotate = 0;
        _this.imageRatio = true;
        _this.anchors = [];
        _this.rotatedAnchors = [];
        _this.animateDuration = 0;
        _this.animateFrames = [];
        _this.type = pen_1.PenType.Node;
        if (!json.copyPreventRotate) {
            if (['text', 'rectangle', 'polygon'].includes(json.name)) {
                _this.rotate = json.rotate || 0;
            }
            else {
                _this.rotate = json.rotate || json.defaultRotate || 90;
                if (json.rotate == 0) {
                    _this.rotate = 0;
                }
            }
        }
        else {
            _this.rotate = json.rotate || 0;
        }
        if (json.name === 'line') { //把母线用node节点绘制
            _this.symbolId = json.symbolId || 4250010;
            _this.psrType = json.psrType || 311000;
            _this.psrSubType = json.psrSubType || 31100000;
            _this.rotate = json.rotate || 0;
        }
        else {
            _this.symbolId = json.symbolId;
            _this.psrType = json.psrType;
            _this.psrSubType = json.psrSubType;
        }
        // this.cellsBound = json.cellsBound
        _this.scaleNum = json.scaleNum || 1;
        _this.text = json.text;
        _this.anchorCount = json.anchorCount;
        _this.fontScale = json.fontScale;
        _this.fillStyle = json.fillStyle;
        _this.voltage = json.voltage;
        _this.condition = json.condition;
        _this.anchorCoordinate = json.anchorCoordinate;
        _this.coordinatePolygon = json.coordinatePolygon || []; //面类型图元 坐
        _this.realSymbolId = json.realSymbolId;
        _this.symbolSize = json.symbolSize;
        _this.direction = json.direction || 'top';
        _this.label = json.label;
        _this.copyPreventRotate = json.copyPreventRotate || false;
        _this.clickCount = 0;
        _this.xCP = json.xCP || false;
        _this.ssjgName = json.ssjgName;
        _this.is3D = json.is3D;
        _this.z = json.z;
        _this.zRotate = json.zRotate || 0;
        _this.borderRadius = +json.borderRadius || 0;
        if (_this.borderRadius > 1) {
            _this.borderRadius = 1;
        }
        _this.icon = json.icon;
        _this.iconFamily = json.iconFamily;
        _this.iconSize = +json.iconSize;
        _this.iconColor = json.iconColor;
        _this.image = json.image;
        if (json.imgNaturalWidth) {
            _this.imgNaturalWidth = json.imgNaturalWidth;
        }
        if (json.imgNaturalHeight) {
            _this.imgNaturalHeight = json.imgNaturalHeight;
        }
        if (json.imageWidth) {
            _this.imageWidth = json.imageWidth;
        }
        if (json.imageHeight) {
            _this.imageHeight = json.imageHeight;
        }
        _this.imageRatio = json.imageRatio;
        _this.imageAlign = json.imageAlign || 'center';
        _this.bkType = json.bkType;
        _this.gradientFromColor = json.gradientFromColor;
        _this.gradientToColor = json.gradientToColor;
        _this.gradientAngle = json.gradientAngle || 0;
        _this.gradientRadius = json.gradientRadius || 0.01;
        _this.mlMinWidth = json.mlMinWidth || 0;
        _this.paddingTop = json.paddingTop || 0;
        _this.paddingBottom = json.paddingBottom || 0;
        _this.paddingLeft = json.paddingLeft || 0;
        _this.paddingRight = json.paddingRight || 0;
        // 兼容老数据
        if (json.children && json.children[0] && json.children[0].parentRect) {
            _this.paddingLeft = json.children[0].parentRect.offsetX;
            _this.paddingRight = 0;
            _this.paddingTop = json.children[0].parentRect.offsetY;
            _this.paddingBottom = 0;
        }
        if (json.parentRect) {
            _this.rectInParent = {
                x: json.parentRect.x * 100 + '%',
                y: json.parentRect.y * 100 + '%',
                width: json.parentRect.width * 100 + '%',
                height: json.parentRect.height * 100 + '%',
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
                rotate: json.parentRect.rotate
            };
            _this.paddingTop = json.parentRect.marginY;
            _this.paddingBottom = json.parentRect.marginY;
            _this.paddingLeft = json.parentRect.marginX;
            _this.paddingRight = json.parentRect.marginX;
        }
        // 兼容老数据 end
        if (json.animateFrames) {
            _this.animateFrames = json.animateFrames;
            for (var _i = 0, _a = _this.animateFrames; _i < _a.length; _i++) {
                var item = _a[_i];
                if (!item.state.init) {
                    item.state = new Node(item.state, true);
                }
            }
        }
        if (json.animateDuration) {
            _this.animateDuration = json.animateDuration;
        }
        _this.animateType = json.animateType ? json.animateType : json.animateDuration ? 'custom' : '';
        _this.animateAlone = json.animateAlone;
        _this.iframe = json.iframe;
        _this.elementId = json.elementId;
        _this.audio = json.audio;
        _this.video = json.video;
        _this.play = json.play;
        _this.nextPlay = json.nextPlay;
        if (json.elementLoaded !== undefined) {
            _this.elementId = null;
            _this.elementLoaded = false;
        }
        _this.init();
        if (!noChild) {
            _this.setChild(json.children);
        }
        else {
            _this.children = null;
        }
        return _this;
    }
    Node.cloneState = function (json) {
        var n = new Node(json);
        delete n.animateFrames;
        return n;
    };
    Node.prototype.init = function () {
        this.calcAbsPadding();
        // Calc rect of text.
        if (middles_1.textRectFns[this.name]) {
            middles_1.textRectFns[this.name](this);
        }
        else {
            default_rect_1.defaultTextRect(this);
        }
        // Calc rect of icon.
        if (middles_1.iconRectFns[this.name]) {
            middles_1.iconRectFns[this.name](this);
        }
        else {
            default_rect_1.defaultIconRect(this);
        }
        this.calcAnchors();
        this.elementRendered = false;
        this.addToDiv();
    };
    Node.prototype.addToDiv = function () {
        if (this.audio || this.video || this.iframe || this.elementId || this.hasGif()) {
            index_1.Store.set(this.generateStoreKey('LT:addDiv'), this);
        }
    };
    Node.prototype.hasGif = function () {
        if (this.gif) {
            return true;
        }
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.type === pen_1.PenType.Node && item.hasGif()) {
                    return true;
                }
            }
        }
        return false;
    };
    Node.prototype.calcAbsPadding = function () {
        this.paddingLeftNum = math_1.abs(this.rect.width, this.paddingLeft);
        this.paddingRightNum = math_1.abs(this.rect.width, this.paddingRight);
        this.paddingTopNum = math_1.abs(this.rect.height, this.paddingTop);
        this.paddingBottomNum = math_1.abs(this.rect.height, this.paddingBottom);
    };
    Node.prototype.setChild = function (children) {
        if (!children) {
            return;
        }
        this.children = [];
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var item = children_1[_i];
            var child = void 0;
            switch (item.type) {
                case pen_1.PenType.Line:
                    child = new line_1.Line(item);
                    child.calcRectByParent(this);
                    break;
                default:
                    child = new Node(item);
                    child.parentId = this.id;
                    child.calcRectByParent(this);
                    child.init();
                    child.setChild(item.children);
                    break;
            }
            child.id = item.id || uuid_1.s8();
            this.children.push(child);
        }
    };
    Node.prototype.draw = function (ctx) {
        if (!middles_1.drawNodeFns[this.name]) {
            return;
        }
        // DrawBk
        // switch (this.bkType) {
        //   case 1:
        //     this.drawBkLinearGradient(ctx);
        //     break;
        //   case 2:
        //     this.drawBkRadialGradient(ctx);
        //     break;
        // }
        // Draw shape.
        middles_1.drawNodeFns[this.name](ctx, this);
        // Draw text.
        if (this.name === 'text' && this.text) {
            text_1.text(ctx, this);
        }
        // Draw image.
        // if (this.image) {
        //   this.drawImg(ctx);
        //   return;
        // }
        // Draw icon
        // if (this.icon) {
        //   ctx.save();
        //   ctx.shadowColor = '';
        //   ctx.shadowBlur = 0;
        //   iconfont(ctx, this);
        //   ctx.restore();
        // }
    };
    Node.prototype.drawBkLinearGradient = function (ctx) {
        var from = new point_1.Point(this.rect.x, this.rect.center.y);
        var to = new point_1.Point(this.rect.ex, this.rect.center.y);
        if (this.gradientAngle % 90 === 0 && this.gradientAngle % 180) {
            if (this.gradientAngle % 270) {
                from.x = this.rect.center.x;
                from.y = this.rect.y;
                to.x = this.rect.center.x;
                to.y = this.rect.ey;
            }
            else {
                from.x = this.rect.center.x;
                from.y = this.rect.ey;
                to.x = this.rect.center.x;
                to.y = this.rect.y;
            }
        }
        else if (this.gradientAngle) {
            from.rotate(this.gradientAngle, this.rect.center);
            to.rotate(this.gradientAngle, this.rect.center);
        }
        // contributor: https://github.com/sunnyguohua/topology
        var grd = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        grd.addColorStop(0, this.gradientFromColor);
        grd.addColorStop(1, this.gradientToColor);
        ctx.fillStyle = grd;
    };
    Node.prototype.drawBkRadialGradient = function (ctx) {
        var r = this.rect.width;
        if (r < this.rect.height) {
            r = this.rect.height;
        }
        r *= 0.5;
        var grd = ctx.createRadialGradient(this.rect.center.x, this.rect.center.y, r * this.gradientRadius, this.rect.center.x, this.rect.center.y, r);
        grd.addColorStop(0, this.gradientFromColor);
        grd.addColorStop(1, this.gradientToColor);
        ctx.fillStyle = grd;
    };
    Node.prototype.drawImg = function (ctx) {
        var _this = this;
        if (this.lastImage !== this.image) {
            this.img = null;
        }
        if (this.img) {
            ctx.save();
            ctx.shadowColor = '';
            ctx.shadowBlur = 0;
            var rect = this.getIconRect();
            var x = rect.x;
            var y = rect.y;
            var w = rect.width;
            var h = rect.height;
            if (this.imageWidth) {
                w = this.imageWidth;
            }
            if (this.imageHeight) {
                h = this.imageHeight;
            }
            if (this.imageRatio) {
                if (this.imageWidth) {
                    h = (this.imgNaturalHeight / this.imgNaturalWidth) * w;
                }
                else {
                    w = (this.imgNaturalWidth / this.imgNaturalHeight) * h;
                }
            }
            if (this.name !== 'image') {
                x += (rect.width - w) / 2;
                y += (rect.height - h) / 2;
            }
            switch (this.imageAlign) {
                case 'top':
                    y = rect.y;
                    break;
                case 'bottom':
                    y = rect.ey - h;
                    break;
                case 'left':
                    x = rect.x;
                    break;
                case 'right':
                    x = rect.ex - w;
                    break;
                case 'left-top':
                    x = rect.x;
                    y = rect.y;
                    break;
                case 'right-top':
                    x = rect.ex - w;
                    y = rect.y;
                    break;
                case 'left-bottom':
                    x = rect.x;
                    y = rect.ey - h;
                    break;
                case 'right-bottom':
                    x = rect.ex - w;
                    y = rect.ey - h;
                    break;
            }
            ctx.drawImage(this.img, x, y, w, h);
            ctx.restore();
            return;
        }
        var gif = this.image.indexOf('.gif') > 0;
        // Load image and draw it.
        if (!gif && exports.images[this.image]) {
            this.img = exports.images[this.image].img;
            ++exports.images[this.image].cnt;
            this.lastImage = this.image;
            this.imgNaturalWidth = this.img.naturalWidth;
            this.imgNaturalHeight = this.img.naturalHeight;
            this.drawImg(ctx);
            return;
        }
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = this.image;
        img.onload = function () {
            _this.lastImage = _this.image;
            _this.imgNaturalWidth = img.naturalWidth;
            _this.imgNaturalHeight = img.naturalHeight;
            _this.img = img;
            exports.images[_this.image] = {
                img: img,
                cnt: 1
            };
            index_1.Store.set(_this.generateStoreKey('LT:imageLoaded'), true);
            if (!_this.gif && gif) {
                _this.gif = true;
                index_1.Store.set(_this.generateStoreKey('LT:addDiv'), _this);
            }
        };
    };
    Node.prototype.calcAnchors = function () {
        this.anchors = [];
        if (middles_1.anchorsFns[this.name]) {
            middles_1.anchorsFns[this.name](this);
        }
        else {
            default_anchor_1.defaultAnchors(this);
        }
        this.calcRotateAnchors();
    };
    Node.prototype.calcRotateAnchors = function (angle) {
        if (angle === undefined) {
            angle = this.rotate;
        }
        this.rotatedAnchors = [];
        for (var _i = 0, _a = this.anchors; _i < _a.length; _i++) {
            var item = _a[_i];
            this.rotatedAnchors.push(item.clone().rotate(angle, this.rect.center));
        }
    };
    Node.prototype.getTextRect = function () {
        var textRect = this.textRect;
        if (!this.icon && !this.image) {
            textRect = this.fullTextRect;
        }
        return textRect;
    };
    Node.prototype.getIconRect = function () {
        var rect = this.iconRect;
        if (!this.text) {
            rect = this.fullIconRect || this.fullTextRect || this.rect;
        }
        return rect;
    };
    // 根据父节点rect计算自己（子节点）的rect
    Node.prototype.calcRectByParent = function (parent) {
        if (!this.rectInParent) {
            return;
        }
        var parentW = parent.rect.width - parent.paddingLeftNum - parent.paddingRightNum;
        var parentH = parent.rect.height - parent.paddingTopNum - parent.paddingBottomNum;
        var x = parent.rect.x +
            parent.paddingLeftNum +
            math_1.abs(parentW, this.rectInParent.x) +
            math_1.abs(parentW, this.rectInParent.marginLeft);
        var y = parent.rect.y +
            parent.paddingTopNum +
            math_1.abs(parentH, this.rectInParent.y) +
            math_1.abs(parentW, this.rectInParent.marginTop);
        var w = math_1.abs(parentW, this.rectInParent.width);
        var h = math_1.abs(parentH, this.rectInParent.height);
        if (this.rectInParent.marginLeft === undefined && this.rectInParent.marginRight) {
            x -= math_1.abs(parentW, this.rectInParent.marginRight);
        }
        if (this.rectInParent.marginTop === undefined && this.rectInParent.marginBottom) {
            y -= math_1.abs(parentW, this.rectInParent.marginBottom);
        }
        this.rect = new rect_1.Rect(x, y, w, h);
        if (!this.rectInParent.rotate) {
            this.rectInParent.rotate = 0;
        }
        var offsetR = parent.rotate + parent.offsetRotate;
        this.rotate = this.rectInParent.rotate + offsetR;
        if (!this.rectInParent.rect) {
            this.rectInParent.rect = this.rect.clone();
        }
    };
    Node.prototype.calcChildrenRect = function () {
        if (!this.children) {
            return;
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var item = _a[_i];
            switch (item.type) {
                case pen_1.PenType.Line:
                    item.calcRectByParent(this);
                    break;
                default:
                    item.calcRectByParent(this);
                    item.init();
                    item.calcChildrenRect();
                    break;
            }
        }
    };
    Node.prototype.calcRectInParent = function (parent) {
        var parentW = parent.rect.width - parent.paddingLeftNum - parent.paddingRightNum;
        var parentH = parent.rect.height - parent.paddingTopNum - parent.paddingBottomNum;
        this.rectInParent = {
            x: ((this.rect.x - parent.rect.x - parent.paddingLeftNum) * 100 / parentW) + '%',
            y: ((this.rect.y - parent.rect.y - parent.paddingTopNum) * 100 / parentH) + '%',
            width: (this.rect.width * 100 / parentW) + '%',
            height: (this.rect.height * 100 / parentH) + '%',
            rotate: this.rotate,
            rect: this.rect.clone()
        };
    };
    Node.prototype.getDockWatchers = function () {
        this.dockWatchers = this.rect.toPoints();
        this.dockWatchers.unshift(this.rect.center);
    };
    Node.prototype.initAnimateProps = function () {
        var passed = 0;
        for (var i = 0; i < this.animateFrames.length; ++i) {
            this.animateFrames[i].start = passed;
            passed += this.animateFrames[i].duration;
            this.animateFrames[i].end = passed;
            this.animateFrames[i].initState = Node.cloneState(i ? this.animateFrames[i - 1].state : this);
        }
    };
    Node.prototype.animate = function (now) {
        var timeline = now - this.animateStart;
        if (timeline > this.animateDuration) {
            if (++this.animateCycleIndex >= this.animateCycle && this.animateCycle > 0) {
                this.animateStart = 0;
                this.animateCycleIndex = 0;
                var item = this.animateFrames[this.animateFrames.length - 1];
                this.dash = item.state.dash;
                this.strokeStyle = item.state.strokeStyle;
                this.fillStyle = item.state.fillStyle;
                this.font = item.state.font;
                this.lineWidth = item.state.lineWidth;
                this.rotate = item.state.rotate;
                this.globalAlpha = item.state.globalAlpha;
                this.lineDashOffset = item.state.lineDashOffset || 0;
                if (item.state.rect && item.state.rect.width) {
                    this.rect = new rect_1.Rect(item.state.rect.x, item.state.rect.y, item.state.rect.width, item.state.rect.height);
                    this.init();
                }
                index_1.Store.set(this.generateStoreKey('animateEnd'), {
                    type: 'node',
                    data: this
                });
                return this.nextAnimate;
            }
            this.animateStart = now;
            timeline = 0;
        }
        var rectChanged = false;
        for (var i = 0; i < this.animateFrames.length; ++i) {
            var item = this.animateFrames[i];
            if (timeline >= item.start && timeline < item.end) {
                this.dash = item.state.dash;
                this.strokeStyle = item.state.strokeStyle;
                this.fillStyle = item.state.fillStyle;
                this.font = item.state.font;
                var rate = (timeline - item.start) / item.duration;
                if (item.linear) {
                    if (item.state.rect.x !== item.initState.rect.x) {
                        this.rect.x = item.initState.rect.x + (item.state.rect.x - item.initState.rect.x) * rate;
                        rectChanged = true;
                    }
                    if (item.state.rect.y !== item.initState.rect.y) {
                        this.rect.y = item.initState.rect.y + (item.state.rect.y - item.initState.rect.y) * rate;
                        rectChanged = true;
                    }
                    if (item.state.rect.width !== item.initState.rect.width) {
                        this.rect.width = item.initState.rect.width + (item.state.rect.width - item.initState.rect.width) * rate;
                        rectChanged = true;
                    }
                    if (item.state.rect.height !== item.initState.rect.height) {
                        this.rect.height =
                            item.initState.rect.height + (item.state.rect.height - item.initState.rect.height) * rate;
                        rectChanged = true;
                    }
                    this.rect.ex = this.rect.x + this.rect.width;
                    this.rect.ey = this.rect.y + this.rect.height;
                    this.rect.calcCenter();
                    if (item.initState.z !== undefined && item.state.z !== item.initState.z) {
                        this.z = item.initState.z + (item.state.z - item.initState.z) * rate;
                        rectChanged = true;
                    }
                    if (item.state.borderRadius !== item.initState.borderRadius) {
                        this.borderRadius =
                            item.initState.borderRadius + (item.state.borderRadius - item.initState.borderRadius) * rate;
                    }
                    if (item.state.lineWidth !== item.initState.lineWidth) {
                        this.lineWidth = item.initState.lineWidth + (item.state.lineWidth - item.initState.lineWidth) * rate;
                    }
                    if (item.state.rotate !== item.initState.rotate) {
                        this.rotate = item.initState.rotate + (item.state.rotate - item.initState.rotate) * rate;
                        rectChanged = true;
                    }
                    if (item.state.globalAlpha !== item.initState.globalAlpha) {
                        this.globalAlpha =
                            item.initState.globalAlpha + (item.state.globalAlpha - item.initState.globalAlpha) * rate;
                    }
                    if (item.state.lineDashOffset) {
                        if (!this.lineDashOffset) {
                            this.lineDashOffset = item.state.lineDashOffset;
                        }
                        else {
                            this.lineDashOffset += item.state.lineDashOffset;
                        }
                    }
                }
                else {
                    this.rect = item.state.rect;
                    this.lineWidth = item.state.lineWidth;
                    this.rotate = item.state.rotate;
                    this.globalAlpha = item.state.globalAlpha;
                    this.lineDashOffset = item.state.lineDashOffset;
                }
            }
        }
        if (rectChanged) {
            this.init();
            if (!this.animateAlone) {
                index_1.Store.set(this.generateStoreKey('LT:rectChanged'), this);
            }
        }
        return '';
    };
    Node.prototype.scale = function (scale, center) {
        if (!center) {
            center = this.rect.center;
        }
        if (scale > 1) {
            this.scaleNum = Number(this.scaleNum) * options_1.DefalutOptions.maxZoom;
        }
        else {
            this.scaleNum = Number(this.scaleNum) * options_1.DefalutOptions.minZoom;
        }
        this.rect.x = center.x - (center.x - this.rect.x) * scale;
        this.rect.y = center.y - (center.y - this.rect.y) * scale;
        this.z *= scale;
        this.rect.width *= scale;
        this.rect.height *= scale;
        this.rect.ex = this.rect.x + this.rect.width;
        this.rect.ey = this.rect.y + this.rect.height;
        if (this.imageWidth) {
            this.imageWidth *= scale;
        }
        if (this.imageHeight) {
            this.imageHeight *= scale;
        }
        this.font.fontSize *= scale;
        this.iconSize *= scale;
        this.rect.calcCenter();
        if (this.animateFrames) {
            for (var _i = 0, _a = this.animateFrames; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.state) {
                    item.state = new Node(item.state);
                    item.state.scale(scale, center);
                }
            }
        }
        this.elementRendered = false;
        this.init();
        if (this.children) {
            for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                var item = _c[_b];
                item.scale(scale, center);
            }
        }
    };
    Node.prototype.translate = function (x, y) {
        this.rect.x += x;
        this.rect.y += y;
        this.rect.ex = this.rect.x + this.rect.width;
        this.rect.ey = this.rect.y + this.rect.height;
        this.rect.calcCenter();
        if (this.animateFrames) {
            for (var _i = 0, _a = this.animateFrames; _i < _a.length; _i++) {
                var frame = _a[_i];
                if (frame.state) {
                    frame.state.rect.x += x;
                    frame.state.rect.y += y;
                    frame.state.rect.ex = frame.state.rect.x + frame.state.rect.width;
                    frame.state.rect.ey = frame.state.rect.y + frame.state.rect.height;
                }
            }
        }
        this.init();
        if (this.children) {
            for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                var item = _c[_b];
                item.translate(x, y);
            }
        }
    };
    Node.prototype.initRect = function () {
        this.rect.init();
        if (this.children) {
            this.calcChildrenRect();
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item instanceof Node) {
                    item.initRect();
                }
            }
        }
    };
    Node.prototype.round = function () {
        this.rect.round();
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var item = _a[_i];
                item.rect.round();
            }
        }
    };
    Node.prototype.clone = function () {
        return new Node(this);
    };
    return Node;
}(pen_1.Pen));
exports.Node = Node;
