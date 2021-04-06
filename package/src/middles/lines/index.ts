// curve
import { curve,curveControlPoints,calcCurveControlPoints,pointInCurve ,getBezierPoint,calcMindControlPoints} from './curve'
// line
import { line, lineControlPoints,calcLineControlPoints} from './line'
// polyline
import { polyline,polylineControlPoints,calcPolylineControlPoints,pointInPolyline,dockPolylineControlPoint } from './polyline'

export default {
  // curve
  curve,
  curveControlPoints,
  calcCurveControlPoints,
  pointInCurve,
  getBezierPoint,
  calcMindControlPoints,
  // line
  line,
  lineControlPoints,
  calcLineControlPoints,
  // polyline
  polyline,
  polylineControlPoints,
  calcPolylineControlPoints,
  pointInPolyline,
  dockPolylineControlPoint
}