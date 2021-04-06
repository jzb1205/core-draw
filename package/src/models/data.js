"use strict";
exports.__esModule = true;
exports.TopologyData = void 0;
var node_1 = require("./node");
var line_1 = require("./line");
var status_1 = require("./status");
var TopologyData = /** @class */ (function () {
    function TopologyData(json) {
        this.pens = [];
        this.lineName = 'polyline';
        this.fromArrowType = 'none';
        this.toArrowType = 'none';
        this.scale = 20;
        this.locked = status_1.Lock.None;
        this.gridColor = '#f3f3f3';
        this.gridSize = 10;
        this.ruleColor = '#888';
        if (json) {
            this.pens = [];
            for (var _i = 0, _a = json.pens; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.from) { //线和节点分支
                    this.pens.push(new line_1.Line(item));
                }
                else {
                    this.pens.push(new node_1.Node(item));
                }
            }
            this.lineName = json.lineName || 'polyline'; //连接线的样式  直线line  折线polyline  贝沙尔曲线curve  默认贝沙尔曲线
            this.fromArrowType = json.fromArrowType || 'none'; //连接线起始样式
            this.toArrowType = json.toArrowType || 'none'; //连接线终点样式
            this.scale = json.scale || 1;
            this.locked = json.locked || status_1.Lock.None;
            this.bkImage = json.bkImage;
            this.bkColor = json.bkColor;
            this.grid = json.grid;
            if (typeof json.data === 'object') {
                this.data = JSON.parse(JSON.stringify(json.data));
            }
            else {
                this.data = json.data || '';
            }
        }
    }
    return TopologyData;
}());
exports.TopologyData = TopologyData;
