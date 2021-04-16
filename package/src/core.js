"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.GraphDraw = void 0;
var index_1 = require("./store/index");
var options_1 = require("./options");
var pen_1 = require("./models/pen");
var node_1 = require("./models/node");
var point_1 = require("./models/point");
var line_1 = require("./models/line");
var data_1 = require("./models/data");
var status_1 = require("./models/status");
var index_2 = require("./middles/index");
var offscreen_1 = require("./offscreen");
var renderLayer_1 = require("./renderLayer");
var hoverLayer_1 = require("./hoverLayer");
var activeLayer_1 = require("./activeLayer");
var animateLayer_1 = require("./animateLayer");
var divLayer_1 = require("./divLayer");
var rect_1 = require("./models/rect");
var uuid_1 = require("./utils/uuid");
var canvas_1 = require("./utils/canvas");
var rect_2 = require("./utils/rect");
var padding_1 = require("./utils/padding");
var socket_1 = require("./socket");
var resizeCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
var MoveInType;
(function (MoveInType) {
    MoveInType[MoveInType["None"] = 0] = "None";
    MoveInType[MoveInType["Line"] = 1] = "Line";
    MoveInType[MoveInType["LineMove"] = 2] = "LineMove";
    MoveInType[MoveInType["LineFrom"] = 3] = "LineFrom";
    MoveInType[MoveInType["LineTo"] = 4] = "LineTo";
    MoveInType[MoveInType["LineControlPoint"] = 5] = "LineControlPoint";
    MoveInType[MoveInType["Nodes"] = 6] = "Nodes";
    MoveInType[MoveInType["ResizeCP"] = 7] = "ResizeCP";
    MoveInType[MoveInType["HoverAnchors"] = 8] = "HoverAnchors";
    MoveInType[MoveInType["Rotate"] = 9] = "Rotate";
})(MoveInType || (MoveInType = {}));
var dockOffset = 10;
var GraphDraw = /** @class */ (function () {
    function GraphDraw(parent, options) {
        var _this = this;
        this.data = new data_1.GraphDrawData();
        this.caches = {
            index: 0,
            list: []
        };
        this.input = document.createElement('textarea');
        this.lastTranlated = { x: 0, y: 0 };
        this.moveIn = {
            type: MoveInType.None,
            activeAnchorIndex: 0,
            hoverAnchorIndex: 0,
            hoverNode: null,
            hoverLine: null,
            activeNode: null,
            lineControlPoint: null
        };
        this.needCache = false;
        this.tip = '12315';
        this.scheduledAnimationFrame = false;
        this.scrolling = false;
        this.rendering = false;
        this.lineLinkML = {
            line: null,
            fOrt: 'from'
        };
        this.winResize = function () {
            var timer;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                _this.resize();
                _this.overflow();
            }, 100);
        };
        this.onMouseMove = function (e) {
            if (_this.scheduledAnimationFrame || _this.data.locked === status_1.Lock.NoEvent) {
                return;
            }
            if (_this.data.locked && _this.mouseDown && _this.moveIn.type !== MoveInType.None) {
                return;
            }
            _this.scheduledAnimationFrame = true;
            var pos = new point_1.Point(e.x - _this.boundingRect.x + _this.parentElem.scrollLeft, e.y - _this.boundingRect.y + _this.parentElem.scrollTop);
            requestAnimationFrame(function () {
                if (!_this.mouseDown) {
                    _this.getMoveIn(pos);
                    // Render hover anchors.
                    if (_this.moveIn.hoverNode !== _this.lastHoverNode) {
                        if (_this.lastHoverNode) {
                            // Send a move event.
                            _this.dispatch('moveOutNode', _this.lastHoverNode);
                            _this.hideTip();
                            // Clear hover anchors.
                            _this.hoverLayer.node = null;
                        }
                        if (_this.moveIn.hoverNode) {
                            _this.hoverLayer.node = _this.moveIn.hoverNode;
                            // Send a move event.
                            _this.dispatch('moveInNode', _this.moveIn.hoverNode);
                            _this.showTip(_this.moveIn.hoverNode, pos);
                        }
                    }
                    // if (this.moveIn.hoverLine !== this.lastHoverLine) {
                    if (_this.lastHoverLine) {
                        _this.dispatch('moveOutLine', _this.lastHoverLine);
                        _this.hideTip();
                    }
                    if (_this.moveIn.hoverLine) {
                        _this.dispatch('moveInLine', _this.moveIn.hoverLine);
                        _this.showTip(_this.moveIn.hoverLine, pos);
                    }
                    // }
                    if (_this.moveIn.type === MoveInType.LineControlPoint) {
                        _this.hoverLayer.hoverLineCP = _this.moveIn.lineControlPoint;
                    }
                    else if (_this.hoverLayer.hoverLineCP) {
                        _this.hoverLayer.hoverLineCP = null;
                    }
                    if (_this.moveIn.hoverNode !== _this.lastHoverNode ||
                        _this.moveIn.type === MoveInType.HoverAnchors ||
                        _this.hoverLayer.lasthoverLineCP !== _this.hoverLayer.hoverLineCP) {
                        _this.hoverLayer.lasthoverLineCP = _this.hoverLayer.hoverLineCP;
                        _this.render();
                    }
                    _this.scheduledAnimationFrame = false;
                    return;
                }
                // Move out parent element.
                var moveOutX = pos.x + 50 > _this.parentElem.clientWidth + _this.parentElem.scrollLeft;
                var moveOutY = pos.y + 50 > _this.parentElem.clientHeight + _this.parentElem.scrollTop;
                if (!_this.options.disableMoveOutParent && (moveOutX || moveOutY)) {
                    _this.dispatch('moveOutParent', pos);
                    var resize = false;
                    if (pos.x + 50 > _this.divLayer.canvas.clientWidth) {
                        _this.canvas.width += 200;
                        resize = true;
                    }
                    if (pos.y + 50 > _this.divLayer.canvas.clientHeight) {
                        _this.canvas.height += 200;
                        resize = true;
                    }
                    if (resize) {
                        _this.resize({ width: _this.canvas.width, height: _this.canvas.height });
                    }
                    _this.scroll(moveOutX ? 100 : 0, moveOutY ? 100 : 0);
                }
                var moveLeft = pos.x - 100 < _this.parentElem.scrollLeft;
                var moveTop = pos.y - 100 < _this.parentElem.scrollTop;
                if (moveLeft || moveTop) {
                    _this.scroll(moveLeft ? -100 : 0, moveTop ? -100 : 0);
                }
                switch (_this.moveIn.type) {
                    case MoveInType.None:
                        if (_this.data.locked === status_1.Lock.NoEvent) {
                            return;
                        }
                        if (_this.mouseDown && (_this.moveIn.type === MoveInType.None || _this.rectangleWrap)) {
                            if (!e.ctrlKey && !e.shiftKey) {
                                _this.translate(e.x - _this.boundingRect.x - _this.mouseDown.x + _this.parentElem.scrollLeft, e.y - _this.boundingRect.y - _this.mouseDown.y + _this.parentElem.scrollTop, true);
                            }
                        }
                        if (e.ctrlKey && !e.shiftKey) {
                            _this.unCombineAll();
                            _this.hoverLayer.dragRect = new rect_1.Rect(_this.mouseDown.x, _this.mouseDown.y, pos.x - _this.mouseDown.x, pos.y - _this.mouseDown.y);
                        }
                        break;
                    case MoveInType.Nodes:
                        if (_this.activeLayer.locked()) {
                            break;
                        }
                        var x = pos.x - _this.mouseDown.x;
                        var y = pos.y - _this.mouseDown.y;
                        if (_this.moveIn.hoverNode && _this.moveIn.hoverNode.name === 'combine') { //拖动到母线连接topo
                            console.log(1111111111);
                            var allML_1 = _this.data.pens.filter(function (it) { return it instanceof node_1.Node && it.anchors.length > 4; });
                            _this.moveIn.hoverNode.children.map(function (it) {
                                if (it instanceof line_1.Line) {
                                    allML_1.forEach(function (is) {
                                        if (it.from.x > is.rect.x && it.from.x < is.rect.ex && it.from.y > is.rect.y && it.from.y < is.rect.ey) {
                                            is.strokeStyle = _this.options.activeColor;
                                            is.fillStyle = _this.options.activeColor;
                                            it.from.id = is.id;
                                            it.from.anchorIndex = Math.floor(it.from.x - is.rect.x);
                                        }
                                        // else{
                                        //   is.strokeStyle = is.sourceColor
                                        //   is.fillStyle =  is.sourceColor
                                        //   it.from.id = ""
                                        // }
                                        if (it.to.x > is.rect.x && it.to.x < is.rect.ex && it.to.y > is.rect.y && it.to.y < is.rect.ey) {
                                            is.strokeStyle = _this.options.activeColor;
                                            is.fillStyle = _this.options.activeColor;
                                            it.to.id = is.id;
                                            it.to.anchorIndex = Math.floor(it.to.x - is.rect.x);
                                        }
                                        // else{
                                        //   is.strokeStyle = is.sourceColor
                                        //   is.fillStyle =  is.sourceColor
                                        //   it.to.id = ""
                                        // }
                                    });
                                }
                            });
                        }
                        if ((x || y) && _this.moveIn.hoverNode && !_this.moveIn.hoverNode.xCP) {
                            //点击图元为单端子时 把连接线的from端指向当前图元 （移动，否者拖链接但是拖动先不跟着移动）
                            if (_this.moveIn.hoverNode && _this.moveIn.hoverNode.anchorCount === 1 && _this.mouseDown.x) {
                                _this.lines.map(function (it) {
                                    if (it.type === 1 && it.to.id === _this.moveIn.hoverNode.id) {
                                        var from = it.from, to = it.to;
                                        it.from = to;
                                        it.to = from;
                                        it.controlPoints = it.controlPoints;
                                    }
                                });
                            }
                            var offset = _this.getDockPos(x, y);
                            _this.activeLayer.move(offset.x ? offset.x : x, offset.y ? offset.y : y);
                            _this.needCache = true;
                        }
                        break;
                    case MoveInType.ResizeCP:
                        if (_this.moveIn.activeNode && _this.moveIn.activeNode.xCP && _this.moveIn.activeNode.mlMinWidth + 5 > _this.moveIn.activeNode.rect.width) {
                            _this.moveIn.activeNode.rect.width = _this.moveIn.activeNode.mlMinWidth + 5;
                        }
                        _this.dispatch('ResizeCP', _this.moveIn.activeNode);
                        if (!(_this.moveIn.activeNode.xCP && _this.moveIn.activeAnchorIndex === 0)) {
                            _this.activeLayer.resize(_this.moveIn.activeAnchorIndex, _this.mouseDown, pos);
                        }
                        _this.needCache = true;
                        break;
                    case MoveInType.LineTo:
                    case MoveInType.HoverAnchors:
                        if (_this.moveIn.hoverNode) {
                            var x_1 = _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].x;
                            var y_1 = _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].y;
                            if (_this.hoverLayer.line) {
                                _this.hoverLayer.line.name = 'line';
                                if ((x_1 - _this.options.tolarence < e.pageX && e.pageX < x_1 + _this.options.tolarence) || (y_1 - _this.options.tolarence < e.pageY && e.pageY < y_1 + _this.options.tolarence)) {
                                    _this.hoverLayer.line.visible = true;
                                    _this.hoverLayer.line.hideCP = true;
                                    _this.activeLayer.pens = [_this.hoverLayer.line];
                                }
                                else {
                                    _this.hoverLayer.line.visible = false;
                                }
                            }
                        }
                        var arrow = _this.data.toArrowType;
                        if (_this.moveIn.hoverLine) {
                            arrow = _this.moveIn.hoverLine.toArrow;
                        }
                        _this.hoverLayer.line && _this.hoverLayer.lineTo(_this.getLineDock(pos), arrow);
                        _this.needCache = true;
                        break;
                    case MoveInType.LineFrom:
                        _this.hoverLayer.line && _this.hoverLayer.lineFrom(_this.getLineDock(pos));
                        _this.needCache = true;
                        break;
                    case MoveInType.LineMove:
                        _this.hoverLayer.lineMove(pos, _this.mouseDown);
                        _this.needCache = true;
                        break;
                    case MoveInType.LineControlPoint:
                        if (!(_this.moveIn.hoverLine && _this.moveIn.hoverLine.symbolType === "Polygon" && _this.moveIn.hoverLine.old === 1)) {
                            _this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id].x = pos.x;
                            _this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id].y = pos.y;
                            _this.moveIn.hoverLine.textRect = null;
                            if (index_2.drawLineFns[_this.moveIn.hoverLine.name] && index_2.drawLineFns[_this.moveIn.hoverLine.name].dockControlPointFn) {
                                index_2.drawLineFns[_this.moveIn.hoverLine.name].dockControlPointFn(_this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id], _this.moveIn.hoverLine);
                            }
                            _this.needCache = true;
                            index_1.Store.set(_this.generateStoreKey('LT:updateLines'), [_this.moveIn.hoverLine]);
                        }
                        break;
                    case MoveInType.Rotate:
                        var ang = _this.getAngle(pos);
                        if (ang < -360) {
                            ang = -360;
                        }
                        if (ang > 360) {
                            ang = 360;
                        }
                        var curAng = 0;
                        if ((0 <= ang && ang < 45) || (315 <= ang && ang <= 360)) {
                            curAng = 0;
                        }
                        else if ((45 <= ang && ang < 135) || (-315 <= ang && ang < -215)) {
                            curAng = 90;
                        }
                        else if ((135 <= ang && ang < 225) || (-225 <= ang && ang < -135)) {
                            curAng = 180;
                        }
                        else if ((225 <= ang && ang < 315) || (-135 <= ang && ang < -45)) {
                            curAng = 270;
                        }
                        if (_this.activeLayer.pens.length) {
                            _this.activeLayer.offsetRotate(curAng);
                            _this.activeLayer.updateLines();
                        }
                        _this.needCache = true;
                        break;
                }
                _this.render();
                _this.scheduledAnimationFrame = false;
            });
        };
        this.onmousedown = function (e) {
            //兼容谷歌60
            if (!_this.boundingRect.x && _this.boundingRect.x !== 0) {
                _this.boundingRect.x = 0;
                _this.boundingRect.y = 0;
            }
            _this.lines = _this.data.pens.filter(function (it) { return it.type === 1; });
            _this.mouseDown = { x: e.x - _this.boundingRect.x + _this.parentElem.scrollLeft, y: e.y - _this.boundingRect.y + _this.parentElem.scrollTop };
            _this.pasteMouseDown = _this.mouseDown;
            _this.isMLNode = null;
            if (e.altKey) {
                _this.divLayer.canvas.style.cursor = 'pointer';
            }
            if (_this.inputObj) {
                _this.setNodeText();
            }
            switch (_this.moveIn.type) {
                // Click the space.
                case MoveInType.None:
                    _this.activeLayer.clear();
                    _this.hoverLayer.clear();
                    // this.clearHighLight()
                    _this.dispatch('space', _this.mouseDown);
                    break;
                // Click a line.
                case MoveInType.Line:
                case MoveInType.LineControlPoint:
                    if (e.ctrlKey) {
                        _this.activeLayer.add(_this.moveIn.hoverLine);
                        _this.dispatch('multi', _this.activeLayer.pens);
                    }
                    else {
                        _this.activeLayer.pens = [_this.moveIn.hoverLine];
                        _this.dispatch('line', _this.moveIn.hoverLine);
                    }
                    _this.highLight('line');
                    break;
                case MoveInType.LineMove:
                    _this.hoverLayer.initLine = new line_1.Line(_this.moveIn.hoverLine);
                    _this.moveIn.hoverLine.click();
                // tslint:disable-next-line:no-switch-case-fall-through
                case MoveInType.LineFrom:
                case MoveInType.LineTo:
                    _this.data.cellInfo = null;
                    _this.activeLayer.pens = [_this.moveIn.hoverLine];
                    _this.dispatch('line', _this.moveIn.hoverLine);
                    _this.hoverLayer.line = _this.moveIn.hoverLine;
                    break;
                case MoveInType.HoverAnchors:
                    var index = _this.moveIn.hoverAnchorIndex;
                    _this.preAnchorInfo = {
                        node: _this.moveIn.hoverNode,
                        hoverAnchorIndex: index
                    };
                    // if (this.data.cellInfo ) {
                    _this.hoverLayer.line = _this.addLine({
                        name: _this.data.lineName,
                        from: new point_1.Point(_this.moveIn.hoverNode.rotatedAnchors[index].x, _this.moveIn.hoverNode.rotatedAnchors[index].y, _this.moveIn.hoverNode.rotatedAnchors[index].direction, index, _this.moveIn.hoverNode.id),
                        fromArrow: _this.data.fromArrowType,
                        to: new point_1.Point(_this.moveIn.hoverNode.rotatedAnchors[index].x, _this.moveIn.hoverNode.rotatedAnchors[index].y),
                        toArrow: _this.data.toArrowType,
                        strokeStyle: _this.options.color
                    });
                // }
                // tslint:disable-next-line:no-switch-case-fall-through
                case MoveInType.Nodes:
                    if (_this.moveIn.hoverNode && _this.moveIn.hoverNode.name === "rectangle") {
                        _this.rectangleWrap = true;
                    }
                    else {
                        _this.rectangleWrap = false;
                    }
                    _this.activeLayer.clear();
                    if (!_this.moveIn.activeNode) {
                        break;
                    }
                    _this.isMLNode = _this.moveIn.hoverNode;
                    if (e.ctrlKey) {
                        if (_this.moveIn.hoverNode && _this.activeLayer.hasInAll(_this.moveIn.hoverNode)) {
                            _this.activeLayer.setPens([_this.moveIn.hoverNode]);
                            _this.dispatch('node', _this.moveIn.hoverNode);
                        }
                        else if (!_this.activeLayer.has(_this.moveIn.activeNode)) {
                            _this.activeLayer.add(_this.moveIn.activeNode);
                            if (_this.activeLayer.pens.length > 1) {
                                _this.dispatch('multi', _this.activeLayer.pens);
                            }
                            else {
                                _this.dispatch('node', _this.moveIn.activeNode);
                            }
                        }
                    }
                    else if (e.shiftKey) {
                        if (_this.moveIn.hoverNode) {
                            _this.activeLayer.setPens([_this.moveIn.hoverNode]);
                            _this.dispatch('node', _this.moveIn.hoverNode);
                        }
                        else if (_this.moveIn.hoverLine) {
                            _this.activeLayer.setPens([_this.moveIn.hoverLine]);
                            _this.dispatch('line', _this.moveIn.hoverLine);
                        }
                    }
                    else if (_this.activeLayer.pens.length < 2) {
                        _this.activeLayer.setPens([_this.moveIn.activeNode]);
                        _this.dispatch('node', _this.moveIn.activeNode);
                    }
                    _this.moveIn.activeNode.click();
                    // this.highLight('node')
                    if (_this.moveIn.activeNode.name === 'rectangle') {
                        var item = _this.moveIn.activeNode;
                        var n = 5;
                        var bool = ((item.rect.x - n < _this.mouseDown.x && item.rect.x + n > _this.mouseDown.x) || (item.rect.ex - n < _this.mouseDown.x && item.rect.ex + n > _this.mouseDown.x)) && (item.rect.y - n < _this.mouseDown.y && item.rect.ey + n > _this.mouseDown.y)
                            || ((item.rect.y - n < _this.mouseDown.y && item.rect.y + n > _this.mouseDown.y) || (item.rect.ey - n < _this.mouseDown.y && item.rect.ey + n > _this.mouseDown.y)) && (item.rect.x - n < _this.mouseDown.x && item.rect.ex + n > _this.mouseDown.x);
                        if (!bool) {
                            _this.activeLayer.clear();
                        }
                    }
                    break;
            }
            // Save node rects to move.
            if (_this.activeLayer.pens.length) {
                _this.activeLayer.saveNodeRects();
            }
            // this.render();
        };
        this.onmouseup = function (e) {
            if (_this.hoverLayer.line && _this.data.cellInfo && !(_this.data.cellInfo.data.name === 'rectangle' || _this.data.cellInfo.code === 'ml')) { //放开鼠标左键绘制
                var json = _this.data.cellInfo.data;
                json.scaleNum = _this.data.scale;
                var px = 0;
                var py = 0;
                var x = _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].x, y = _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].y, ex = e.pageX, ey = e.pageY, x12 = Math.abs(e.pageX - _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].x), y12 = Math.abs(e.pageY - _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].y);
                if (_this.moveIn.hoverNode) { //偏移容差
                    if (x - _this.options.tolarence < e.pageX && e.pageX < x + _this.options.tolarence) {
                        px = _this.moveIn.hoverNode.rotatedAnchors[_this.hoverLayer.hoverAnchorIndex].x;
                        py = e.pageY;
                    }
                    if (y - _this.options.tolarence < e.pageY && e.pageY < y + _this.options.tolarence) {
                        px = e.pageX;
                        py = _this.moveIn.hoverNode.rotatedAnchors[_this.hoverLayer.hoverAnchorIndex].y;
                    }
                }
                json.rect.x = (px - json.rect.width / 2) << 0;
                json.rect.y = (py - json.rect.height) << 0;
                var node = new node_1.Node(json);
                var reverseSymbolList = _this.options.reverseSymbolList;
                if (_this.moveIn.hoverNode) {
                    if (x12 > y12) {
                        if (ex > x) {
                            node.rotate = 180;
                            if (reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                                node.rotate = 0;
                            }
                            if (json.anchorCount === 4) {
                                node.rotate = 315;
                            }
                        }
                        else {
                            node.rotate = 0;
                            if (reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                                node.rotate = 180;
                            }
                            if (json.anchorCount === 4) {
                                node.rotate = 135;
                            }
                        }
                    }
                    else {
                        if (ey > y) {
                            node.rotate = 270;
                            if (reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                                node.rotate = 90;
                            }
                            if (json.anchorCount === 4) {
                                node.rotate = 45;
                            }
                        }
                        else {
                            node.rotate = 90;
                            if (reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                                node.rotate = 270;
                            }
                            if (json.anchorCount === 4) {
                                node.rotate = 225;
                            }
                        }
                    }
                    switch (json.anchorCount) {
                        case 1:
                            _this.hoverLayer.line.to.direction = 0;
                            _this.hoverLayer.line.to.anchorIndex = 0;
                            _this.hoverLayer.line.to.id = node.id;
                            _this.hoverLayer.line.to.x = node.rotatedAnchors[0].x;
                            _this.hoverLayer.line.to.y = node.rotatedAnchors[0].y;
                            break;
                        case 2:
                            if (!reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) { //变压器倒置
                                _this.hoverLayer.line.to.direction = 4;
                                _this.hoverLayer.line.to.anchorIndex = 0;
                                _this.hoverLayer.line.to.id = node.id;
                                _this.hoverLayer.line.to.x = node.rotatedAnchors[0].x;
                                _this.hoverLayer.line.to.y = node.rotatedAnchors[0].y;
                            }
                            else {
                                _this.hoverLayer.line.to.direction = 2;
                                _this.hoverLayer.line.to.anchorIndex = 0;
                                _this.hoverLayer.line.to.id = node.id;
                                _this.hoverLayer.line.to.x = node.rotatedAnchors[0].x;
                                _this.hoverLayer.line.to.y = node.rotatedAnchors[0].y;
                            }
                            break;
                        case 3:
                            _this.hoverLayer.line.to.direction = 2;
                            _this.hoverLayer.line.to.anchorIndex = 0;
                            _this.hoverLayer.line.to.id = node.id;
                            _this.hoverLayer.line.to.x = node.rotatedAnchors[0].x;
                            _this.hoverLayer.line.to.y = node.rotatedAnchors[0].y;
                            break;
                        case 4:
                            _this.hoverLayer.line.to.direction = 1;
                            _this.hoverLayer.line.to.anchorIndex = 0;
                            _this.hoverLayer.line.to.id = node.id;
                            _this.hoverLayer.line.to.x = node.rotatedAnchors[0].x;
                            _this.hoverLayer.line.to.y = node.rotatedAnchors[0].y;
                            break;
                    }
                }
                node.setTID(_this.id);
                _this.addNode(node, true);
                switch (node.rotate) {
                    case 0:
                    case 135:
                        if (!reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                            node.translate(-node.rect.width / 2, 0);
                        }
                        else {
                            node.translate(node.rect.width / 2, 0);
                        }
                        break;
                    case 90:
                    case 225:
                        if (!reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                            node.translate(0, -node.rect.width / 2);
                        }
                        else {
                            node.translate(0, node.rect.width / 2);
                        }
                        break;
                    case 180:
                    case 315:
                        if (!reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                            node.translate(node.rect.width / 2, 0);
                        }
                        else {
                            node.translate(-node.rect.width / 2, 0);
                        }
                        break;
                    case 270:
                    case 45:
                        if (!reverseSymbolList.includes(_this.data.cellInfo.sbzlx)) {
                            node.translate(0, node.rect.width / 2);
                        }
                        else {
                            node.translate(0, -node.rect.width / 2);
                        }
                        break;
                }
                if (node.name === 'div') {
                    _this.dispatch('LT:addDiv', node);
                }
                _this.activeLayer.clear();
                _this.hoverLayer.clear();
                _this.needCache = true;
            }
            if (_this.data.cellInfo && _this.data.cellInfo.data.name === 'rectangle') { //直接在画布上画框
                var node = new node_1.Node({
                    name: 'rectangle',
                    rect: _this.hoverLayer.dragRect,
                    strokeStyle: _this.data.cellInfo.data.strokeStyle,
                    fillStyle: _this.data.cellInfo.data.fillStyle,
                    label: _this.data.cellInfo.data.label,
                    psrSubType: _this.data.cellInfo.data.psrSubType,
                    psrType: _this.data.cellInfo.data.psrType,
                    realSymbolId: _this.data.cellInfo.data.symbolId,
                    symbolId: _this.data.cellInfo.data.symbolId,
                    voltage: _this.data.cellInfo.data.voltage,
                    scaleNum: _this.data.cellInfo.data.scaleNum,
                    hideAnchor: true
                });
                _this.data.pens.push(node);
                _this.hoverLayer.dragRect = null;
                _this.data.cellInfo = null;
                _this.dispatch('addNode', node);
            }
            if (_this.hoverLayer.dragRect) {
                _this.getPensInRectCopy(_this.hoverLayer.dragRect);
                if (_this.activeLayer.pens && _this.activeLayer.pens.length) {
                    _this.dispatch('multi', _this.activeLayer.pens);
                }
            }
            else {
                switch (_this.moveIn.type) {
                    // Add the line.
                    case MoveInType.HoverAnchors:
                        // New active.
                        if (_this.hoverLayer.line) {
                            if (_this.hoverLayer.line && !_this.options.disableEmptyLine && _this.hoverLayer.line.from.id && _this.hoverLayer.line.to.id) {
                                _this.activeLayer.pens = [_this.hoverLayer.line];
                                _this.dispatch('addLine', _this.hoverLayer.line);
                            }
                            else {
                                _this.data.pens.pop();
                            }
                        }
                        _this.offscreen.render();
                        _this.hoverLayer.line = null;
                        break;
                    case MoveInType.Rotate:
                        _this.activeLayer.updateRotate();
                        break;
                    case MoveInType.LineControlPoint:
                        index_1.Store.set(_this.generateStoreKey('pts-') + _this.moveIn.hoverLine.id, null);
                        break;
                }
            }
            _this.mouseDown = null;
            _this.lastTranlated.x = 0;
            _this.lastTranlated.y = 0;
            _this.hoverLayer.dockAnchor = null;
            _this.hoverLayer.dockLineX = 0;
            _this.hoverLayer.dockLineY = 0;
            _this.divLayer.canvas.style.cursor = 'default';
            _this.relativeTextNode = [];
            _this.data.cellInfo = null;
            _this.hoverLayer.line = null;
            _this.hoverLayer.dragRect = null;
            _this.render();
            if (_this.needCache) {
                _this.cache();
            }
            _this.needCache = false;
        };
        this.ondblclick = function (e) {
            // debugger
            _this.options.disableScale = false;
            _this.clipboard = null;
            if (_this.moveIn.hoverNode) {
                _this.dispatch('dblclick', {
                    node: _this.moveIn.hoverNode
                });
                if (_this.moveIn.hoverNode.getTextRect() && _this.moveIn.hoverNode.getTextRect().hit(new point_1.Point(e.x - _this.boundingRect.x + _this.parentElem.scrollLeft, e.y - _this.boundingRect.y + _this.parentElem.scrollTop))) {
                    _this.showInput(_this.moveIn.hoverNode);
                }
                _this.moveIn.hoverNode.dblclick();
            }
            else if (_this.moveIn.hoverLine) {
                _this.dispatch('dblclick', {
                    line: _this.moveIn.hoverLine
                });
                if (!_this.moveIn.hoverLine.text || _this.moveIn.hoverLine.getTextRect().hit(new point_1.Point(e.x - _this.boundingRect.x + _this.parentElem.scrollLeft, e.y - _this.boundingRect.y + _this.parentElem.scrollTop))) {
                    _this.showInput(_this.moveIn.hoverLine);
                }
                _this.moveIn.hoverLine.dblclick();
            }
        };
        this.onkeydown = function (key) {
            if (_this.data.locked || key.target.tagName === 'INPUT' || key.target.tagName === 'TEXTAREA') {
                return;
            }
            var done = false;
            var moveX = 0;
            var moveY = 0;
            var code = '';
            if (key.ctrlKey) {
                code = "ctrl_" + key.key;
            }
            else if (key.shiftKey) {
                code = "shift_" + key.key;
            }
            else {
                code = key.key;
            }
            switch (code) {
                case 'ctrl_a':
                case 'ctrl_A':
                    _this.activeLayer.pens = [];
                    _this.activeLayer.pens = __spreadArrays(_this.data.pens);
                    done = true;
                    break;
                case 'Delete':
                    // case 'Backspace':
                    _this["delete"]();
                    break;
                case 'ArrowLeft':
                    moveX = -options_1.DefalutOptions.moveSize;
                    if (key.ctrlKey) {
                        moveX = -options_1.DefalutOptions.moveSize;
                    }
                    done = true;
                    break;
                case 'ArrowUp':
                    moveY = -options_1.DefalutOptions.moveSize;
                    if (key.ctrlKey) {
                        moveY = -options_1.DefalutOptions.moveSize;
                    }
                    done = true;
                    break;
                case 'ArrowRight':
                    moveX = options_1.DefalutOptions.moveSize;
                    if (key.ctrlKey) {
                        moveX = options_1.DefalutOptions.moveSize;
                    }
                    done = true;
                    break;
                case 'ArrowDown':
                    moveY = options_1.DefalutOptions.moveSize;
                    if (key.ctrlKey) {
                        moveY = options_1.DefalutOptions.moveSize;
                    }
                    done = true;
                    break;
                case 'ctrl_x':
                case 'ctrl_X':
                    _this.cut();
                    break;
                case 'ctrl_c':
                case 'ctrl_C':
                    _this.copy("first");
                    break;
                case 'ctrl_v':
                case 'ctrl_V':
                    _this.paste();
                    break;
                case 'ctrl_y':
                case 'ctrl_Y':
                    if (key.ctrlKey) {
                        _this.redo();
                    }
                    break;
                case 'ctrl_z':
                case 'ctrl_Z':
                    if (key.shiftKey) {
                        _this.redo();
                    }
                    else {
                        _this.undo();
                    }
                    break;
                case 'ctrl_t':
                    console.log('KeyT');
                    break;
            }
            if (!done) {
                return;
            }
            key.preventDefault();
            if (moveX || moveY) {
                _this.activeLayer.saveNodeRects();
                _this.activeLayer.move(moveX, moveY);
                _this.overflow();
                _this.animateLayer.animate();
            }
            _this.render();
            _this.cache();
        };
        this.id = uuid_1.s8();
        this.initCopyData = [];
        index_1.Store.set(this.generateStoreKey('topology-data'), this.data);
        if (!options) {
            options = {};
        }
        var font = Object.assign({}, options_1.DefalutOptions.font, options.font);
        options.font = font;
        this.options = Object.assign({}, options_1.DefalutOptions, options);
        if (typeof parent === 'string') {
            this.parentElem = document.getElementById(parent);
        }
        else {
            this.parentElem = parent;
        }
        this.parentElem.style.position = 'relative';
        this.rectangleWrap = false;
        var id = this.id;
        this.activeLayer = new activeLayer_1.ActiveLayer(this.options, id);
        this.hoverLayer = new hoverLayer_1.HoverLayer(this.options, id);
        this.animateLayer = new animateLayer_1.AnimateLayer(this.options, id);
        this.offscreen = new offscreen_1.Offscreen(this.parentElem, this.options, id);
        this.canvas = new renderLayer_1.RenderLayer(this.parentElem, this.options, id);
        this.divLayer = new divLayer_1.DivLayer(this.parentElem, this.options, id);
        this.resize();
        this.divLayer.canvas.ondragover = function (event) { return event.preventDefault(); };
        this.divLayer.canvas.ondrop = function (event) {
            _this.ondrop(event);
        };
        this.boundingRect = this.divLayer.canvas.getBoundingClientRect();
        this.subcribe = index_1.Store.subscribe(this.generateStoreKey('LT:render'), function () {
            _this.render();
        });
        this.subcribeRender = index_1.Store.subscribe('LT:render', function () {
            _this.render();
        });
        this.subcribeImage = index_1.Store.subscribe(this.generateStoreKey('LT:imageLoaded'), function () {
            if (_this.imageTimer) {
                clearTimeout(_this.imageTimer);
            }
            _this.imageTimer = setTimeout(function () {
                _this.render();
            }, 100);
        });
        this.subcribeAnimateMoved = index_1.Store.subscribe(this.generateStoreKey('LT:rectChanged'), function (e) {
            _this.activeLayer.updateLines(_this.data.pens);
        });
        this.subcribeMediaEnd = index_1.Store.subscribe(this.generateStoreKey('mediaEnd'), function (node) {
            if (node.nextPlay) {
                _this.animateLayer.readyPlay(node.nextPlay);
                _this.animateLayer.animate();
            }
            _this.dispatch('mediaEnd', node);
        });
        this.subcribeAnimateEnd = index_1.Store.subscribe(this.generateStoreKey('animateEnd'), function (e) {
            if (!e) {
                return;
            }
            switch (e.type) {
                case 'node':
                    _this.offscreen.render();
                    break;
            }
            _this.divLayer.playNext(e.data.nextAnimate);
            _this.dispatch('animateEnd', e);
        });
        this.divLayer.canvas.onmousemove = this.onMouseMove;
        this.divLayer.canvas.onmousedown = this.onmousedown;
        this.divLayer.canvas.onmouseup = this.onmouseup;
        this.divLayer.canvas.ondblclick = this.ondblclick;
        this.divLayer.canvas.tabIndex = 0;
        this.divLayer.canvas.onblur = function () {
            _this.mouseDown = null;
            _this.pasteMouseDown = null;
        };
        this.divLayer.canvas.onwheel = function (event) {
            if (_this.options.disableScale) {
                return;
            }
            switch (_this.options.scaleKey) {
                // case KeyType.None:
                //   break;
                // case KeyType.Ctrl:
                //   if (!event.ctrlKey) {
                //     return;
                //   }
                //   break;
                // case KeyType.Shift:
                //   if (!event.shiftKey) {
                //     return;
                //   }
                //   break;
                // case KeyType.Alt:
                //   if (!event.altKey) {
                //     return;
                //   }
                //   break;
                // default:
                //   if (!event.ctrlKey && !event.altKey) {
                //     return;
                //   }
            }
            event.preventDefault();
            var obj = new point_1.Point(event.offsetX, event.offsetY);
            if (event.deltaY < 0) {
                if (_this.data.scale > 100) {
                    return;
                }
                _this.scale(options_1.DefalutOptions.maxZoom, obj);
            }
            else {
                if (_this.data.scale < 18) {
                    return;
                }
                _this.scale(options_1.DefalutOptions.minZoom, obj);
            }
            _this.divLayer.canvas.focus();
            return false;
        };
        this.divLayer.canvas.ontouchend = function (event) {
            _this.ontouched(event);
        };
        switch (this.options.keydown) {
            case options_1.KeydownType.Document:
                document.onkeydown = this.onkeydown;
                break;
            case options_1.KeydownType.Canvas:
                this.divLayer.canvas.onkeydown = this.onkeydown;
                break;
        }
        this.input.style.position = 'absolute';
        this.input.style.zIndex = '-1';
        this.input.style.left = '-1000px';
        this.input.style.width = '0';
        this.input.style.height = '0';
        this.input.style.outline = 'none';
        this.input.style.border = '1px solid #cdcdcd';
        this.input.style.resize = 'none';
        this.parentElem.appendChild(this.input);
        this.createMarkdownTip();
        this.cache();
        window.addEventListener('resize', this.winResize);
        window.topology = this;
        this.mutilData = [];
    }
    GraphDraw.prototype.resize = function (size) {
        this.canvas.resize(size);
        this.offscreen.resize(size);
        this.divLayer.resize(size);
        this.render();
        this.dispatch('resize', size);
    };
    GraphDraw.prototype.ondrop = function (event) {
        event.preventDefault();
        try {
            var json = JSON.parse(event.dataTransfer.getData('Text'));
            json.rect.x = (event.offsetX - json.rect.width / 2) << 0;
            json.rect.y = (event.offsetY - json.rect.height / 2) << 0;
            if (json.name === 'lineAlone') {
                this.addLine({
                    name: this.data.lineName,
                    from: new point_1.Point(json.rect.x, json.rect.y),
                    fromArrow: this.data.fromArrowType,
                    to: new point_1.Point(json.rect.x + json.rect.width, json.rect.y + json.rect.height),
                    toArrow: this.data.toArrowType,
                    strokeStyle: this.options.color
                }, true);
            }
            else {
                var node = new node_1.Node(json);
                node.setTID(this.id);
                this.addNode(node, true);
                if (node.name === 'div') {
                    this.dispatch('LT:addDiv', node);
                }
            }
            this.divLayer.canvas.focus();
        }
        catch (e) {
        }
    };
    GraphDraw.prototype.getTouchOffset = function (touch) {
        var currentTarget = this.parentElem;
        var x = 0;
        var y = 0;
        while (currentTarget) {
            x += currentTarget.offsetLeft;
            y += currentTarget.offsetTop;
            currentTarget = currentTarget.offsetParent;
        }
        return { offsetX: touch.pageX - x, offsetY: touch.pageY - y };
    };
    GraphDraw.prototype.ontouched = function (event) {
        if (!this.touchedNode) {
            return;
        }
        var pos = this.getTouchOffset(event.changedTouches[0]);
        this.touchedNode.rect.x = pos.offsetX - this.touchedNode.rect.width / 2;
        this.touchedNode.rect.y = pos.offsetY - this.touchedNode.rect.height / 2;
        var node = new node_1.Node(this.touchedNode);
        node.setTID(this.id);
        this.addNode(node, true);
        this.touchedNode = undefined;
    };
    GraphDraw.prototype.addNode = function (node, focus) {
        if (focus === void 0) { focus = false; }
        if (this.data.locked || !index_2.drawNodeFns[node.name]) {
            return null;
        }
        // if it's not a Node
        if (!node.init) {
            node = new node_1.Node(node);
        }
        if (!node.strokeStyle && this.options.color) {
            node.strokeStyle = this.options.color;
        }
        for (var key in node.font) {
            if (!node.font[key]) {
                node.font[key] = this.options.font[key];
            }
        }
        if (this.data.scale !== 1) {
            node.scale(this.data.scale);
        }
        this.data.pens.push(node);
        if (focus) {
            this.activeLayer.setPens([node]);
            this.render();
            this.cache();
            this.dispatch('addNode', node);
        }
        return node;
    };
    GraphDraw.prototype.addLine = function (line, focus) {
        if (focus === void 0) { focus = false; }
        if (this.data.locked) {
            return null;
        }
        if (!line.clone) {
            line = new line_1.Line(line);
            line.calcControlPoints(true);
        }
        this.data.pens.push(line);
        if (focus) {
            this.activeLayer.setPens([line]);
            this.render();
            this.cache();
        }
        this.dispatch('addLine', line);
        return line;
    };
    // Render or redraw
    GraphDraw.prototype.render = function (noFocus) {
        if (noFocus === void 0) { noFocus = false; }
        if (noFocus) {
            this.activeLayer.pens = [];
            this.hoverLayer.node = null;
            this.hoverLayer.line = null;
        }
        if (this.rendering) {
            return this;
        }
        this.rendering = true;
        this.offscreen.render();
        this.canvas.render();
        this.rendering = false;
    };
    // open - redraw by the data
    GraphDraw.prototype.open = function (data) {
        if (!data) {
            data = { pens: [] };
            this.activeLayer.clear();
            this.hoverLayer.clear();
        }
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        this.divLayer.clear();
        // tslint:disable-next-line:forin
        for (var key in node_1.images) {
            delete node_1.images[key];
        }
        this.animateLayer.stop();
        this.lock(data.locked || status_1.Lock.None);
        if (data.lineName) {
            this.data.lineName = data.lineName;
        }
        this.data.fromArrowType = data.fromArrowType;
        this.data.toArrowType = data.toArrowType;
        this.data.scale = data.scale || 1;
        index_1.Store.set(this.generateStoreKey('LT:scale'), this.data.scale);
        this.dispatch('scale', this.data.scale);
        this.data.bkColor = data.bkColor;
        this.data.bkImage = data.bkImage;
        this.data.pens = [];
        if (data.pens) {
            for (var _i = 0, _a = data.pens; _i < _a.length; _i++) {
                var item = _a[_i];
                if (!item.from) {
                    this.data.pens.push(new node_1.Node(item));
                }
                else {
                    this.data.pens.push(new line_1.Line(item));
                }
            }
        }
        this.data.websocket = data.websocket;
        this.data.grid = data.grid;
        this.data.gridColor = data.gridColor;
        this.data.gridSize = data.gridSize;
        this.data.rule = data.rule;
        this.data.ruleColor = data.ruleColor;
        if (typeof data.data === 'object') {
            this.data.data = JSON.parse(JSON.stringify(data.data));
        }
        else {
            this.data.data = data.data || '';
        }
        this.caches.list = [];
        this.cache();
        this.overflow();
        this.render(true);
        this.animate(true);
        this.openSocket();
    };
    GraphDraw.prototype.openSocket = function (url) {
        this.closeSocket();
        if (url || this.data.websocket) {
            this.socket = new socket_1.Socket(url || this.data.websocket, this.data.pens);
        }
    };
    GraphDraw.prototype.closeSocket = function () {
        if (this.socket) {
            this.socket.close();
        }
    };
    GraphDraw.prototype.overflow = function () {
        var rect = this.getRect();
        var _a = this.canvas, width = _a.width, height = _a.height;
        var ex = rect.ex, ey = rect.ey;
        if (ex > width) {
            width = ex + 200;
        }
        if (ey > height) {
            height = ey + 200;
        }
        this.resize({ width: width, height: height });
    };
    GraphDraw.prototype.setNodeText = function () {
        this.inputObj.text = this.input.value;
        this.input.style.zIndex = '-1';
        this.input.style.left = '-1000px';
        this.input.style.width = '0';
        this.cache();
        this.offscreen.render();
        this.dispatch('setText', this.inputObj);
        this.inputObj = null;
    };
    GraphDraw.prototype.highLight = function (type) {
        this.clearHighLight();
        var pens = this.data.pens || [];
        var activeCell = this.activeLayer.pens[0];
        if (activeCell) {
            for (var i = 0; i < pens.length; i++) {
                var pen = pens[i];
                if (type === 'node' && pen instanceof line_1.Line) {
                    if (activeCell.id === pen.from.id || activeCell.id === pen.to.id) {
                        pen.strokeStyle = this.activeLayer.options.activeColor;
                        pen.fillStyle = this.activeLayer.options.activeColor;
                        this.cacheHighLight.push(pen);
                    }
                }
                if (type === 'line' && pen instanceof node_1.Node && (activeCell.from || activeCell.to)) {
                    if (activeCell.from.id === pen.id || activeCell.to.id === pen.id) {
                        pen.strokeStyle = this.activeLayer.options.activeColor;
                        pen.fillStyle = this.activeLayer.options.activeColor;
                        this.cacheHighLight.push(pen);
                    }
                }
            }
        }
    };
    GraphDraw.prototype.clearHighLight = function () {
        var pens = this.data.pens || [];
        if (this.cacheHighLight && this.cacheHighLight.length > 0) {
            pens.map(function (pen) {
                pen.strokeStyle = pen.sourceColor;
                pen.fillStyle = pen.sourceColor;
                return pen;
            });
        }
        this.cacheHighLight = [];
    };
    GraphDraw.prototype.getMoveIn = function (pt) {
        this.lastHoverNode = this.moveIn.hoverNode;
        this.lastHoverLine = this.moveIn.hoverLine;
        this.moveIn.type = MoveInType.None;
        this.moveIn.hoverNode = null;
        this.moveIn.lineControlPoint = null;
        this.moveIn.hoverLine = null;
        this.hoverLayer.hoverAnchorIndex = -1;
        if (!this.data.locked &&
            !(this.activeLayer.pens.length === 1 && this.activeLayer.pens[0].type) &&
            !this.activeLayer.locked() &&
            this.activeLayer.rotateCPs[0] &&
            this.activeLayer.rotateCPs[0].hit(pt, 15)) {
            this.moveIn.type = MoveInType.Rotate;
            this.divLayer.canvas.style.cursor = "url(\"" + this.options.rotateCursor + "\"), auto";
            return;
        }
        if (this.activeLayer.pens.length > 1 && canvas_1.pointInRect(pt, this.activeLayer.sizeCPs)) {
            this.moveIn.type = MoveInType.Nodes;
        }
        if (!this.data.locked && !this.activeLayer.locked() && !this.options.hideSizeCP) {
            if (this.activeLayer.pens.length > 1 || (!this.activeLayer.pens[0].type && !this.activeLayer.pens[0].hideSizeCP)) {
                for (var i = 0; i < this.activeLayer.sizeCPs.length; ++i) {
                    if (this.activeLayer.sizeCPs[i].hit(pt, 10)) {
                        this.moveIn.type = MoveInType.ResizeCP;
                        this.moveIn.activeAnchorIndex = i;
                        this.divLayer.canvas.style.cursor = resizeCursors[i];
                        return;
                    }
                }
            }
        }
        // In active pen.
        for (var _i = 0, _a = this.activeLayer.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof node_1.Node && this.inNode(pt, item)) {
                return;
            }
            if (item instanceof line_1.Line) {
                for (var i = 0; i < item.controlPoints.length; ++i) {
                    if (!item.locked && item.controlPoints[i].hit(pt, 10)) {
                        item.controlPoints[i].id = i;
                        this.moveIn.type = MoveInType.LineControlPoint;
                        this.moveIn.lineControlPoint = item.controlPoints[i];
                        this.moveIn.hoverLine = item;
                        this.divLayer.canvas.style.cursor = 'pointer';
                        return;
                    }
                }
                if (this.inLine(pt, item)) {
                    return;
                }
            }
        }
        this.divLayer.canvas.style.cursor = 'default';
        var len = this.data.pens.length;
        for (var i = len - 1; i > -1; --i) {
            if (this.data.pens[i].type === pen_1.PenType.Node && this.inNode(pt, this.data.pens[i])) {
                return;
            }
            else if (this.data.pens[i].type === pen_1.PenType.Line && this.inLine(pt, this.data.pens[i])) {
                return;
            }
        }
    };
    GraphDraw.prototype.inChildNode = function (pt, children) {
        if (!children) {
            return null;
        }
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var item = children_1[_i];
            if (item.type === pen_1.PenType.Line) {
                if (this.inLine(pt, item)) {
                    return item;
                }
                continue;
            }
            var node = this.inChildNode(pt, item.children);
            if (node) {
                return node;
            }
            node = this.inNode(pt, item, true);
            if (node) {
                return node;
            }
        }
        return null;
    };
    GraphDraw.prototype.inNode = function (pt, node, inChild) {
        if (inChild === void 0) { inChild = false; }
        if (this.data.locked === status_1.Lock.NoEvent || !node.visible || node.locked === status_1.Lock.NoEvent) {
            return null;
        }
        var child = this.inChildNode(pt, node.children);
        if (child) {
            if (child.type === pen_1.PenType.Line) {
                this.moveIn.activeNode = node;
                this.moveIn.type = MoveInType.Nodes;
            }
            else if (child.stand) {
                this.moveIn.activeNode = child;
                this.moveIn.type = MoveInType.Nodes;
            }
            return child;
        }
        if (node.hit(pt)) {
            this.moveIn.hoverNode = node;
            this.moveIn.type = MoveInType.Nodes;
            !node.locked && (this.divLayer.canvas.style.cursor = 'move');
            // Too small
            if (!(this.options.hideAnchor || node.hideAnchor)) {
                for (var j = 0; j < node.rotatedAnchors.length; ++j) {
                    if (node.rotatedAnchors[j].hit(pt, 10)) {
                        if (!this.mouseDown && node.rotatedAnchors[j].mode === status_1.AnchorMode.In) {
                            continue;
                        }
                        this.moveIn.type = MoveInType.HoverAnchors;
                        this.moveIn.hoverAnchorIndex = j;
                        this.hoverLayer.hoverAnchorIndex = j;
                        // console.log('hit',j)
                        if (this.moveIn.hoverNode.name === 'combine') {
                            this.divLayer.canvas.style.cursor = 'move';
                        }
                        else {
                            this.divLayer.canvas.style.cursor = 'crosshair';
                        }
                        break;
                    }
                }
            }
            if (!inChild) {
                this.moveIn.activeNode = this.moveIn.hoverNode;
            }
            return node;
        }
        if (this.options.hideAnchor || node.hideAnchor || this.data.locked || node.locked) {
            return null;
        }
        if (node.hit(pt, 10)) {
            for (var j = 0; j < node.rotatedAnchors.length; ++j) {
                if (node.rotatedAnchors[j].hit(pt, 10)) {
                    if (!this.mouseDown && node.rotatedAnchors[j].mode === status_1.AnchorMode.In) {
                        continue;
                    }
                    this.moveIn.hoverNode = node;
                    this.moveIn.type = MoveInType.HoverAnchors;
                    this.moveIn.hoverAnchorIndex = j;
                    this.hoverLayer.hoverAnchorIndex = j;
                    this.divLayer.canvas.style.cursor = 'crosshair';
                    if (!inChild) {
                        this.moveIn.activeNode = node;
                    }
                    return node;
                }
            }
        }
        return null;
    };
    GraphDraw.prototype.inLine = function (point, line) {
        if (!line.visible) {
            return null;
        }
        if (line.from.hit(point, 5)) {
            this.moveIn.type = MoveInType.LineFrom;
            this.moveIn.hoverLine = line;
            if (this.data.locked || line.locked) {
                this.divLayer.canvas.style.cursor = 'pointer';
            }
            else {
                this.divLayer.canvas.style.cursor = 'move';
            }
            return line;
        }
        if (line.to.hit(point, 5)) {
            this.moveIn.type = MoveInType.LineTo;
            this.moveIn.hoverLine = line;
            if (this.data.locked || line.locked) {
                this.divLayer.canvas.style.cursor = 'pointer';
            }
            else {
                this.divLayer.canvas.style.cursor = 'move';
            }
            return line;
        }
        if (line.pointIn(point)) {
            this.moveIn.type = MoveInType.LineMove;
            this.moveIn.hoverLine = line;
            this.divLayer.canvas.style.cursor = 'pointer';
            if (line.from.id || line.to.id) {
                this.moveIn.type = MoveInType.Line;
            }
            return line;
        }
        return null;
    };
    GraphDraw.prototype.getLineDock = function (point) {
        this.hoverLayer.dockAnchor = null;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof node_1.Node) {
                if (item.rect.hit(point, 10)) {
                    this.hoverLayer.node = item;
                }
                for (var i = 0; i < item.rotatedAnchors.length; ++i) {
                    if (item.rotatedAnchors[i].mode && item.rotatedAnchors[i].mode !== status_1.AnchorMode.In) {
                        continue;
                    }
                    if (item.rotatedAnchors[i].hit(point, 10)) {
                        point.id = item.id;
                        point.anchorIndex = i;
                        point.direction = item.rotatedAnchors[point.anchorIndex].direction;
                        point.x = item.rotatedAnchors[point.anchorIndex].x;
                        point.y = item.rotatedAnchors[point.anchorIndex].y;
                        this.hoverLayer.dockAnchor = item.rotatedAnchors[i];
                        break;
                    }
                }
            }
            else if (item instanceof line_1.Line) {
                if (item.id === this.hoverLayer.line.id) {
                    continue;
                }
                if (item.from.hit(point, 10)) {
                    point.x = item.from.x;
                    point.y = item.from.y;
                    this.hoverLayer.dockAnchor = item.from;
                    break;
                }
                if (item.to.hit(point, 10)) {
                    point.x = item.to.x;
                    point.y = item.to.y;
                    this.hoverLayer.dockAnchor = item.to;
                    break;
                }
                if (item.controlPoints) {
                    for (var _b = 0, _c = item.controlPoints; _b < _c.length; _b++) {
                        var cp = _c[_b];
                        if (cp.hit(point, 10)) {
                            point.x = cp.x;
                            point.y = cp.y;
                            this.hoverLayer.dockAnchor = cp;
                            break;
                        }
                    }
                }
            }
            if (this.hoverLayer.dockAnchor) {
                break;
            }
        }
        return point;
    };
    GraphDraw.prototype.getPensInRect = function (rect) {
        if (rect.width < 0) {
            rect.width = -rect.width;
            rect.x = rect.ex;
            rect.ex = rect.x + rect.width;
        }
        if (rect.height < 0) {
            rect.height = -rect.height;
            rect.y = rect.ey;
            rect.ey = rect.y + rect.height;
        }
        this.activeLayer.pens = [];
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.locked === status_1.Lock.NoEvent) {
                continue;
            }
            if (item instanceof node_1.Node) {
                if (rect.hitByRect(item.rect)) {
                    this.activeLayer.add(item);
                }
            }
            if (item instanceof line_1.Line) {
                if (rect.hit(item.from) && rect.hit(item.to)) {
                    this.activeLayer.add(item);
                }
            }
        }
    };
    GraphDraw.prototype.getPensInRectCopy = function (rect) {
        if (rect.width < 0) {
            rect.width = -rect.width;
            rect.x = rect.ex;
            rect.ex = rect.x + rect.width;
        }
        if (rect.height < 0) {
            rect.height = -rect.height;
            rect.y = rect.ey;
            rect.ey = rect.y + rect.height;
        }
        this.activeLayer.pens = [];
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.locked === status_1.Lock.NoEvent) {
                continue;
            }
            var isIn = false;
            if (item instanceof node_1.Node) {
                isIn = item.rotatedAnchors.every(function (it) {
                    return rect.x < it.x && it.x < rect.ex && rect.y < it.y && it.y < rect.ey;
                });
                isIn && this.activeLayer.add(item);
            }
            if (item instanceof line_1.Line) {
                var points = [];
                points.push(item.from);
                points.push(item.to);
                if (item.controlPoints.length > 0) {
                    points.push.apply(points, item.controlPoints);
                }
                isIn = points.every(function (it) {
                    return rect.x < it.x && it.x < rect.ex && rect.y < it.y && it.y < rect.ey;
                });
                isIn && this.activeLayer.add(item);
            }
        }
    };
    GraphDraw.prototype.getAngle = function (pt) {
        if (pt.x === this.activeLayer.rect.center.x) {
            return pt.y <= this.activeLayer.rect.center.y ? 0 : 180;
        }
        if (pt.y === this.activeLayer.rect.center.y) {
            return pt.x < this.activeLayer.rect.center.x ? 270 : 90;
        }
        var x = pt.x - this.activeLayer.rect.center.x;
        var y = pt.y - this.activeLayer.rect.center.y;
        var angle = (Math.atan(Math.abs(x / y)) / (2 * Math.PI)) * 360;
        if (x > 0 && y > 0) {
            angle = 180 - angle;
        }
        else if (x < 0 && y > 0) {
            angle += 180;
        }
        else if (x < 0 && y < 0) {
            angle = 360 - angle;
        }
        if (this.activeLayer.pens.length === 1) {
            return angle - this.activeLayer.pens[0].rotate;
        }
        return angle;
    };
    GraphDraw.prototype.showInput = function (item) {
        if (this.data.locked || item.locked || item.hideInput || this.options.hideInput || item.name !== 'text') {
            // if (this.data.locked || item.locked || item.hideInput || this.options.hideInput) {
            return;
        }
        this.inputObj = item;
        var textRect = item.getTextRect();
        this.input.value = item.text || '';
        this.input.style.left = textRect.x + 'px';
        this.input.style.top = textRect.y + 'px';
        this.input.style.width = textRect.width + 'px';
        this.input.style.height = textRect.height + 'px';
        this.input.style.zIndex = '1000';
        this.input.focus();
    };
    GraphDraw.prototype.getRect = function (pens) {
        if (!pens) {
            pens = this.data.pens;
        }
        return rect_2.getRect(pens, this.data.scale);
    };
    // Get a dock rect for moving nodes.
    GraphDraw.prototype.getDockPos = function (offsetX, offsetY) {
        this.hoverLayer.dockLineX = 0;
        this.hoverLayer.dockLineY = 0;
        var offset = {
            x: 0,
            y: 0
        };
        var x = 0;
        var y = 0;
        var disX = dockOffset;
        var disY = dockOffset;
        for (var _i = 0, _a = this.activeLayer.dockWatchers; _i < _a.length; _i++) {
            var activePt = _a[_i];
            for (var _b = 0, _c = this.data.pens; _b < _c.length; _b++) {
                var item = _c[_b];
                if (!(item instanceof node_1.Node) || this.activeLayer.has(item) || item.name === 'text') {
                    continue;
                }
                if (!item.dockWatchers) {
                    item.getDockWatchers();
                }
                for (var _d = 0, _e = item.dockWatchers; _d < _e.length; _d++) {
                    var p = _e[_d];
                    x = Math.abs(p.x - activePt.x - offsetX);
                    if (x < disX) {
                        disX = -99999;
                        offset.x = p.x - activePt.x;
                        this.hoverLayer.dockLineX = p.x | 0;
                    }
                    y = Math.abs(p.y - activePt.y - offsetY);
                    if (y < disY) {
                        disY = -99999;
                        offset.y = p.y - activePt.y;
                        this.hoverLayer.dockLineY = p.y | 0;
                    }
                }
            }
        }
        return offset;
    };
    GraphDraw.prototype.cache = function () {
        if (this.caches.index < this.caches.list.length - 1) {
            this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
        }
        var data = new data_1.GraphDrawData(this.data);
        this.caches.list.push(data);
        if (this.caches.list.length > this.options.cacheLen) {
            this.caches.list.shift();
        }
        this.caches.index = this.caches.list.length - 1;
    };
    GraphDraw.prototype.cacheReplace = function (pens) {
        if (pens && pens.length) {
            var needPenMap = {};
            for (var i = 0, len = pens.length; i < len; i++) {
                var pen = pens[i];
                var id = pen.id;
                if (pen instanceof node_1.Node) {
                    needPenMap[id] = new node_1.Node(pen);
                }
                else if (pen instanceof line_1.Line) {
                    needPenMap[id] = new line_1.Line(pen);
                }
            }
            var cacheListData = this.caches.list[0];
            if (!cacheListData) {
                return;
            }
            for (var i = 0, len = cacheListData.pens.length; i < len; i++) {
                var id = cacheListData.pens[i].id;
                if (needPenMap[id]) {
                    cacheListData.pens[i] = needPenMap[id];
                }
            }
        }
    };
    GraphDraw.prototype.undo = function (noRedo) {
        if (noRedo === void 0) { noRedo = false; }
        if (this.data.locked || this.caches.index < 1) {
            return;
        }
        this.divLayer.clear();
        var data = new data_1.GraphDrawData(this.caches.list[--this.caches.index]);
        this.data.pens.splice(0, this.data.pens.length);
        this.data.pens.push.apply(this.data.pens, data.pens);
        this.render(true);
        this.divLayer.render();
        if (noRedo) {
            this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
        }
        this.dispatch('undo', this.data);
    };
    GraphDraw.prototype.redo = function () {
        if (this.data.locked || this.caches.index > this.caches.list.length - 2) {
            return;
        }
        this.divLayer.clear();
        var data = new data_1.GraphDrawData(this.caches.list[++this.caches.index]);
        this.data.pens.splice(0, this.data.pens.length);
        this.data.pens.push.apply(this.data.pens, data.pens);
        this.render(true);
        this.divLayer.render();
        this.dispatch('redo', this.data);
    };
    GraphDraw.prototype.toImage = function (type, quality, callback, padding, thumbnail) {
        if (thumbnail === void 0) { thumbnail = true; }
        var rect = new rect_1.Rect(0, 0, this.canvas.width, this.canvas.height);
        if (thumbnail) {
            rect = this.getRect();
        }
        if (!padding) {
            padding = {
                left: 10,
                top: 10,
                right: 10,
                bottom: 10
            };
        }
        rect.x -= padding.left;
        rect.y -= padding.top;
        rect.width += padding.left + padding.right;
        rect.height += padding.top + padding.bottom;
        rect.round();
        var srcRect = rect.clone();
        srcRect.scale(this.offscreen.getDpiRatio(), new point_1.Point(0, 0));
        srcRect.round();
        var canvas = document.createElement('canvas');
        canvas.width = srcRect.width;
        canvas.height = srcRect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        var ctx = canvas.getContext('2d');
        if (type && type !== 'image/png') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(this.canvas.canvas, srcRect.x, srcRect.y, srcRect.width, srcRect.height, 0, 0, srcRect.width, srcRect.height);
        if (callback) {
            canvas.toBlob(callback);
            return '';
        }
        return canvas.toDataURL(type, quality);
    };
    GraphDraw.prototype.saveAsImage = function (name, type, quality, padding, thumbnail) {
        if (thumbnail === void 0) { thumbnail = true; }
        var a = document.createElement('a');
        a.setAttribute('download', name || '1.png');
        a.setAttribute('href', this.toImage(type, quality, null, padding, thumbnail));
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, true);
        a.dispatchEvent(evt);
    };
    GraphDraw.prototype["delete"] = function (force) {
        var pens = [];
        var i = 0;
        for (var _i = 0, _a = this.activeLayer.pens; _i < _a.length; _i++) {
            var pen = _a[_i];
            if (!force && pen.locked) {
                continue;
            }
            i = this.find(pen);
            if (i > -1) {
                if (this.data.pens[i].type === pen_1.PenType.Node) {
                    this.divLayer.removeDiv(this.data.pens[i]);
                }
                pens.push.apply(pens, this.data.pens.splice(i, 1));
            }
            this.animateLayer.pens["delete"](pen.id);
        }
        if (!pens.length) {
            return;
        }
        this.render(true);
        this.cache();
        this.dispatch('delete', pens);
    };
    GraphDraw.prototype.removeNode = function (node) {
        var i = this.find(node);
        if (i > -1) {
            this.divLayer.removeDiv(this.data.pens[i]);
            var nodes = this.data.pens.splice(i, 1);
            this.dispatch('delete', {
                nodes: nodes
            });
        }
        this.render(true);
        this.cache();
    };
    GraphDraw.prototype.removeLine = function (line) {
        var i = this.find(line);
        if (i > -1) {
            var lines = this.data.pens.splice(i, 1);
            this.dispatch('delete', {
                lines: lines
            });
        }
        this.render(true);
        this.cache();
    };
    GraphDraw.prototype.cut = function () {
        if (this.data.locked) {
            return;
        }
        this.clipboard = new data_1.GraphDrawData({
            pens: []
        });
        for (var _i = 0, _a = this.activeLayer.pens; _i < _a.length; _i++) {
            var pen = _a[_i];
            this.clipboard.pens.push(pen.clone());
            var i = this.find(pen);
            if (i > -1) {
                if (pen.type === pen_1.PenType.Node) {
                    this.divLayer.removeDiv(this.data.pens[i]);
                }
                this.data.pens.splice(i, 1);
            }
        }
        this.cache();
        this.activeLayer.clear();
        this.hoverLayer.node = null;
        this.moveIn.hoverLine = null;
        this.moveIn.hoverNode = null;
        this.render();
        this.dispatch('delete', {
            pens: this.clipboard.pens
        });
    };
    GraphDraw.prototype.copy = function (type) {
        this.options.disableScale = true;
        this.clipboard = new data_1.GraphDrawData({
            pens: []
        });
        if (type === 'first') {
            this.initCopyData = [];
        }
        if (this.initCopyData.length === 0) {
            this.initCopyData = __spreadArrays(this.activeLayer.pens);
        }
        var pens = this.initCopyData || this.activeLayer.pens;
        var sourceColorList = []; //保存复制前的颜色值
        for (var _i = 0, pens_1 = pens; _i < pens_1.length; _i++) {
            var pen = pens_1[_i];
            pen.copyPreventRotate = true;
            if (pen.name === 'combine') {
                pen.children.forEach(function (it) {
                    sourceColorList.push(it.sourceColor);
                });
            }
            else {
                sourceColorList.push(pen.sourceColor);
            }
            var penCopy = pen.clone();
            if (penCopy.name === 'combine') {
                penCopy.children.map(function (it, i) {
                    it.sourceColor = sourceColorList[i];
                });
            }
            else {
                penCopy.sourceColor = sourceColorList[0];
            }
            this.clipboard.pens.push(penCopy);
        }
    };
    GraphDraw.prototype.paste = function () {
        var _this = this;
        this.unCombineAll();
        if (!this.clipboard || this.data.locked) {
            return;
        }
        var pens = this.clipboard.pens;
        var bool = false;
        if (pens.length === 1 && pens[0].name === 'combine' && pens[0].children.length > 0) {
            bool = pens[0].children.some(function (it) { return it.xCP; });
        }
        console.log('this.isMLNode', this.isMLNode);
        if (!bool && (!this.isMLNode || (this.isMLNode && !this.isMLNode.xCP))) {
            return;
        }
        this.hoverLayer.node = null;
        this.hoverLayer.line = null;
        this.activeLayer.pens = [];
        var idMaps = {};
        var _loop_1 = function (pen) {
            var relativeX = 20;
            var relativeY = -20;
            if (this_1.pasteMouseDown) {
                relativeX = this_1.pasteMouseDown.x - pen.rect.x;
                relativeY = this_1.pasteMouseDown.y - pen.rect.y;
            }
            if (pen.name === 'combine') {
                this_1.newId(pen, idMaps);
                pen.rect.x += relativeX;
                pen.rect.ex += relativeX;
                pen.rect.y += relativeY;
                pen.rect.ey += relativeY;
                pen.rect.center.x += relativeX;
                pen.rect.center.y += relativeY;
                pen.init();
                pen.children.map(function (penSub) {
                    return _this.calcCopyPen(penSub, idMaps, relativeX, relativeY);
                });
            }
            else {
                if (pen.type === pen_1.PenType.Node) {
                    this_1.newId(pen, idMaps);
                    pen.rect.x += relativeX;
                    pen.rect.ex += relativeX;
                    pen.rect.y += relativeY;
                    pen.rect.ey += relativeY;
                    pen.rect.center.x += relativeX;
                    pen.rect.center.y += relativeY;
                    pen.init();
                }
            }
            switch (this_1.pasteDirection) {
                case 'top':
                    pen.translate(-pen.rect.width, -pen.rect.height);
                    if (pen.name === 'combine') {
                        pen.children.map(function (it) {
                            if (it.id === _this.lineLinkML.line.id) {
                                if (_this.lineLinkML.fOrt === 'from') {
                                    it.from.y += pen.rect.height;
                                }
                                if (_this.lineLinkML.fOrt === 'to') {
                                    it.to.y += pen.rect.height;
                                }
                            }
                        });
                    }
                    break;
                case 'left':
                    pen.translate(-pen.rect.width, -pen.rect.height);
                    if (pen.name === 'combine') {
                        pen.children.map(function (it) {
                            if (it.id === _this.lineLinkML.line.id) {
                                if (_this.lineLinkML.fOrt === 'from') {
                                    it.from.x += pen.rect.width;
                                    it.from.y += pen.rect.height;
                                }
                                if (_this.lineLinkML.fOrt === 'to') {
                                    it.to.x += pen.rect.width;
                                    it.to.x += pen.rect.height;
                                }
                            }
                        });
                    }
                    break;
                case 'bottom':
                    break;
                case 'right':
                    if (pen.name === 'combine') {
                        pen.children.map(function (it) {
                            if (it.id === _this.lineLinkML.line.id) {
                                if (_this.lineLinkML.fOrt === 'from') {
                                    it.from.y += pen.rect.height;
                                }
                                if (_this.lineLinkML.fOrt === 'to') {
                                    it.to.y += pen.rect.height;
                                }
                            }
                        });
                    }
                    break;
            }
            this_1.data.pens.push(pen);
            this_1.activeLayer.add(pen);
            this_1.clipboard.pens = [];
        };
        var this_1 = this;
        for (var _i = 0, pens_2 = pens; _i < pens_2.length; _i++) {
            var pen = pens_2[_i];
            _loop_1(pen);
        }
        this.render();
        // this.animate(true);
        this.cache();
        this.copy();
        this.pasteMouseDown = null;
        if (this.clipboard.pens.length > 1) {
            this.dispatch('paste', {
                pens: this.clipboard.pens
            });
        }
        else if (this.activeLayer.pens.length > 0) {
            this.dispatch('paste', this.activeLayer.pens[0]);
        }
    };
    GraphDraw.prototype.unCombineAll = function () {
        var _this = this;
        this.data.pens.map(function (it) {
            if (it.name === 'combine') {
                _this.uncombine(it);
            }
        });
    };
    GraphDraw.prototype.calcCopyPen = function (pen, idMaps, relativeX, relativeY) {
        if (pen instanceof line_1.Line) {
            pen.id = uuid_1.s8();
            var from_1 = new point_1.Point(pen.from.x + relativeX, pen.from.y + relativeY, pen.from.direction, pen.from.anchorIndex, idMaps[pen.from.id]);
            var to_1 = new point_1.Point(pen.to.x + relativeX, pen.to.y + relativeY, pen.to.direction, pen.to.anchorIndex, idMaps[pen.to.id]);
            pen.from = from_1;
            pen.to = to_1;
            this.data.pens.map(function (it) {
                if (it.type === 0 && idMaps[pen.to.id] === it.id) {
                    pen.from = to_1;
                    pen.to = from_1;
                }
            });
            var controlPoints = [];
            for (var _i = 0, _a = pen.controlPoints; _i < _a.length; _i++) {
                var pt = _a[_i];
                controlPoints.push(new point_1.Point(pt.x + relativeX, pt.y + relativeY));
            }
            pen.controlPoints = controlPoints;
            //判断粘贴方向 
            //组合复制粘贴到母线上形成topo关系
            if (this.lastHoverNode) {
                if ([0, 180].includes(this.lastHoverNode.rotate)) {
                    if (!pen.from.id) { //from端链接母线
                        if (pen.from.y > pen.to.y) {
                            this.pasteDirection = 'top';
                        }
                        else {
                            this.pasteDirection = 'bottom';
                        }
                        this.lineLinkML.line = pen;
                        this.lineLinkML.fOrt = 'from';
                        pen.from.anchorIndex = this.moveIn.hoverAnchorIndex;
                        pen.from.id = this.lastHoverNode.id;
                        pen.from.x = pen.to.x;
                        pen.from.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y;
                    }
                    if (!pen.to.id) { //to端链接母线
                        if (pen.from.y > pen.to.y) {
                            this.pasteDirection = 'bottom';
                        }
                        else {
                            this.pasteDirection = 'top';
                        }
                        this.lineLinkML.line = pen;
                        this.lineLinkML.fOrt = 'to';
                        pen.to.anchorIndex = this.moveIn.hoverAnchorIndex;
                        pen.to.id = this.lastHoverNode.id;
                        pen.to.x = pen.from.x;
                        pen.to.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y;
                    }
                }
                else {
                    if (!pen.from.id) { //from端链接母线
                        if (pen.from.x > pen.to.x) {
                            this.pasteDirection = 'left';
                        }
                        else {
                            this.pasteDirection = 'right';
                        }
                        this.lineLinkML.line = pen;
                        this.lineLinkML.fOrt = 'from';
                        pen.from.anchorIndex = this.moveIn.hoverAnchorIndex;
                        pen.from.id = this.lastHoverNode.id;
                        pen.from.x = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x;
                        pen.from.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y;
                    }
                    if (!pen.to.id) { //to端链接母线
                        if (pen.from.x > pen.to.x) {
                            this.pasteDirection = 'right';
                        }
                        else {
                            this.pasteDirection = 'left';
                        }
                        this.lineLinkML.line = pen;
                        this.lineLinkML.fOrt = 'to';
                        pen.to.anchorIndex = this.moveIn.hoverAnchorIndex;
                        pen.to.id = this.lastHoverNode.id;
                        pen.to.x = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].x;
                        pen.to.y = this.lastHoverNode.rotatedAnchors[this.moveIn.hoverAnchorIndex].y;
                    }
                }
            }
            pen.strokeStyle = pen.sourceColor;
            pen.fillStyle = pen.sourceColor;
            return pen;
        }
        if (pen.type === pen_1.PenType.Node) {
            pen.rect.x += relativeX;
            pen.rect.ex += relativeX;
            pen.rect.y += relativeY;
            pen.rect.ey += relativeY;
            pen.rect.center.x += relativeX;
            pen.rect.center.y += relativeY;
            pen.init();
        }
    };
    GraphDraw.prototype.newId = function (node, idMaps) {
        var old = node.id;
        node.id = uuid_1.s8();
        node.ssjg = '';
        node.oid = '';
        node.old = 0;
        node.zyId = '';
        node.scaleNum = this.data.scale * 1.1;
        node.optionType = 'add';
        idMaps[old] = node.id;
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var item = _a[_i];
                this.newId(item, idMaps);
            }
        }
    };
    GraphDraw.prototype.animate = function (autoplay) {
        if (autoplay === void 0) { autoplay = false; }
        this.animateLayer.readyPlay(null, autoplay);
        this.animateLayer.animate();
    };
    GraphDraw.prototype.updateProps = function (cache, pens, isUpdateLine) {
        if (cache === void 0) { cache = true; }
        if (!pens) {
            pens = this.activeLayer.pens;
        }
        for (var _i = 0, pens_3 = pens; _i < pens_3.length; _i++) {
            var pen = pens_3[_i];
            if (pen instanceof node_1.Node) {
                pen.init();
                pen.initRect();
            }
        }
        if (isUpdateLine) { //点击不移动图元不更新线
            this.activeLayer.updateLines(pens);
        }
        this.activeLayer.calcControlPoints();
        this.activeLayer.saveNodeRects();
        this.render();
        // tslint:disable-next-line: no-unused-expression
        cache && this.cache();
    };
    GraphDraw.prototype.lock = function (lock) {
        this.data.locked = lock;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.addToDiv && item.addToDiv();
        }
        this.dispatch('locked', this.data.locked);
    };
    GraphDraw.prototype.lockPens = function (pens, lock) {
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            for (var _b = 0, pens_4 = pens; _b < pens_4.length; _b++) {
                var pen = pens_4[_b];
                if (item.id === pen.id) {
                    item.locked = lock;
                    item.addToDiv && item.addToDiv();
                    break;
                }
            }
        }
        this.dispatch('lockPens', {
            pens: pens,
            lock: lock
        });
    };
    GraphDraw.prototype.top = function (pen) {
        var i = this.find(pen);
        if (i > -1) {
            this.data.pens.push(this.data.pens[i]);
            this.data.pens.splice(i, 1);
        }
    };
    GraphDraw.prototype.bottom = function (pen) {
        var i = this.find(pen);
        if (i > -1) {
            this.data.pens.unshift(this.data.pens[i]);
            this.data.pens.splice(i + 1, 1);
        }
    };
    GraphDraw.prototype.textCombine = function (pens, stand) {
        if (stand === void 0) { stand = true; }
        if (!pens) {
            pens = this.activeLayer.pens;
        }
        var rect = this.getRect(pens);
        for (var _i = 0, pens_5 = pens; _i < pens_5.length; _i++) {
            var item = pens_5[_i];
            var i = this.find(item);
            if (i > -1) {
                this.data.pens.splice(i, 1);
            }
        }
    };
    GraphDraw.prototype.findIndex = function (pen, pens) {
        if (!pens) {
            pens = this.data.pens;
        }
        return pens.findIndex(function (item) { return item.id === pen.id; });
    };
    GraphDraw.prototype.combine = function (pens, stand) {
        if (stand === void 0) { stand = true; }
        if (!pens) {
            pens = this.activeLayer.pens;
        }
        var rect = this.getRect(pens);
        for (var _i = 0, pens_6 = pens; _i < pens_6.length; _i++) {
            var item = pens_6[_i];
            var i = this.findIndex(item);
            if (i > -1) {
                this.data.pens.splice(i, 1);
            }
        }
        var node = new node_1.Node({
            name: 'combine',
            rect: new rect_1.Rect(rect.x, rect.y, rect.width, rect.height),
            text: '',
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            rotate: 0,
            strokeStyle: 'transparent',
            children: []
        });
        for (var i = 0; i < pens.length; ++i) {
            if (pens[i].type === pen_1.PenType.Node && rect.width === pens[i].rect.width && rect.height === pens[i].rect.height) {
                node = pens[i];
                if (!node.children) {
                    node.children = [];
                }
                pens.splice(i, 1);
                break;
            }
        }
        for (var _a = 0, pens_7 = pens; _a < pens_7.length; _a++) {
            var item = pens_7[_a];
            item.stand = stand;
            item.parentId = node.id;
            item.calcRectInParent(node);
            node.children.push(item);
        }
        this.data.pens.push(node);
        this.activeLayer.setPens([node]);
        this.dispatch('node', node);
        this.cache();
    };
    GraphDraw.prototype.uncombine = function (node) {
        if (!node) {
            node = this.activeLayer.pens[0];
        }
        if (!(node instanceof node_1.Node) && node.children) {
            return;
        }
        var children = [];
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var item = _a[_i];
            item.parentId = undefined;
            item.rectInParent = undefined;
            item.locked = status_1.Lock.None;
            if (item instanceof node_1.Node) {
                item.clickCount = 0;
            }
            this.data.pens.push(item);
            children.push(item);
        }
        var i = this.find(node);
        if (i > -1 && node.name === 'combine') {
            this.data.pens.splice(i, 1);
        }
        else {
            node.children = null;
        }
        this.cache();
        this.activeLayer.clear();
        this.hoverLayer.clear();
        return children;
    };
    GraphDraw.prototype.find = function (pen) {
        for (var i = 0; i < this.data.pens.length; ++i) {
            if (pen.id === this.data.pens[i].id) {
                return i;
            }
        }
        return -1;
    };
    GraphDraw.prototype.translate = function (x, y, process, lastEmpty) {
        if (lastEmpty === void 0) { lastEmpty = false; }
        if (!process) {
            this.lastTranlated.x = 0;
            this.lastTranlated.y = 0;
        }
        var offsetX = x - this.lastTranlated.x;
        var offsetY = y - this.lastTranlated.y;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.translate(offsetX, offsetY);
        }
        if (!lastEmpty) {
            this.lastTranlated.x = x;
            this.lastTranlated.y = y;
        }
        this.overflow();
        this.render();
        this.cache();
        this.dispatch('translate', { x: x, y: y });
    };
    //移动到指定点
    GraphDraw.prototype.moveToAssignPoint = function (domId, id, scale) {
        var _this = this;
        var pens = this.data.pens || [];
        if (pens.length === 0) {
            return;
        }
        var dom = document.getElementById(domId);
        var height = dom.clientHeight, width = dom.clientWidth;
        pens.map(function (item) {
            /// 找到当前节点变更样式并移动至画布中心
            if (id == item.id) {
                item.strokeStyle = _this.options.activeColor;
                item.fillStyle = _this.options.activeColor;
                if (_this.data.scale < scale) {
                    _this.scaleTo(_this.data.scale);
                }
                var x = void 0, y = void 0;
                /// 节点类型
                if (item instanceof node_1.Node) {
                    x = -item.rect.center.x + width / 2;
                    y = -item.rect.center.y + height / 2;
                }
                /// 线类型
                if (item instanceof line_1.Line) {
                    x = -((item.from.x + item.to.x) / 2) + width / 2;
                    y = -((item.from.y + item.to.y) / 2) + height / 2;
                }
                // 平移画布
                _this.translate(x, y);
                setTimeout(function () {
                    _this.translate(0, 0);
                }, 0);
            }
        });
    };
    // scale for scaled canvas:
    //   > 1, expand
    //   < 1, reduce
    GraphDraw.prototype.scale = function (scale, center) {
        this.data.scale *= scale;
        !center && (center = this.getRect().center);
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.scale(scale, center);
        }
        this.animateLayer.pens.forEach(function (pen) {
            if (pen instanceof line_1.Line) {
                pen.scale(scale, center);
            }
        });
        index_1.Store.set(this.generateStoreKey('LT:scale'), this.data.scale);
        this.render();
        this.cache();
        this.dispatch('scale', this.data.scale);
    };
    // scale for origin canvas:
    GraphDraw.prototype.scaleTo = function (scale, center) {
        this.scale(scale / this.data.scale, center);
        this.data.scale = scale;
    };
    GraphDraw.prototype.round = function () {
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof node_1.Node) {
                item.round();
            }
        }
    };
    GraphDraw.prototype.generateStoreKey = function (key) {
        return this.id + "-" + key;
    };
    GraphDraw.prototype.createMarkdownTip = function () {
        this.tipMarkdown = document.createElement('div');
        this.tipMarkdown.style.position = 'fixed';
        this.tipMarkdown.style.zIndex = '-1';
        this.tipMarkdown.style.left = '-9999px';
        this.tipMarkdown.style.width = 'auto';
        this.tipMarkdown.style.outline = 'none';
        this.tipMarkdown.style.border = '1px solid #d0d0d0';
        this.tipMarkdown.style.backgroundColor = '#fff';
        this.tipMarkdown.style.padding = '10px 15px';
        this.tipMarkdown.style.overflowY = 'auto';
        this.tipMarkdown.style.minHeight = '30px';
        this.tipMarkdown.style.borderRadius = '5px';
        this.tipMarkdown.style.maxHeight = '260px';
        document.body.appendChild(this.tipMarkdown);
        return this.tipMarkdown;
    };
    GraphDraw.prototype.showTip = function (data, pos) {
        if (!this.data.locked || !data || (!data.markdown && !data.tipId && !data.title) || data.id === this.tip) {
            return;
        }
        if (data.title) {
            this.divLayer.canvas.title = data.title;
            this.tip = data.id;
            return;
        }
        if (data.tipId) {
            this.tipElem = document.getElementById(data.tipId);
        }
        var elem = this.tipElem;
        if (data.markdown) {
            elem = this.tipMarkdown;
            var marked = window.marked;
            if (marked) {
                this.tipMarkdown.innerHTML = marked(data.markdown);
            }
            else {
                this.tipMarkdown.innerHTML = data.markdown;
            }
            var a = this.tipMarkdown.getElementsByTagName('A');
            for (var i = 0; i < a.length; ++i) {
                a[i].setAttribute('target', '_blank');
            }
        }
        if (!elem) {
            return;
        }
        var parentRect = this.parentElem.getBoundingClientRect();
        var elemRect = elem.getBoundingClientRect();
        var x = pos.x + parentRect.left - elemRect.width / 2;
        var y = pos.y + parentRect.top;
        if (data instanceof node_1.Node) {
            x = parentRect.left + data.rect.center.x - elemRect.width / 2;
            y = parentRect.top + data.rect.ey;
        }
        x -= this.parentElem.scrollLeft;
        y -= this.parentElem.scrollTop;
        if (x < 0) {
            x = 0;
        }
        if (x + elemRect.width > document.body.clientWidth) {
            x = document.body.clientWidth - elemRect.width;
        }
        if (y + elemRect.height > document.body.clientHeight) {
            y = document.body.clientHeight - elemRect.height;
        }
        elem.style.position = 'fixed';
        elem.style.left = x + 100 + 'px';
        elem.style.top = y + 80 + 'px';
        elem.style.zIndex = '100';
        this.tip = data.id;
        this.dispatch('tip', elem);
    };
    GraphDraw.prototype.hideTip = function () {
        if (!this.tip) {
            return;
        }
        this.tipMarkdown.style.left = '-9999px';
        this.tipMarkdown.style.zIndex = '-1';
        if (this.tipElem) {
            this.tipElem.style.left = '-9999px';
            this.tipElem.style.zIndex = '-1';
            this.tipElem = null;
        }
        this.divLayer.canvas.title = '';
        this.tip = '';
    };
    GraphDraw.prototype.scroll = function (x, y) {
        var _this = this;
        if (this.scrolling) {
            return;
        }
        this.scrolling = true;
        this.parentElem.scrollLeft += x;
        this.parentElem.scrollTop += y;
        setTimeout(function () {
            _this.scrolling = false;
        }, 700);
    };
    GraphDraw.prototype.toComponent = function (pens) {
        if (!pens) {
            pens = this.data.pens;
        }
        var rect = this.getRect(pens);
        var node = new node_1.Node({
            name: 'combine',
            rect: new rect_1.Rect(rect.x, rect.y, rect.width, rect.height),
            text: '',
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            strokeStyle: 'transparent',
            children: []
        });
        for (var _i = 0, pens_8 = pens; _i < pens_8.length; _i++) {
            var item = pens_8[_i];
            if (item.type === pen_1.PenType.Node && rect.width === item.rect.width && rect.height === item.rect.height) {
                node = item;
                if (!node.children) {
                    node.children = [];
                }
                break;
            }
        }
        for (var _a = 0, pens_9 = pens; _a < pens_9.length; _a++) {
            var item = pens_9[_a];
            if (item !== node) {
                item.parentId = node.id;
                item.calcRectInParent(node);
                node.children.push(item);
            }
        }
        return node;
    };
    GraphDraw.prototype.clearBkImg = function () {
        this.canvas.clearBkImg();
    };
    GraphDraw.prototype.dispatch = function (event, data) {
        if (this.options.on) {
            this.options.on(event, data);
        }
    };
    GraphDraw.prototype.getValue = function (idOrTag, attr) {
        if (attr === void 0) { attr = 'text'; }
        var pen;
        this.data.pens.forEach(function (item) {
            if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
                pen = item;
                return;
            }
        });
        return pen[attr];
    };
    GraphDraw.prototype.setValue = function (idOrTag, val, attr) {
        if (attr === void 0) { attr = 'text'; }
        var pen;
        this.data.pens.forEach(function (item) {
            if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
                pen = item;
                return;
            }
        });
        pen[attr] = val;
    };
    GraphDraw.prototype.destroy = function () {
        this.subcribe.unsubscribe();
        this.subcribeRender.unsubscribe();
        this.subcribeImage.unsubscribe();
        this.subcribeAnimateEnd.unsubscribe();
        this.subcribeAnimateMoved.unsubscribe();
        this.subcribeMediaEnd.unsubscribe();
        this.animateLayer.destroy();
        this.divLayer.destroy();
        document.body.removeChild(this.tipMarkdown);
        window.removeEventListener('resize', this.winResize);
        this.closeSocket();
        window.topology = null;
    };
    GraphDraw.prototype.fitView = function (viewPadding) {
        if (!this.hasView())
            return;
        // 1. 重置画布尺寸为容器尺寸
        var parentElem = this.canvas.parentElem;
        var width = parentElem.offsetWidth, height = parentElem.offsetHeight;
        this.resize({
            width: width,
            height: height
        });
        // 2. 图形居中
        this.centerView(viewPadding);
        // 3. 获取设置的留白值
        var padding = padding_1.formatPadding(viewPadding || this.options.viewPadding);
        // 4. 获取图形尺寸
        var rect = this.getRect();
        // 6. 计算缩放比
        var w = (width - padding[1] - padding[3]) / rect.width;
        var h = (height - padding[0] - padding[2]) / rect.height;
        var ratio = w;
        if (w > h) {
            ratio = h;
        }
        this.scale(ratio);
    };
    GraphDraw.prototype.centerView = function (padding) {
        if (!this.hasView())
            return;
        var rect = this.getRect();
        var viewCenter = this.getViewCenter(padding);
        var center = rect.center;
        this.translate(viewCenter.x - center.x, viewCenter.y - center.y);
        var parentElem = this.canvas.parentElem;
        var x = (parentElem.scrollWidth - parentElem.offsetWidth) / 2;
        var y = (parentElem.scrollHeight - parentElem.offsetHeight) / 2;
        parentElem.scrollTop = y;
        parentElem.scrollLeft = x;
        return true;
    };
    GraphDraw.prototype.hasView = function () {
        var rect = this.getRect();
        return !(rect.width === 99999 || rect.height === 99999);
    };
    GraphDraw.prototype.getViewCenter = function (viewPadding) {
        var padding = padding_1.formatPadding(viewPadding || this.options.viewPadding);
        var _a = this.canvas, width = _a.width, height = _a.height;
        return {
            x: (width - padding[1] - padding[3]) / 2 + padding[3],
            y: (height - padding[0] - padding[2]) / 2 + padding[0]
        };
    };
    GraphDraw.prototype.throttle = function (fn, delay) {
        if (delay === void 0) { delay = 200; }
        var pre;
        return function () {
            var args = arguments;
            var that = this;
            var now = Date.now();
            if (pre && now - pre > delay) {
                fn.apply(that, args);
                pre = Date.now();
            }
            else {
                fn.apply(that, args);
            }
        };
    };
    GraphDraw.prototype.restoreColor = function () {
        var _this = this;
        this.data.pens.map(function (it) {
            if (it.children && it.children.length > 0) {
                it.children.map(function (is) {
                    is.strokeStyle = is.sourceColor;
                    is.fillStyle = is.sourceColor;
                    if (is.name === "text") {
                        is.font.color = is.sourceColor;
                    }
                });
                _this.uncombine(it);
            }
            else {
                it.strokeStyle = it.sourceColor;
                it.fillStyle = it.sourceColor;
            }
            if (it.name === "text") {
                it.font.color = it.sourceColor;
            }
        });
        this.render();
    };
    return GraphDraw;
}());
exports.GraphDraw = GraphDraw;
