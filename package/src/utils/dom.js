"use strict";
exports.__esModule = true;
exports.loadJS = exports.createDiv = void 0;
var index_1 = require("./../store/index");
function createDiv(node) {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.outline = 'none';
    div.style.left = '-9999px';
    div.style.bottom = '-9999px';
    div.style.width = node.rect.width + 'px';
    div.style.height = node.rect.height + '2px';
    if (node.elementId) {
        div.id = node.elementId;
    }
    return div;
}
exports.createDiv = createDiv;
function loadJS(url, callback, render) {
    var loaderScript = document.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.src = url;
    loaderScript.addEventListener('load', function () {
        if (callback) {
            callback();
        }
        // how to do
        if (render) {
            index_1.Store.set('LT:render', true);
        }
    });
    document.body.appendChild(loaderScript);
}
exports.loadJS = loadJS;
