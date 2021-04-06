"use strict";
exports.__esModule = true;
exports.flatNodes = void 0;
function flatNodes(nodes) {
    var result = [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var item = nodes_1[_i];
        if (item.type) {
            continue;
        }
        result.push(item);
        if (item.children) {
            result.push.apply(result, flatNodes(item.children));
        }
    }
    return result;
}
exports.flatNodes = flatNodes;
