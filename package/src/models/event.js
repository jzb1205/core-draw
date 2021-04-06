"use strict";
exports.__esModule = true;
exports.EventAction = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType[EventType["Click"] = 0] = "Click";
    EventType[EventType["DblClick"] = 1] = "DblClick";
    EventType[EventType["WebSocket"] = 2] = "WebSocket";
})(EventType = exports.EventType || (exports.EventType = {}));
var EventAction;
(function (EventAction) {
    EventAction[EventAction["Link"] = 0] = "Link";
    EventAction[EventAction["Animate"] = 1] = "Animate";
    EventAction[EventAction["Function"] = 2] = "Function";
    EventAction[EventAction["WindowFn"] = 3] = "WindowFn";
})(EventAction = exports.EventAction || (exports.EventAction = {}));
