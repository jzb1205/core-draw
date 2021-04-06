"use strict";
exports.__esModule = true;
// curve
var curve_1 = require("./curve");
// line
var line_1 = require("./line");
// polyline
var polyline_1 = require("./polyline");
exports["default"] = {
    // curve
    curve: curve_1.curve,
    curveControlPoints: curve_1.curveControlPoints,
    calcCurveControlPoints: curve_1.calcCurveControlPoints,
    pointInCurve: curve_1.pointInCurve,
    getBezierPoint: curve_1.getBezierPoint,
    calcMindControlPoints: curve_1.calcMindControlPoints,
    // line
    line: line_1.line,
    lineControlPoints: line_1.lineControlPoints,
    calcLineControlPoints: line_1.calcLineControlPoints,
    // polyline
    polyline: polyline_1.polyline,
    polylineControlPoints: polyline_1.polylineControlPoints,
    calcPolylineControlPoints: polyline_1.calcPolylineControlPoints,
    pointInPolyline: polyline_1.pointInPolyline,
    dockPolylineControlPoint: polyline_1.dockPolylineControlPoint
};
