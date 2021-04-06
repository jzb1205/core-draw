"use strict";
exports.__esModule = true;
exports.DefalutOptions = exports.KeydownType = exports.KeyType = void 0;
var KeyType;
(function (KeyType) {
    KeyType[KeyType["None"] = -1] = "None";
    KeyType[KeyType["CtrlOrAlt"] = 0] = "CtrlOrAlt";
    KeyType[KeyType["Ctrl"] = 1] = "Ctrl";
    KeyType[KeyType["Shift"] = 2] = "Shift";
    KeyType[KeyType["Alt"] = 3] = "Alt";
})(KeyType = exports.KeyType || (exports.KeyType = {}));
var KeydownType;
(function (KeydownType) {
    KeydownType[KeydownType["None"] = -1] = "None";
    KeydownType[KeydownType["Document"] = 0] = "Document";
    KeydownType[KeydownType["Canvas"] = 1] = "Canvas";
})(KeydownType = exports.KeydownType || (exports.KeydownType = {}));
exports.DefalutOptions = {
    cacheLen: 30,
    font: {
        color: '#222',
        fontFamily: '"Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial',
        fontSize: 12,
        lineHeight: 1.5,
        textAlign: 'center',
        textBaseline: 'middle'
    },
    color: '#222',
    hoverColor: '#fa541c',
    dragColor: '#1890ff',
    activeColor: '#1890ff',
    rotateCursor: '/assets/img/rotate.cur',
    minScale: 10,
    maxScale: 100,
    keydown: KeydownType.Document,
    moveSize: 1,
    maxZoom: 1.1,
    minZoom: 0.9,
    viewPadding: 50,
    tolarence: 20,
    reverseSymbolList: []
};
