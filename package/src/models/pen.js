"use strict";
exports.__esModule = true;
exports.Pen = exports.PenType = void 0;
var index_1 = require("./../store/index");
var uuid_1 = require("../utils/uuid");
var rect_1 = require("./rect");
var canvas_1 = require("../utils/canvas");
var event_1 = require("./event");
var PenType;
(function (PenType) {
    PenType[PenType["Node"] = 0] = "Node";
    PenType[PenType["Line"] = 1] = "Line";
})(PenType = exports.PenType || (exports.PenType = {}));
var Pen = /** @class */ (function () {
    function Pen(json) {
        this.id = '';
        this.type = PenType.Node;
        this.name = '';
        this.rect = new rect_1.Rect(0, 0, 0, 0);
        this.lineWidth = 1;
        this.rotate = 90;
        this.offsetRotate = 0;
        this.globalAlpha = 1;
        this.dash = 0;
        this.strokeStyle = '';
        this.fillStyle = '';
        this.font = {
            color: '',
            fontFamily: '"Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial',
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'normal',
            fontWeight: 'normal',
            textAlign: 'center',
            textBaseline: 'middle',
            background: ''
        };
        this.animateCycleIndex = 0;
        this.events = [];
        this.eventFns = ['link', 'doAnimate', 'doFn', 'doWindowFn'];
        if (json) {
            this.id = json.id || uuid_1.s8();
            this.name = json.name || '';
            this.tags = Object.assign([], json.tags);
            if (json.rect) {
                this.rect = new rect_1.Rect(json.rect.x, json.rect.y, json.rect.width, json.rect.height);
            }
            this.dash = json.dash || 0;
            this.lineDash = json.lineDash;
            this.lineDashOffset = json.lineDashOffset || 0;
            if (json.lineWidth || json.lineWidth === 0) {
                this.lineWidth = json.lineWidth;
            }
            this.strokeStyle = json.strokeStyle || 'rgba(35, 217, 110)';
            this.fillStyle = json.fillStyle || 'rgba(35, 217, 110)';
            this.lineCap = json.lineCap;
            this.globalAlpha = json.globalAlpha || 1;
            if (['line', 'text', 'rectangle', 'polyline', 'polygon'].includes(json.name)) {
                this.rotate = json.rotate || 0;
            }
            else {
                this.rotate = json.rotate || json.defaultRotate || 90;
                if (json.rotate == 0) {
                    this.rotate = 0;
                }
            }
            this.offsetRotate = json.offsetRotate || 0;
            if (json.font) {
                Object.assign(this.font, json.font);
            }
            this.symbolType = json.symbolType || '';
            this.text = json.text;
            this.old = json.old || 0;
            this.optionType = json.optionType || '';
            if (json.textMaxLine) {
                this.textMaxLine = +json.textMaxLine || 0;
            }
            this.textOffsetX = json.textOffsetX || 0;
            this.textOffsetY = json.textOffsetY || 0;
            this.shadowColor = json.shadowColor;
            this.shadowBlur = json.shadowBlur;
            this.shadowOffsetX = json.shadowOffsetX;
            this.shadowOffsetY = json.shadowOffsetY;
            this.animateType = json.animateType;
            this.animateCycle = json.animateCycle;
            this.nextAnimate = json.nextAnimate;
            this.animatePlay = json.animatePlay;
            this.locked = json.locked;
            // this.stand = json.stand;
            this.stand = false;
            this.hideInput = json.hideInput;
            this.hideRotateCP = json.hideRotateCP;
            this.hideSizeCP = json.hideSizeCP;
            this.hideAnchor = json.hideAnchor;
            this.events = json.events || [];
            this.markdown = json.markdown;
            this.tipId = json.tipId;
            this.title = json.title;
            this.visible = json.visible !== false;
            this.xCP = json.xCP || false;
            this.ssjg = json.ssjg;
            this.ssjgName = json.ssjgName;
            if (!this.oldssjg) {
                this.oldssjg = this.ssjg;
            }
            this.zyId = json.zyId;
            this.oid = json.oid;
            this.connection = json.connection;
            this.relativeId = json.relativeId;
            if (!this.sourceColor) {
                this.sourceColor = json.fillStyle || json.strokeStyle || 'rgba(35, 217, 110)';
            }
            if (json.rectInParent) {
                this.rectInParent = json.rectInParent;
            }
            if (typeof json.data === 'object') {
                this.data = JSON.parse(JSON.stringify(json.data));
            }
            else {
                this.data = json.data || '';
            }
        }
        else {
            this.id = uuid_1.s8();
            this.textOffsetX = 0;
            this.textOffsetY = 0;
        }
    }
    Pen.prototype.render = function (ctx) {
        // debugger
        if (!this.visible) {
            return;
        }
        if (this.from && !this.to) {
            return;
        }
        ctx.save();
        if (this.rotate || this.offsetRotate) {
            ctx.translate(this.rect.center.x, this.rect.center.y);
            ctx.rotate(((this.rotate + this.offsetRotate) * Math.PI) / 180);
            ctx.translate(-this.rect.center.x, -this.rect.center.y);
        }
        if (this.lineWidth > 1) {
            ctx.lineWidth = this.lineWidth;
        }
        ctx.strokeStyle = this.strokeStyle || '#222';
        ctx.fillStyle = this.fillStyle || 'transparent';
        if (this.lineCap) {
            ctx.lineCap = this.lineCap;
        }
        if (this.globalAlpha < 1) {
            ctx.globalAlpha = this.globalAlpha;
        }
        if (this.lineDash) {
            ctx.setLineDash(this.lineDash);
        }
        else {
            switch (this.dash) {
                case 1:
                    ctx.setLineDash([5, 5]);
                    break;
                case 2:
                    ctx.setLineDash([10, 10]);
                    break;
                case 3:
                    ctx.setLineDash([10, 10, 2, 10]);
                    break;
            }
        }
        if (this.lineDashOffset) {
            ctx.lineDashOffset = this.lineDashOffset;
        }
        if (this.shadowColor) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
            ctx.shadowBlur = this.shadowBlur;
        }
        this.draw(ctx);
        ctx.restore();
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var item = _a[_i];
                item.render(ctx);
            }
        }
    };
    Pen.prototype.hit = function (point, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.rotate % 360 === 0) {
            return this.rect.hit(point, padding);
        }
        var pts = this.rect.toPoints();
        for (var _i = 0, pts_1 = pts; _i < pts_1.length; _i++) {
            var pt = pts_1[_i];
            pt.rotate(this.rotate, this.rect.center);
        }
        return canvas_1.pointInRect(point, pts);
    };
    Pen.prototype.click = function () {
        // debugger
        if (!this.events) {
            return;
        }
        for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type !== event_1.EventType.Click) {
                continue;
            }
            this[this.eventFns[item.action]] && this[this.eventFns[item.action]](item.value, item.params);
        }
    };
    Pen.prototype.dblclick = function () {
        if (!this.events) {
            return;
        }
        for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type !== event_1.EventType.DblClick) {
                continue;
            }
            this[this.eventFns[item.action]] && this[this.eventFns[item.action]](item.value, item.params);
        }
    };
    Pen.prototype.doSocket = function (item, msg, socket) {
        if (item.action < event_1.EventAction.Function) {
            this[this.eventFns[item.action]](msg.value || msg || item.value, msg.params || item.params, socket);
        }
        else {
            this[this.eventFns[item.action]](item.value, msg || item.params, socket);
        }
    };
    Pen.prototype.show = function () {
        this.visible = true;
        return this;
    };
    Pen.prototype.hide = function () {
        this.visible = false;
        return this;
    };
    Pen.prototype.isVisible = function () {
        return this.visible;
    };
    Pen.prototype.getTID = function () {
        return this.TID;
    };
    Pen.prototype.setTID = function (id) {
        this.TID = id;
        return this;
    };
    Pen.prototype.link = function (url, params) {
        window.open(url, '_blank');
    };
    Pen.prototype.doAnimate = function (tag, params) {
        this.animateStart = Date.now();
        index_1.Store.set(this.generateStoreKey('LT:AnimatePlay'), {
            tag: tag,
            pen: this
        });
    };
    Pen.prototype.doFn = function (fn, params, socket) {
        var func;
        if (socket) {
            func = new Function('pen', 'params', 'websocket', fn);
        }
        else {
            func = new Function('pen', 'params', fn);
        }
        func(this, params, socket);
    };
    Pen.prototype.doWindowFn = function (fn, params, socket) {
        window[fn](this, params, socket);
    };
    Pen.prototype.generateStoreKey = function (key) {
        return this.TID + "-" + key;
    };
    return Pen;
}());
exports.Pen = Pen;
