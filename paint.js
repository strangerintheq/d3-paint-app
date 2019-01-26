(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = require('./lib/svgpath');

},{"./lib/svgpath":6}],2:[function(require,module,exports){
// Convert an arc to a sequence of cubic bézier curves
//
'use strict';


var TAU = Math.PI * 2;


/* eslint-disable space-infix-ops */

// Calculate an angle between two vectors
//
function vector_angle(ux, uy, vx, vy) {
  var sign = (ux * vy - uy * vx < 0) ? -1 : 1;
  var umag = Math.sqrt(ux * ux + uy * uy);
  var vmag = Math.sqrt(ux * ux + uy * uy);
  var dot  = ux * vx + uy * vy;
  var div  = dot / (umag * vmag);

  // rounding errors, e.g. -1.0000000000000002 can screw up this
  if (div >  1.0) { div =  1.0; }
  if (div < -1.0) { div = -1.0; }

  return sign * Math.acos(div);
}


// Convert from endpoint to center parameterization,
// see http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
//
// Return [cx, cy, theta1, delta_theta]
//
function get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi) {
  // Step 1.
  //
  // Moving an ellipse so origin will be the middlepoint between our two
  // points. After that, rotate it to line up ellipse axes with coordinate
  // axes.
  //
  var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
  var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

  var rx_sq  =  rx * rx;
  var ry_sq  =  ry * ry;
  var x1p_sq = x1p * x1p;
  var y1p_sq = y1p * y1p;

  // Step 2.
  //
  // Compute coordinates of the centre of this ellipse (cx', cy')
  // in the new coordinate system.
  //
  var radicant = (rx_sq * ry_sq) - (rx_sq * y1p_sq) - (ry_sq * x1p_sq);

  if (radicant < 0) {
    // due to rounding errors it might be e.g. -1.3877787807814457e-17
    radicant = 0;
  }

  radicant /=   (rx_sq * y1p_sq) + (ry_sq * x1p_sq);
  radicant = Math.sqrt(radicant) * (fa === fs ? -1 : 1);

  var cxp = radicant *  rx/ry * y1p;
  var cyp = radicant * -ry/rx * x1p;

  // Step 3.
  //
  // Transform back to get centre coordinates (cx, cy) in the original
  // coordinate system.
  //
  var cx = cos_phi*cxp - sin_phi*cyp + (x1+x2)/2;
  var cy = sin_phi*cxp + cos_phi*cyp + (y1+y2)/2;

  // Step 4.
  //
  // Compute angles (theta1, delta_theta).
  //
  var v1x =  (x1p - cxp) / rx;
  var v1y =  (y1p - cyp) / ry;
  var v2x = (-x1p - cxp) / rx;
  var v2y = (-y1p - cyp) / ry;

  var theta1 = vector_angle(1, 0, v1x, v1y);
  var delta_theta = vector_angle(v1x, v1y, v2x, v2y);

  if (fs === 0 && delta_theta > 0) {
    delta_theta -= TAU;
  }
  if (fs === 1 && delta_theta < 0) {
    delta_theta += TAU;
  }

  return [ cx, cy, theta1, delta_theta ];
}

//
// Approximate one unit arc segment with bézier curves,
// see http://math.stackexchange.com/questions/873224
//
function approximate_unit_arc(theta1, delta_theta) {
  var alpha = 4/3 * Math.tan(delta_theta/4);

  var x1 = Math.cos(theta1);
  var y1 = Math.sin(theta1);
  var x2 = Math.cos(theta1 + delta_theta);
  var y2 = Math.sin(theta1 + delta_theta);

  return [ x1, y1, x1 - y1*alpha, y1 + x1*alpha, x2 + y2*alpha, y2 - x2*alpha, x2, y2 ];
}

module.exports = function a2c(x1, y1, x2, y2, fa, fs, rx, ry, phi) {
  var sin_phi = Math.sin(phi * TAU / 360);
  var cos_phi = Math.cos(phi * TAU / 360);

  // Make sure radii are valid
  //
  var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
  var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

  if (x1p === 0 && y1p === 0) {
    // we're asked to draw line to itself
    return [];
  }

  if (rx === 0 || ry === 0) {
    // one of the radii is zero
    return [];
  }


  // Compensate out-of-range radii
  //
  rx = Math.abs(rx);
  ry = Math.abs(ry);

  var lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }


  // Get center parameters (cx, cy, theta1, delta_theta)
  //
  var cc = get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi);

  var result = [];
  var theta1 = cc[2];
  var delta_theta = cc[3];

  // Split an arc to multiple segments, so each segment
  // will be less than τ/4 (= 90°)
  //
  var segments = Math.max(Math.ceil(Math.abs(delta_theta) / (TAU / 4)), 1);
  delta_theta /= segments;

  for (var i = 0; i < segments; i++) {
    result.push(approximate_unit_arc(theta1, delta_theta));
    theta1 += delta_theta;
  }

  // We have a bezier approximation of a unit circle,
  // now need to transform back to the original ellipse
  //
  return result.map(function (curve) {
    for (var i = 0; i < curve.length; i += 2) {
      var x = curve[i + 0];
      var y = curve[i + 1];

      // scale
      x *= rx;
      y *= ry;

      // rotate
      var xp = cos_phi*x - sin_phi*y;
      var yp = sin_phi*x + cos_phi*y;

      // translate
      curve[i + 0] = xp + cc[0];
      curve[i + 1] = yp + cc[1];
    }

    return curve;
  });
};

},{}],3:[function(require,module,exports){
'use strict';

/* eslint-disable space-infix-ops */

// The precision used to consider an ellipse as a circle
//
var epsilon = 0.0000000001;

// To convert degree in radians
//
var torad = Math.PI / 180;

// Class constructor :
//  an ellipse centred at 0 with radii rx,ry and x - axis - angle ax.
//
function Ellipse(rx, ry, ax) {
  if (!(this instanceof Ellipse)) { return new Ellipse(rx, ry, ax); }
  this.rx = rx;
  this.ry = ry;
  this.ax = ax;
}

// Apply a linear transform m to the ellipse
// m is an array representing a matrix :
//    -         -
//   | m[0] m[2] |
//   | m[1] m[3] |
//    -         -
//
Ellipse.prototype.transform = function (m) {
  // We consider the current ellipse as image of the unit circle
  // by first scale(rx,ry) and then rotate(ax) ...
  // So we apply ma =  m x rotate(ax) x scale(rx,ry) to the unit circle.
  var c = Math.cos(this.ax * torad), s = Math.sin(this.ax * torad);
  var ma = [
    this.rx * (m[0]*c + m[2]*s),
    this.rx * (m[1]*c + m[3]*s),
    this.ry * (-m[0]*s + m[2]*c),
    this.ry * (-m[1]*s + m[3]*c)
  ];

  // ma * transpose(ma) = [ J L ]
  //                      [ L K ]
  // L is calculated later (if the image is not a circle)
  var J = ma[0]*ma[0] + ma[2]*ma[2],
      K = ma[1]*ma[1] + ma[3]*ma[3];

  // the discriminant of the characteristic polynomial of ma * transpose(ma)
  var D = ((ma[0]-ma[3])*(ma[0]-ma[3]) + (ma[2]+ma[1])*(ma[2]+ma[1])) *
          ((ma[0]+ma[3])*(ma[0]+ma[3]) + (ma[2]-ma[1])*(ma[2]-ma[1]));

  // the "mean eigenvalue"
  var JK = (J + K) / 2;

  // check if the image is (almost) a circle
  if (D < epsilon * JK) {
    // if it is
    this.rx = this.ry = Math.sqrt(JK);
    this.ax = 0;
    return this;
  }

  // if it is not a circle
  var L = ma[0]*ma[1] + ma[2]*ma[3];

  D = Math.sqrt(D);

  // {l1,l2} = the two eigen values of ma * transpose(ma)
  var l1 = JK + D/2,
      l2 = JK - D/2;
  // the x - axis - rotation angle is the argument of the l1 - eigenvector
  this.ax = (Math.abs(L) < epsilon && Math.abs(l1 - K) < epsilon) ?
    90
  :
    Math.atan(Math.abs(L) > Math.abs(l1 - K) ?
      (l1 - J) / L
    :
      L / (l1 - K)
    ) * 180 / Math.PI;

  // if ax > 0 => rx = sqrt(l1), ry = sqrt(l2), else exchange axes and ax += 90
  if (this.ax >= 0) {
    // if ax in [0,90]
    this.rx = Math.sqrt(l1);
    this.ry = Math.sqrt(l2);
  } else {
    // if ax in ]-90,0[ => exchange axes
    this.ax += 90;
    this.rx = Math.sqrt(l2);
    this.ry = Math.sqrt(l1);
  }

  return this;
};

// Check if the ellipse is (almost) degenerate, i.e. rx = 0 or ry = 0
//
Ellipse.prototype.isDegenerate = function () {
  return (this.rx < epsilon * this.ry || this.ry < epsilon * this.rx);
};

module.exports = Ellipse;

},{}],4:[function(require,module,exports){
'use strict';

// combine 2 matrixes
// m1, m2 - [a, b, c, d, e, g]
//
function combine(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}


function Matrix() {
  if (!(this instanceof Matrix)) { return new Matrix(); }
  this.queue = [];   // list of matrixes to apply
  this.cache = null; // combined matrix cache
}


Matrix.prototype.matrix = function (m) {
  if (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0) {
    return this;
  }
  this.cache = null;
  this.queue.push(m);
  return this;
};


Matrix.prototype.translate = function (tx, ty) {
  if (tx !== 0 || ty !== 0) {
    this.cache = null;
    this.queue.push([ 1, 0, 0, 1, tx, ty ]);
  }
  return this;
};


Matrix.prototype.scale = function (sx, sy) {
  if (sx !== 1 || sy !== 1) {
    this.cache = null;
    this.queue.push([ sx, 0, 0, sy, 0, 0 ]);
  }
  return this;
};


Matrix.prototype.rotate = function (angle, rx, ry) {
  var rad, cos, sin;

  if (angle !== 0) {
    this.translate(rx, ry);

    rad = angle * Math.PI / 180;
    cos = Math.cos(rad);
    sin = Math.sin(rad);

    this.queue.push([ cos, sin, -sin, cos, 0, 0 ]);
    this.cache = null;

    this.translate(-rx, -ry);
  }
  return this;
};


Matrix.prototype.skewX = function (angle) {
  if (angle !== 0) {
    this.cache = null;
    this.queue.push([ 1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0 ]);
  }
  return this;
};


Matrix.prototype.skewY = function (angle) {
  if (angle !== 0) {
    this.cache = null;
    this.queue.push([ 1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0 ]);
  }
  return this;
};


// Flatten queue
//
Matrix.prototype.toArray = function () {
  if (this.cache) {
    return this.cache;
  }

  if (!this.queue.length) {
    this.cache = [ 1, 0, 0, 1, 0, 0 ];
    return this.cache;
  }

  this.cache = this.queue[0];

  if (this.queue.length === 1) {
    return this.cache;
  }

  for (var i = 1; i < this.queue.length; i++) {
    this.cache = combine(this.cache, this.queue[i]);
  }

  return this.cache;
};


// Apply list of matrixes to (x,y) point.
// If `isRelative` set, `translate` component of matrix will be skipped
//
Matrix.prototype.calc = function (x, y, isRelative) {
  var m;

  // Don't change point on empty transforms queue
  if (!this.queue.length) { return [ x, y ]; }

  // Calculate final matrix, if not exists
  //
  // NB. if you deside to apply transforms to point one-by-one,
  // they should be taken in reverse order

  if (!this.cache) {
    this.cache = this.toArray();
  }

  m = this.cache;

  // Apply matrix to point
  return [
    x * m[0] + y * m[2] + (isRelative ? 0 : m[4]),
    x * m[1] + y * m[3] + (isRelative ? 0 : m[5])
  ];
};


module.exports = Matrix;

},{}],5:[function(require,module,exports){
'use strict';


var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };

var SPECIAL_SPACES = [
  0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
  0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF
];

function isSpace(ch) {
  return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029) || // Line terminators
    // White spaces
    (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
    (ch >= 0x1680 && SPECIAL_SPACES.indexOf(ch) >= 0);
}

function isCommand(code) {
  /*eslint-disable no-bitwise*/
  switch (code | 0x20) {
    case 0x6D/* m */:
    case 0x7A/* z */:
    case 0x6C/* l */:
    case 0x68/* h */:
    case 0x76/* v */:
    case 0x63/* c */:
    case 0x73/* s */:
    case 0x71/* q */:
    case 0x74/* t */:
    case 0x61/* a */:
    case 0x72/* r */:
      return true;
  }
  return false;
}

function isDigit(code) {
  return (code >= 48 && code <= 57);   // 0..9
}

function isDigitStart(code) {
  return (code >= 48 && code <= 57) || /* 0..9 */
          code === 0x2B || /* + */
          code === 0x2D || /* - */
          code === 0x2E;   /* . */
}


function State(path) {
  this.index  = 0;
  this.path   = path;
  this.max    = path.length;
  this.result = [];
  this.param  = 0.0;
  this.err    = '';
  this.segmentStart = 0;
  this.data   = [];
}

function skipSpaces(state) {
  while (state.index < state.max && isSpace(state.path.charCodeAt(state.index))) {
    state.index++;
  }
}


function scanParam(state) {
  var start = state.index,
      index = start,
      max = state.max,
      zeroFirst = false,
      hasCeiling = false,
      hasDecimal = false,
      hasDot = false,
      ch;

  if (index >= max) {
    state.err = 'SvgPath: missed param (at pos ' + index + ')';
    return;
  }
  ch = state.path.charCodeAt(index);

  if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
    index++;
    ch = (index < max) ? state.path.charCodeAt(index) : 0;
  }

  // This logic is shamelessly borrowed from Esprima
  // https://github.com/ariya/esprimas
  //
  if (!isDigit(ch) && ch !== 0x2E/* . */) {
    state.err = 'SvgPath: param should start with 0..9 or `.` (at pos ' + index + ')';
    return;
  }

  if (ch !== 0x2E/* . */) {
    zeroFirst = (ch === 0x30/* 0 */);
    index++;

    ch = (index < max) ? state.path.charCodeAt(index) : 0;

    if (zeroFirst && index < max) {
      // decimal number starts with '0' such as '09' is illegal.
      if (ch && isDigit(ch)) {
        state.err = 'SvgPath: numbers started with `0` such as `09` are ilegal (at pos ' + start + ')';
        return;
      }
    }

    while (index < max && isDigit(state.path.charCodeAt(index))) {
      index++;
      hasCeiling = true;
    }
    ch = (index < max) ? state.path.charCodeAt(index) : 0;
  }

  if (ch === 0x2E/* . */) {
    hasDot = true;
    index++;
    while (isDigit(state.path.charCodeAt(index))) {
      index++;
      hasDecimal = true;
    }
    ch = (index < max) ? state.path.charCodeAt(index) : 0;
  }

  if (ch === 0x65/* e */ || ch === 0x45/* E */) {
    if (hasDot && !hasCeiling && !hasDecimal) {
      state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
      return;
    }

    index++;

    ch = (index < max) ? state.path.charCodeAt(index) : 0;
    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      index++;
    }
    if (index < max && isDigit(state.path.charCodeAt(index))) {
      while (index < max && isDigit(state.path.charCodeAt(index))) {
        index++;
      }
    } else {
      state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
      return;
    }
  }

  state.index = index;
  state.param = parseFloat(state.path.slice(start, index)) + 0.0;
}


function finalizeSegment(state) {
  var cmd, cmdLC;

  // Process duplicated commands (without comand name)

  // This logic is shamelessly borrowed from Raphael
  // https://github.com/DmitryBaranovskiy/raphael/
  //
  cmd   = state.path[state.segmentStart];
  cmdLC = cmd.toLowerCase();

  var params = state.data;

  if (cmdLC === 'm' && params.length > 2) {
    state.result.push([ cmd, params[0], params[1] ]);
    params = params.slice(2);
    cmdLC = 'l';
    cmd = (cmd === 'm') ? 'l' : 'L';
  }

  if (cmdLC === 'r') {
    state.result.push([ cmd ].concat(params));
  } else {

    while (params.length >= paramCounts[cmdLC]) {
      state.result.push([ cmd ].concat(params.splice(0, paramCounts[cmdLC])));
      if (!paramCounts[cmdLC]) {
        break;
      }
    }
  }
}


function scanSegment(state) {
  var max = state.max,
      cmdCode, comma_found, need_params, i;

  state.segmentStart = state.index;
  cmdCode = state.path.charCodeAt(state.index);

  if (!isCommand(cmdCode)) {
    state.err = 'SvgPath: bad command ' + state.path[state.index] + ' (at pos ' + state.index + ')';
    return;
  }

  need_params = paramCounts[state.path[state.index].toLowerCase()];

  state.index++;
  skipSpaces(state);

  state.data = [];

  if (!need_params) {
    // Z
    finalizeSegment(state);
    return;
  }

  comma_found = false;

  for (;;) {
    for (i = need_params; i > 0; i--) {
      scanParam(state);
      if (state.err.length) {
        return;
      }
      state.data.push(state.param);

      skipSpaces(state);
      comma_found = false;

      if (state.index < max && state.path.charCodeAt(state.index) === 0x2C/* , */) {
        state.index++;
        skipSpaces(state);
        comma_found = true;
      }
    }

    // after ',' param is mandatory
    if (comma_found) {
      continue;
    }

    if (state.index >= state.max) {
      break;
    }

    // Stop on next segment
    if (!isDigitStart(state.path.charCodeAt(state.index))) {
      break;
    }
  }

  finalizeSegment(state);
}


/* Returns array of segments:
 *
 * [
 *   [ command, coord1, coord2, ... ]
 * ]
 */
module.exports = function pathParse(svgPath) {
  var state = new State(svgPath);
  var max = state.max;

  skipSpaces(state);

  while (state.index < max && !state.err.length) {
    scanSegment(state);
  }

  if (state.err.length) {
    state.result = [];

  } else if (state.result.length) {

    if ('mM'.indexOf(state.result[0][0]) < 0) {
      state.err = 'SvgPath: string should start with `M` or `m`';
      state.result = [];
    } else {
      state.result[0][0] = 'M';
    }
  }

  return {
    err: state.err,
    segments: state.result
  };
};

},{}],6:[function(require,module,exports){
// SVG Path transformations library
//
// Usage:
//
//    SvgPath('...')
//      .translate(-150, -100)
//      .scale(0.5)
//      .translate(-150, -100)
//      .toFixed(1)
//      .toString()
//

'use strict';


var pathParse      = require('./path_parse');
var transformParse = require('./transform_parse');
var matrix         = require('./matrix');
var a2c            = require('./a2c');
var ellipse        = require('./ellipse');


// Class constructor
//
function SvgPath(path) {
  if (!(this instanceof SvgPath)) { return new SvgPath(path); }

  var pstate = pathParse(path);

  // Array of path segments.
  // Each segment is array [command, param1, param2, ...]
  this.segments = pstate.segments;

  // Error message on parse error.
  this.err      = pstate.err;

  // Transforms stack for lazy evaluation
  this.__stack    = [];
}


SvgPath.prototype.__matrix = function (m) {
  var self = this, i;

  // Quick leave for empty matrix
  if (!m.queue.length) { return; }

  this.iterate(function (s, index, x, y) {
    var p, result, name, isRelative;

    switch (s[0]) {

      // Process 'assymetric' commands separately
      case 'v':
        p      = m.calc(0, s[1], true);
        result = (p[0] === 0) ? [ 'v', p[1] ] : [ 'l', p[0], p[1] ];
        break;

      case 'V':
        p      = m.calc(x, s[1], false);
        result = (p[0] === m.calc(x, y, false)[0]) ? [ 'V', p[1] ] : [ 'L', p[0], p[1] ];
        break;

      case 'h':
        p      = m.calc(s[1], 0, true);
        result = (p[1] === 0) ? [ 'h', p[0] ] : [ 'l', p[0], p[1] ];
        break;

      case 'H':
        p      = m.calc(s[1], y, false);
        result = (p[1] === m.calc(x, y, false)[1]) ? [ 'H', p[0] ] : [ 'L', p[0], p[1] ];
        break;

      case 'a':
      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]

        // Drop segment if arc is empty (end point === start point)
        /*if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
            (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
          return [];
        }*/

        // Transform rx, ry and the x-axis-rotation
        var ma = m.toArray();
        var e = ellipse(s[1], s[2], s[3]).transform(ma);

        // flip sweep-flag if matrix is not orientation-preserving
        if (ma[0] * ma[3] - ma[1] * ma[2] < 0) {
          s[5] = s[5] ? '0' : '1';
        }

        // Transform end point as usual (without translation for relative notation)
        p = m.calc(s[6], s[7], s[0] === 'a');

        // Empty arcs can be ignored by renderer, but should not be dropped
        // to avoid collisions with `S A S` and so on. Replace with empty line.
        if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
            (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
          result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
          break;
        }

        // if the resulting ellipse is (almost) a segment ...
        if (e.isDegenerate()) {
          // replace the arc by a line
          result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
        } else {
          // if it is a real ellipse
          // s[0], s[4] and s[5] are not modified
          result = [ s[0], e.rx, e.ry, e.ax, s[4], s[5], p[0], p[1] ];
        }

        break;

      case 'm':
        // Edge case. The very first `m` should be processed as absolute, if happens.
        // Make sense for coord shift transforms.
        isRelative = index > 0;

        p = m.calc(s[1], s[2], isRelative);
        result = [ 'm', p[0], p[1] ];
        break;

      default:
        name       = s[0];
        result     = [ name ];
        isRelative = (name.toLowerCase() === name);

        // Apply transformations to the segment
        for (i = 1; i < s.length; i += 2) {
          p = m.calc(s[i], s[i + 1], isRelative);
          result.push(p[0], p[1]);
        }
    }

    self.segments[index] = result;
  }, true);
};


// Apply stacked commands
//
SvgPath.prototype.__evaluateStack = function () {
  var m, i;

  if (!this.__stack.length) { return; }

  if (this.__stack.length === 1) {
    this.__matrix(this.__stack[0]);
    this.__stack = [];
    return;
  }

  m = matrix();
  i = this.__stack.length;

  while (--i >= 0) {
    m.matrix(this.__stack[i].toArray());
  }

  this.__matrix(m);
  this.__stack = [];
};


// Convert processed SVG Path back to string
//
SvgPath.prototype.toString = function () {
  var elements = [], skipCmd, cmd;

  this.__evaluateStack();

  for (var i = 0; i < this.segments.length; i++) {
    // remove repeating commands names
    cmd = this.segments[i][0];
    skipCmd = i > 0 && cmd !== 'm' && cmd !== 'M' && cmd === this.segments[i - 1][0];
    elements = elements.concat(skipCmd ? this.segments[i].slice(1) : this.segments[i]);
  }

  return elements.join(' ')
            // Optimizations: remove spaces around commands & before `-`
            //
            // We could also remove leading zeros for `0.5`-like values,
            // but their count is too small to spend time for.
            .replace(/ ?([achlmqrstvz]) ?/gi, '$1')
            .replace(/ \-/g, '-')
            // workaround for FontForge SVG importing bug
            .replace(/zm/g, 'z m');
};


// Translate path to (x [, y])
//
SvgPath.prototype.translate = function (x, y) {
  this.__stack.push(matrix().translate(x, y || 0));
  return this;
};


// Scale path to (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.scale = function (sx, sy) {
  this.__stack.push(matrix().scale(sx, (!sy && (sy !== 0)) ? sx : sy));
  return this;
};


// Rotate path around point (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.rotate = function (angle, rx, ry) {
  this.__stack.push(matrix().rotate(angle, rx || 0, ry || 0));
  return this;
};


// Skew path along the X axis by `degrees` angle
//
SvgPath.prototype.skewX = function (degrees) {
  this.__stack.push(matrix().skewX(degrees));
  return this;
};


// Skew path along the Y axis by `degrees` angle
//
SvgPath.prototype.skewY = function (degrees) {
  this.__stack.push(matrix().skewY(degrees));
  return this;
};


// Apply matrix transform (array of 6 elements)
//
SvgPath.prototype.matrix = function (m) {
  this.__stack.push(matrix().matrix(m));
  return this;
};


// Transform path according to "transform" attr of SVG spec
//
SvgPath.prototype.transform = function (transformString) {
  if (!transformString.trim()) {
    return this;
  }
  this.__stack.push(transformParse(transformString));
  return this;
};


// Round coords with given decimal precition.
// 0 by default (to integers)
//
SvgPath.prototype.round = function (d) {
  var contourStartDeltaX = 0, contourStartDeltaY = 0, deltaX = 0, deltaY = 0, l;

  d = d || 0;

  this.__evaluateStack();

  this.segments.forEach(function (s) {
    var isRelative = (s[0].toLowerCase() === s[0]);

    switch (s[0]) {
      case 'H':
      case 'h':
        if (isRelative) { s[1] += deltaX; }
        deltaX = s[1] - s[1].toFixed(d);
        s[1] = +s[1].toFixed(d);
        return;

      case 'V':
      case 'v':
        if (isRelative) { s[1] += deltaY; }
        deltaY = s[1] - s[1].toFixed(d);
        s[1] = +s[1].toFixed(d);
        return;

      case 'Z':
      case 'z':
        deltaX = contourStartDeltaX;
        deltaY = contourStartDeltaY;
        return;

      case 'M':
      case 'm':
        if (isRelative) {
          s[1] += deltaX;
          s[2] += deltaY;
        }

        deltaX = s[1] - s[1].toFixed(d);
        deltaY = s[2] - s[2].toFixed(d);

        contourStartDeltaX = deltaX;
        contourStartDeltaY = deltaY;

        s[1] = +s[1].toFixed(d);
        s[2] = +s[2].toFixed(d);
        return;

      case 'A':
      case 'a':
        // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        if (isRelative) {
          s[6] += deltaX;
          s[7] += deltaY;
        }

        deltaX = s[6] - s[6].toFixed(d);
        deltaY = s[7] - s[7].toFixed(d);

        s[1] = +s[1].toFixed(d);
        s[2] = +s[2].toFixed(d);
        s[3] = +s[3].toFixed(d + 2); // better precision for rotation
        s[6] = +s[6].toFixed(d);
        s[7] = +s[7].toFixed(d);
        return;

      default:
        // a c l q s t
        l = s.length;

        if (isRelative) {
          s[l - 2] += deltaX;
          s[l - 1] += deltaY;
        }

        deltaX = s[l - 2] - s[l - 2].toFixed(d);
        deltaY = s[l - 1] - s[l - 1].toFixed(d);

        s.forEach(function (val, i) {
          if (!i) { return; }
          s[i] = +s[i].toFixed(d);
        });
        return;
    }
  });

  return this;
};


// Apply iterator function to all segments. If function returns result,
// current segment will be replaced to array of returned segments.
// If empty array is returned, current regment will be deleted.
//
SvgPath.prototype.iterate = function (iterator, keepLazyStack) {
  var segments = this.segments,
      replacements = {},
      needReplace = false,
      lastX = 0,
      lastY = 0,
      countourStartX = 0,
      countourStartY = 0;
  var i, j, newSegments;

  if (!keepLazyStack) {
    this.__evaluateStack();
  }

  segments.forEach(function (s, index) {

    var res = iterator(s, index, lastX, lastY);

    if (Array.isArray(res)) {
      replacements[index] = res;
      needReplace = true;
    }

    var isRelative = (s[0] === s[0].toLowerCase());

    // calculate absolute X and Y
    switch (s[0]) {
      case 'm':
      case 'M':
        lastX = s[1] + (isRelative ? lastX : 0);
        lastY = s[2] + (isRelative ? lastY : 0);
        countourStartX = lastX;
        countourStartY = lastY;
        return;

      case 'h':
      case 'H':
        lastX = s[1] + (isRelative ? lastX : 0);
        return;

      case 'v':
      case 'V':
        lastY = s[1] + (isRelative ? lastY : 0);
        return;

      case 'z':
      case 'Z':
        // That make sence for multiple contours
        lastX = countourStartX;
        lastY = countourStartY;
        return;

      default:
        lastX = s[s.length - 2] + (isRelative ? lastX : 0);
        lastY = s[s.length - 1] + (isRelative ? lastY : 0);
    }
  });

  // Replace segments if iterator return results

  if (!needReplace) { return this; }

  newSegments = [];

  for (i = 0; i < segments.length; i++) {
    if (typeof replacements[i] !== 'undefined') {
      for (j = 0; j < replacements[i].length; j++) {
        newSegments.push(replacements[i][j]);
      }
    } else {
      newSegments.push(segments[i]);
    }
  }

  this.segments = newSegments;

  return this;
};


// Converts segments from relative to absolute
//
SvgPath.prototype.abs = function () {

  this.iterate(function (s, index, x, y) {
    var name = s[0],
        nameUC = name.toUpperCase(),
        i;

    // Skip absolute commands
    if (name === nameUC) { return; }

    s[0] = nameUC;

    switch (name) {
      case 'v':
        // v has shifted coords parity
        s[1] += y;
        return;

      case 'a':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        s[6] += x;
        s[7] += y;
        return;

      default:
        for (i = 1; i < s.length; i++) {
          s[i] += i % 2 ? x : y; // odd values are X, even - Y
        }
    }
  }, true);

  return this;
};


// Converts segments from absolute to relative
//
SvgPath.prototype.rel = function () {

  this.iterate(function (s, index, x, y) {
    var name = s[0],
        nameLC = name.toLowerCase(),
        i;

    // Skip relative commands
    if (name === nameLC) { return; }

    // Don't touch the first M to avoid potential confusions.
    if (index === 0 && name === 'M') { return; }

    s[0] = nameLC;

    switch (name) {
      case 'V':
        // V has shifted coords parity
        s[1] -= y;
        return;

      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        s[6] -= x;
        s[7] -= y;
        return;

      default:
        for (i = 1; i < s.length; i++) {
          s[i] -= i % 2 ? x : y; // odd values are X, even - Y
        }
    }
  }, true);

  return this;
};


// Converts arcs to cubic bézier curves
//
SvgPath.prototype.unarc = function () {
  this.iterate(function (s, index, x, y) {
    var new_segments, nextX, nextY, result = [], name = s[0];

    // Skip anything except arcs
    if (name !== 'A' && name !== 'a') { return null; }

    if (name === 'a') {
      // convert relative arc coordinates to absolute
      nextX = x + s[6];
      nextY = y + s[7];
    } else {
      nextX = s[6];
      nextY = s[7];
    }

    new_segments = a2c(x, y, nextX, nextY, s[4], s[5], s[1], s[2], s[3]);

    // Degenerated arcs can be ignored by renderer, but should not be dropped
    // to avoid collisions with `S A S` and so on. Replace with empty line.
    if (new_segments.length === 0) {
      return [ [ s[0] === 'a' ? 'l' : 'L', s[6], s[7] ] ];
    }

    new_segments.forEach(function (s) {
      result.push([ 'C', s[2], s[3], s[4], s[5], s[6], s[7] ]);
    });

    return result;
  });

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function () {
  var segments = this.segments;
  var prevControlX, prevControlY, prevSegment;
  var curControlX, curControlY;

  // TODO: add lazy evaluation flag when relative commands supported

  this.iterate(function (s, idx, x, y) {
    var name = s[0], nameUC = name.toUpperCase(), isRelative;

    // First command MUST be M|m, it's safe to skip.
    // Protect from access to [-1] for sure.
    if (!idx) { return; }

    if (nameUC === 'T') { // quadratic curve
      isRelative = (name === 't');

      prevSegment = segments[idx - 1];

      if (prevSegment[0] === 'Q') {
        prevControlX = prevSegment[1] - x;
        prevControlY = prevSegment[2] - y;
      } else if (prevSegment[0] === 'q') {
        prevControlX = prevSegment[1] - prevSegment[3];
        prevControlY = prevSegment[2] - prevSegment[4];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = [
        isRelative ? 'q' : 'Q',
        curControlX, curControlY,
        s[1], s[2]
      ];

    } else if (nameUC === 'S') { // cubic curve
      isRelative = (name === 's');

      prevSegment = segments[idx - 1];

      if (prevSegment[0] === 'C') {
        prevControlX = prevSegment[3] - x;
        prevControlY = prevSegment[4] - y;
      } else if (prevSegment[0] === 'c') {
        prevControlX = prevSegment[3] - prevSegment[5];
        prevControlY = prevSegment[4] - prevSegment[6];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = [
        isRelative ? 'c' : 'C',
        curControlX, curControlY,
        s[1], s[2], s[3], s[4]
      ];
    }
  });

  return this;
};


module.exports = SvgPath;

},{"./a2c":2,"./ellipse":3,"./matrix":4,"./path_parse":5,"./transform_parse":7}],7:[function(require,module,exports){
'use strict';


var Matrix = require('./matrix');

var operations = {
  matrix: true,
  scale: true,
  rotate: true,
  translate: true,
  skewX: true,
  skewY: true
};

var CMD_SPLIT_RE    = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
var PARAMS_SPLIT_RE = /[\s,]+/;


module.exports = function transformParse(transformString) {
  var matrix = new Matrix();
  var cmd, params;

  // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
  transformString.split(CMD_SPLIT_RE).forEach(function (item) {

    // Skip empty elements
    if (!item.length) { return; }

    // remember operation
    if (typeof operations[item] !== 'undefined') {
      cmd = item;
      return;
    }

    // extract params & att operation to matrix
    params = item.split(PARAMS_SPLIT_RE).map(function (i) {
      return +i || 0;
    });

    // If params count is not correct - ignore command
    switch (cmd) {
      case 'matrix':
        if (params.length === 6) {
          matrix.matrix(params);
        }
        return;

      case 'scale':
        if (params.length === 1) {
          matrix.scale(params[0], params[0]);
        } else if (params.length === 2) {
          matrix.scale(params[0], params[1]);
        }
        return;

      case 'rotate':
        if (params.length === 1) {
          matrix.rotate(params[0], 0, 0);
        } else if (params.length === 3) {
          matrix.rotate(params[0], params[1], params[2]);
        }
        return;

      case 'translate':
        if (params.length === 1) {
          matrix.translate(params[0], 0);
        } else if (params.length === 2) {
          matrix.translate(params[0], params[1]);
        }
        return;

      case 'skewX':
        if (params.length === 1) {
          matrix.skewX(params[0]);
        }
        return;

      case 'skewY':
        if (params.length === 1) {
          matrix.skewY(params[0]);
        }
        return;
    }
  });

  return matrix;
};

},{"./matrix":4}],8:[function(require,module,exports){
// app/axes.js

module.exports = axes;

function axes(svg) {

    var x = d3.scaleLinear();
    var y = d3.scaleLinear();
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisRight(y);

    var gX = svg.append("g")
        .attr("class", "axis axis--x")
        .style("pointer-events", "none")
        .call(xAxis);

    var gY = svg.append("g")
        .attr("class", "axis axis--y")
        .style("pointer-events", "none")
        .call(yAxis);

    return {
        applySize: function (w, h) {
            x.domain([-w/2, w/2])
                .range([-w/2, w/2]);

            y.domain([-h/2, h/2])
                .range([-h/2, h/2]);

            xAxis.ticks((w + 2) / (h + 2) * 10)
                .tickSize(h)
                .tickPadding(8 - h);

            yAxis.ticks(10)
                .tickSize(w)
                .tickPadding(8 - w);

            d3.select('g.axis--x')
                .attr('transform', 'translate(0,' + (-h/2) +')');

            d3.select('g.axis--y')
                .attr('transform', 'translate(' + (-w/2) + ',0)');
        },

        applyZoom: function (t) {
            gX.call(xAxis.scale(t.rescaleX(x)));
            gY.call(yAxis.scale(t.rescaleY(y)));
        }
    }
}

},{}],9:[function(require,module,exports){
// app/broker.js

var events = require('./events');

module.exports = broker;

function broker() {

    var listeners = {};

    return {
        events: events,
        fire: fire,
        on: on
    };

    function on(evt, func) {
        !listeners[evt] && (listeners[evt] = []);
        listeners[evt].push(func);
    }

    function fire(evt, arg) {
        console.log('evt: ' + evt + (arg ? '[' + JSON.stringify(arg) + ']' : ''));
        listeners[evt] && listeners[evt].forEach(function (listener) {
            listener(arg);
        });
    }
}

},{"./events":12}],10:[function(require,module,exports){
// app/canvas.js

var createTranslate = require('./translate');
var svg = require('./svg');

var width = 800;
var height = 600;

module.exports = canvas;

function canvas(ctx) {

    var action;

    var helpers = svg.g('helpers');
    var canvas = svg.g('canvas');

    helpers.append('rect')
        .classed('canvas', true)
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('x', -width/2)
        .attr('y', -height/2)
        .attr('width', width)
        .attr('height', height)
        .call(d3.drag()
            .on("start", function () {
                ctx.mode && drawStart();
            })
            .on("drag", function () {
                ctx.mode && ctx.mode.dragMove(d3.event);
            })
            .on("end", function () {
                ctx.mode && drawEnd();
            }));

    ctx.broker.on(ctx.broker.events.DELETE, function () {
        var deleted = ctx.active;
        del();
        ctx.broker.fire(ctx.broker.events.ACTION, {
            undo: function () {
                canvas.node().appendChild(deleted.node());
                ctx.active = deleted;
                ctx.extent.updateExtent();
            },
            redo: del
        });

        function del() {
            deleted.remove();
            ctx.active = null;
            ctx.extent.updateExtent();
        }
    });

    return {
        applyTransform: function () {
            helpers.attr("transform", ctx.transform);
            canvas.attr("transform", ctx.transform);
        }
    };

    function drawStart() {
        var group = canvas
            .append('g')
            .datum({x: 0, y: 0, r: 0});

        action = createDrawAction(ctx.active);

        ctx.active = ctx.mode
            .dragStart(group, d3.event);

        applyBrush(ctx.active);
    }

    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function drawEnd() {

        ctx.extent.updateExtent(ctx);
        !d3.event.sourceEvent.ctrlKey && ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode)
            .call(createTranslate(ctx))
            .style('cursor', 'move')
            .attr('transform', svg.getTransform);

        action.endDraw();

        ctx.broker.fire(ctx.broker.events.ACTION, action);
    }


    function createDrawAction(prev) {
        var shape;
        return {
            endDraw: function() {
                shape = ctx.active;
            },
            undo: function () {
                shape.remove();
                ctx.active = prev;
                ctx.extent.updateExtent();
            },
            redo: function () {
                canvas.node().append(shape.node());
                ctx.active = shape;
                ctx.extent.updateExtent();
            }
        }
    }
}

},{"./svg":19,"./translate":20}],11:[function(require,module,exports){
// app/edit.js
var svgpath = require('svgpath');
var svg = require('./svg');

var commandLayout = {
    m: [[1, 2]],
    l: [[1, 2]],
    t: [[1, 2]],
    a: [[1, 2], [6, 7]],
    q: [[1, 2], [3, 4]],
    s: [[1, 2], [3, 4]],
    c: [[1, 2], [3, 4], [5, 6]],
};

module.exports = function (ctx) {

    var pt = ctx.svg.node().createSVGPoint();
    var edit = svg.g('edit');
    var controlPointsPath = edit.append('path')
        .attr('stroke', 'red');
    var active;
    var svgPathEditor;
    ctx.broker.on(ctx.broker.events.EDIT, startEdit);

    return {
        updatePathEditor: updatePathEditorPoints
    };

    function updateControlPointsPaths(edit, controlPointsPath) {
        var controlPointsPathD = "";
        d3.selectAll('circle.editor-anchor-point')
            .each(function (d) {
                if(d.prevControlPoint || d.controlPoint)
                    addLine(d3.select(this), d.index-1)
            });

        function addLine(curPt, ptIdx) {
            try {
                var toPt = edit.select('.pt_' + ptIdx);
                controlPointsPathD +=
                    "M" + toPt.attr('cx') +
                    "," + toPt.attr('cy') +
                    "L" + curPt.attr('cx') +
                    "," + curPt.attr('cy');
            } catch (e) {
                console.log(curPt)
            }
        }

        controlPointsPath.attr('d', controlPointsPathD)
    }

    function updatePathEditorPoints() {
        if (!active)
            return;

        var activePathPoints = [];

        function isControlPoint(segmentIndex, pointIndex) {
            var cmd = svgPathEditor.segments[segmentIndex][0].toLowerCase();
            return commandLayout[cmd].length !== pointIndex + 1;
        }

        function isPrevControlPoint() {
            return activePathPoints.length && activePathPoints[activePathPoints.length - 1].controlPoint;
        }

        function addPoint(segmentIndex, pointIndex, xIndex, yIndex) {
            var segment = svgPathEditor.segments[segmentIndex];
            pt.x = segment[xIndex];
            pt.y = segment[yIndex];
            var p = pt.matrixTransform(active.getScreenCTM());
            activePathPoints.push({
                x: p.x - svg.screenOffsetX(),
                y: p.y - svg.screenOffsetY(),
                xIndex: xIndex,
                yIndex: yIndex,
                segmentIndex: segmentIndex,
                pointIndex: pointIndex,
                index: activePathPoints.length,
                controlPoint: isControlPoint(segmentIndex, pointIndex),
                prevControlPoint: isPrevControlPoint(),
            });
        }

        svgPathEditor = svgpath(active.getAttribute('d'));
        svgPathEditor.segments.forEach(function (seg, i) {
            if (!seg[1])
                return;
            commandLayout[seg[0].toLowerCase()].forEach(function (indexes, group) {
                addPoint(i, group, indexes[0], indexes[1]);
            })
        });

        var selection = edit
            .selectAll('circle.editor-anchor-point')
            .data(activePathPoints);

        selection
            .enter()
            .append('circle')
            .classed('editor-anchor-point', true)
            .attr('r', 5)
            .attr('stroke-width', 1.2)
            .attr('cursor', 'pointer')
            .attr('fill', 'transparent')
            .each(function (d) {
                d3.select(this).classed('pt_'+d.index, true)
            })
            .call(d3.drag()
                .subject(function (d) {
                    return d;
                })
                .on('start', function (d) {
                    d.action = createEditAction(active)
                })
                .on('drag', function (d) {
                    d.x = d3.event.x;
                    d.y = d3.event.y;
                    upd(d3.select(this));
                    pt.x = d.x + svg.screenOffsetX();
                    pt.y = d.y + svg.screenOffsetY();
                    var p = pt.matrixTransform(active.getScreenCTM().inverse());
                    var seg = svgPathEditor.segments[d.segmentIndex];
                    seg[d.xIndex] = p.x;
                    seg[d.yIndex] = p.y;
                    active.setAttribute('d', svgPathEditor.toString());
                    ctx.extent.updateExtent();
                })
                .on('end', function (d) {
                    d.action.endEdit();
                    ctx.broker.fire(ctx.broker.events.ACTION, d.action);
                }))
            .call(upd)
            .merge(selection);

        selection.exit()
            .remove();

        upd(selection);


        function upd(selection) {

            selection
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                })
                .attr('stroke', function (d) {
                    return d.controlPoint ? '#ff0013' : '#fcf9ff';
                });

            updateControlPointsPaths(edit, controlPointsPath);

        }
    }

    function startEdit() {
        active = ctx.active.node().firstChild;
        updatePathEditorPoints()
    }

    function createEditAction(shape) {
        var initialPath = getD();
        var resultPath;
        return {
            endEdit: function() {
                resultPath = getD();
            },

            undo: function () {
                doEdit(initialPath);
            },

            redo: function () {
                doEdit(resultPath);
            }
        };

        function doEdit(pathD) {
            d3.select(shape).attr('d', pathD);
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }

        function getD() {
            return d3.select(shape).attr('d')
        }
    }

};
},{"./svg":19,"svgpath":1}],12:[function(require,module,exports){
// app/events.js

module.exports = {

    // actions
    UNDO: 'undo',
    REDO: 'redo',
    MODE: 'mode',
    RESIZE: 'resize',
    TRANSFORM: 'transform',
    ACTION: 'action',
    DELETE: 'delete',
    EDIT: 'edit',

    // flags
    CAN_REDO: 'can-redo',
    CAN_UNDO: 'can-undo',
    CAN_DELETE: 'can-delete',
    CAN_EDIT: 'can-edit'

};

},{}],13:[function(require,module,exports){
// app/extent.js

module.exports = extent;

var svg = require('./svg');
var rotate = require('./rotate');
var scale = require('./scale');
var filterOutline = require('./filterOutline');
function extent(ctx) {

    var extent = svg.g('extent');

    filterOutline(ctx.defs, 'filter-outline');

    var path = extent.append('path')
        .call(style)
        .attr("clip-path", "url(#clip-knobs)")
        .attr('pointer-events', 'none');

    var center = extent.append('circle')
        .call(circle)
        .attr('pointer-events', 'none');

    var placementKeys = [
        ['nw', 0, 0, scale(ctx, 'se', 'sw', 'se', 'ne',1,1, 'ne', 'se', 'sw')],
        ['w', 0, 1, scale(ctx, 'e', 'w', null,null, 1, 0.5, 'e', null, null)],
        ['sw', 0, 1, scale(ctx, 'ne', 'nw', 'ne', 'se',1,0, 'se', 'ne', 'nw')],
        ['s', 1, 0, scale(ctx, null, null, 'n', 's', 0.5, 0, null, null, 'n')],
        ['se', 1, 0, scale(ctx, 'nw','ne','nw', 'sw',0,0, 'sw', 'nw', 'ne')],
        ['e', 0, -1, scale(ctx, 'w', 'e', null, null, 0, 0.5,'w', null, null)],
        ['ne', 0, -1, scale(ctx, 'sw', 'se','sw', 'nw',0,1, 'nw', 'sw', 'se')],
        ['n', -1, 0, scale(ctx, null, null,'s', 'n',0.5, 1,null, null, 's')],
        ['r', 0, -25, rotate(ctx, center)]
    ];

    var clipPath = ctx.defs.append("clipPath")
        .attr("id", "clip-knobs")
        .append("path");

    var knobs = extent.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .call(circle)
        .attr('cursor', 'pointer')
        .each(function (d) {
            var knob = d3.select(this);
            knob.classed('knob ' + d[0], true);
            d[3] && knob.call(d[3](knob));
        });

    var outline = ctx.svg.select('.helpers')

        .append('path')
        .style('filter', 'url(#filter-outline)')
        .classed('outline', true)
        .attr('stroke', 'skyblue')
        //.attr('stroke-linecap', 'square')
        .attr('fill', 'transparent')
        .attr('pointer-events', 'none');

   // animate();

    function animate() {
        outline.transition()
            .duration(1000)
            .attr('stroke', 'rgba(255, 40, 0, 0.3)')
            .transition()
            .duration(1000)
            .attr('stroke', 'rgba(0, 40, 255, 0.3)')
            .on('end', animate)
    }

    var canDelete;

    return {
        updateExtent: render
    };

    function changeCanDeleteState() {
        ctx.broker.fire(ctx.broker.events.CAN_DELETE, canDelete = !canDelete);
        ctx.broker.fire(ctx.broker.events.CAN_EDIT, canDelete);
    }

    function render() {
        var a = ctx.active;

        if (canDelete && !ctx.active || !canDelete && ctx.active)
            changeCanDeleteState()

        if (!a) {
            path.attr('d', '');
            knobs.attr('display', 'none');
            outline.attr('d', '');
            return;
        }

        var thick = a.attr('stroke-width') ||
            d3.select(a.node().firstChild).attr('stroke-width');

        var pad = 0;//2 + thick / 2 / ctx.transform.k;
        var calc = svg.createPointCalc(a, pad);

        var pts = placementKeys.map(function (p) {
            var absolute = Math.abs(p[2]) > 1.0001 ? ctx.transform.k : null;
            return calc.shift(p[1], p[2], absolute).calc();
        });

        var ox = svg.screenOffsetX(ctx);
        var oy = svg.screenOffsetY(ctx);
        var d = "";
        var clipD = "M-2000,-2000L-2000,2000L2000,2000L2000,-2000Z";
        pts.forEach(function (p, i) {

            d3.selectAll('circle.' + placementKeys[i][0])
                .attr('display', 'visible')
                .attr('cx', p.pad.x - ox)
                .attr('cy', p.pad.y - oy)
                .datum({
                    x: p.orig.x - ox,
                    y: p.orig.y - oy
                });

            if (i % 2 === 0 && i !== pts.length - 1) {
                d += !d ? "M" : "L";
                d += (p.pad.x - ox) + ",";
                d += (p.pad.y - oy) + " ";
            }

            clipD += svg.circlePath(p.pad.x - ox, p.pad.y - oy, 5)

        });
        clipPath.attr('d', clipD);
        path.attr('d', d + "Z");
        outline.attr('d', a.attr('d') || d3.select(a.node().firstChild).attr('d'))
            .attr('stroke-width', (5/ctx.transform.k) +(+thick))
            .attr('transform', a.attr('transform') || d3.select(a.node().parentNode).attr('transform'));

    }

    function circle(el) {
        el.call(style)
            .attr('display', 'none')
            .attr('r', 5)
    }

    function style(el) {
        el.attr('stroke', '#0020ff')
            .attr('stroke-width', 1.2)
            .attr('fill', 'transparent')
    }
}

},{"./filterOutline":14,"./rotate":17,"./scale":18,"./svg":19}],14:[function(require,module,exports){
module.exports = filter_Outline;


function filter_Outline(defs, id) {
    // https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
    var filter = defs.append('filter')
        .attr('id', id);

    filter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '1')
        //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
        .attr('color-interpolation-filters', 'sRGB')
        .attr('result', 'blur');

    // filter.append('feColorMatrix')
    //     .attr('in', 'blur')
    //     .attr('mode', 'matrix')
    //     .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9')
}
},{}],15:[function(require,module,exports){
// app/modes.js

var modes = {
    circle: require('../mode/circle'),
    rect: require('../mode/rect'),
    line: require('../mode/line'),
    pen: require('../mode/pen')
};

module.exports = function (ctx) {
    ctx.broker.on(ctx.broker.events.MODE, function (newMode) {
        ctx.mode = modes[newMode];
    });
};

},{"../mode/circle":23,"../mode/line":24,"../mode/pen":25,"../mode/rect":26}],16:[function(require,module,exports){
// app/panzoom.js

module.exports = panzoom;

function panzoom(ctx) {

    ctx.svg.call(createZoom());

    ctx.broker.on(ctx.broker.events.RESIZE, adjustSize);

    function applyTransform() {
        ctx.canvas.applyTransform()
        ctx.axes.applyZoom(ctx.transform);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
        ctx.broker.fire(ctx.broker.events.TRANSFORM, ctx.transform)
    }

    function adjustSize() {
        var w = ctx.containerElement.node().clientWidth;
        var h = ctx.containerElement.node().clientHeight;
        ctx.svg.attr('width', w).attr('height', h)
            .attr('viewBox', -w/2 + ' ' + -h/2 + ' ' + w + ' ' + h);
        ctx.axes.applySize(w, h);
        applyTransform()
    }

    function createZoom() {

        return d3.zoom()
            .filter(function () {
                return true;
            })
            .scaleExtent([0.1, 100])
            .on("zoom", function() {
                ctx.transform = d3.event.transform;
                applyTransform();
            })

    }
}

},{}],17:[function(require,module,exports){
// app/rotate.js

var svg = require('./svg');

module.exports = rotate;

function rotate(ctx, center) {
    return function (knob) {
        var action;
        return d3.drag()
            .on("start", function (d) {
                svg.fill(knob, true, 150);
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - svg.screenOffsetX(ctx);
                d.cy = r.y + r.height/2 - svg.screenOffsetY(ctx);
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');
                action = createRotateAction(ctx.active);
            })
            .on("drag", function (d) {
                var x = d3.event.x - d.cx;
                var y = d3.event.y - d.cy;
                var a = Math.atan2(y , x) * 180 / Math.PI + 90;
                if (!d3.event.sourceEvent.ctrlKey) {
                    var snapEvery = 45, precision = 5;
                    var pct = Math.abs(a) % snapEvery;
                    if (pct < precision || snapEvery - pct < precision) {
                        a = snapEvery * (a/snapEvery).toFixed(0);
                    }
                }
                doRotate(ctx.active, a);
            })
            .on("end", function (d) {
                svg.fill(knob, false, 150);
                center.attr('display', 'none');
                action.endRotate();
                ctx.broker.fire(ctx.broker.events.ACTION, action);
                action = null;
            })
    };

    function doRotate(shape, r) {
        shape.datum().r = r;
        shape.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
    }

    function createRotateAction(shape) {
        var initialRotation = shape.datum().r;
        var endRotation;
        return {
            endRotate: function() {
                endRotation = shape.datum().r;
            },

            undo: function () {
                doRotate(shape, initialRotation);
            },

            redo: function () {
                doRotate(shape, endRotation);
            }
        }
    }
}

},{"./svg":19}],18:[function(require,module,exports){
var svgpath = require('svgpath');
var svg = require('./svg');


module.exports = function (ctx, vxs, vxe, vys, vye, dw, dh, x,xy,y) {

    var action;

    return function (knob) {
        return d3.drag()
            .on("start", startScale)
            .on("drag", doScale)
            .on("end", endScale);

        function doScale(d) {
            calc(d.lineX);
            calc(d.lineY);

            var transformed = svgpath(d.path)
                .translate(-d.origin.x, -d.origin.y)
                .scale(
                    d.lineX ? d.lineX.datum().scale : 1,
                    d.lineY ? d.lineY.datum().scale : 1
                )
                .translate(d.origin.x, d.origin.y)
                .round(4);

            ctx.active.select('path.figure').attr('d', transformed.toString());

            var datum = ctx.active.datum();
            datum.dx = 0;
            datum.dy = 0;
            ctx.active.attr('transform', svg.getTransform);
            ctx.extent.updateExtent();

            var k = knob;
            var needDx = d.lineX && d.lineX.datum().scale < 0;
            var needDy = d.lineY && d.lineY.datum().scale < 0;
            if (needDx && needDy)
                k = d3.select('circle.knob.' + xy);
            else if (needDx)
                k = d3.select('circle.knob.' + x);
            else if (needDy)
                k = d3.select('circle.knob.' + y);

            svg.fill(d3.selectAll('circle.knob'), false);
            svg.fill(k, true);

            d.scaleHelper
                .attr('cx', k.datum().x)
                .attr('cy', k.datum().y);

            var knobRect = d.scaleHelper.node().getBoundingClientRect();
            datum.dx = knobRect.x + knobRect.width/2 - svg.screenOffsetX();
            datum.dy = knobRect.y + knobRect.height/2 - svg.screenOffsetY();

            if (d.lineX && d.lineY) {
                datum.dx -= d3.event.x;
                datum.dy -= d3.event.y;
            } else {
                var l = d.lineX || d.lineY;
                datum.dx -= +l.datum().x2;
                datum.dy -= +l.datum().y2;
            }

            datum.dx /= ctx.transform.k;
            datum.dy /= ctx.transform.k;

            ctx.active.attr('transform', svg.getTransform);
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }

        function startScale(d) {
            svg.fill(knob, true, 150);

            if (vxs && vxe)
                d.lineX = line(knob, vxs, vxe);

            if (vys && vye)
                d.lineY = line(knob, vys, vye);

            var figure = ctx.active.select('path.figure');
            d.path = figure.attr('d');

            var box = figure.node().getBBox();
            var x = box.x + dw * box.width;
            var y = box.y + dh * box.height;

            d.origin = {x: x, y: y};

            d.scaleHelper = ctx.svg.append('circle')
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('cx', knob.datum().x)
                .attr('cy', knob.datum().y)
                .attr('fill', 'none');

            action = createScaleAction(ctx.active);
        }

        function endScale(d){

            svg.fill(d3.selectAll('circle.knob'), false, 150);

            ['lineX', 'lineY', 'scaleHelper'].forEach(function (key) {
                if (!d[key])
                    return;
                d[key].remove();
                d[key] = null;
            });

            action.endScale();
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            d.path = null;
        }


        function len(x,y) {
            return Math.sqrt(x * x + y * y)
        }

        function dot(x1, y1, x2, y2) {
            return x1 * x2 + y1 * y2;
        }

        function calc(line) {
            if (!line)
                return;

            var datum = line.datum();
            var x1 = datum.sx, y1 = datum.sy;
            var x2 = datum.ex, y2 = datum.ey;
            var x3 = d3.event.x, y3 = d3.event.y;
            var dx = x2 - x1, dy = y2 - y1;
            var k = (dy * (x3 - x1) - dx * (y3 - y1)) / (dy * dy + dx * dx);
            datum.x1 = x3; datum.y1 = y3;
            datum.x2 = x3 - k * dy; datum.y2 = y3 + k * dx;
            var x4 = datum.x2 - x1, y4 = datum.y2 - y1;
            datum.scale = len(x4, y4) / len(dx, dy);
            datum.scale *= Math.sign(dot(x4, y4, dx, dy));
        }
    };

    function line(knob, vs, ve) {
        vs = d3.select('circle.knob.' + vs);
        ve = d3.select('circle.knob.' + ve);
        return ctx.svg.append('line')
            .datum({
                sx: +vs.datum().x,
                sy: +vs.datum().y,
                ex: +ve.datum().x,
                ey: +ve.datum().y
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }

    function createScaleAction(shape) {
        var initialPath = getD();
        var resultPath;
        return {
            endScale: function() {
                resultPath = getD();
            },

            undo: function () {
                doScale(initialPath);
            },

            redo: function () {
                doScale(resultPath);
            }
        };

        function doScale(pathD) {
            d3.select(shape.node().firstChild).attr('d', pathD);
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }

        function getD() {
            return d3.select(shape.node().firstChild).attr('d')
        }
    }
};
},{"./svg":19,"svgpath":1}],19:[function(require,module,exports){
// app/svg.js

var ctx;
var pt1;
var pt2;
module.exports = {

    createPointCalc: function(node, pad) {

        if (!pt1) {
            pt1 = ctx.svg.node().createSVGPoint();
            pt2 = ctx.svg.node().createSVGPoint();
        }

        var bbox = node.node().getBBox();
        var matrix = node.node().getScreenCTM();
        var hw = bbox.width / 2;
        var hh = bbox.height / 2;

        reset();

        var calc = {
            reset : reset,
            shift: shift,
            calc: function () {
                return {
                    pad: pt1.matrixTransform(matrix),
                    orig: pt2.matrixTransform(matrix)
                }
            }
        };

        return calc;

        function shift(x, y, absolute) {
            pt1.x += offset(x, hw + pad, absolute);
            pt1.y += offset(y, hh+ pad, absolute);
            pt2.x += offset(x, hw, absolute);
            pt2.y += offset(y, hh, absolute);
            return calc;
        }

        function offset(a, b, k) {
            return k ? a/k : a*b;
        }

        function reset() {
            pt1.x = bbox.x - pad;
            pt1.y = bbox.y - pad;
            pt2.x = bbox.x;
            pt2.y = bbox.y;
            return calc;
        }
    },

    setContext: function(c) {
        ctx = c
    },

    getTransform: function (d) {
        var r = ctx.active.node().getBBox();
        var dx = d.x - (d.dx || 0);
        var dy = d.y - (d.dy || 0);
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return 'rotate(' + d.r + ',' + (x + dx) + ',' + (y + dy) + ')'
            +  'translate(' + dx + ',' + dy + ')'
    },

    screenOffsetX: function () {
        var n = ctx.containerElement.node();
        return n.clientWidth / 2 + n.offsetLeft;
    },

    screenOffsetY: function () {
        var n = ctx.containerElement.node();
        return n.clientHeight / 2 + n.offsetTop;
    },

    g: function (className) {
        return ctx.svg.append('g').classed(className, true);
    },

    fill: function (el, col, t) {
        el.transition()
            .duration(t||0)
            .style('fill', col ? 'rgba(0, 40, 255, 0.7)' : 'transparent')
    },

    circlePath: function (x, y, r, a) {
        var res = "";
        a = a || 45;
        for (var i = 0; i < 360/a; i++) {
            var s = polarToCartesian(x, y, r, a * i);
            var e = polarToCartesian(x, y, r, a * i + a);
            if (!res)
                res += ["M", s.x, s.y].join(" ");
            res += [" A", r, r, 0, 0, 1, e.x, e.y].join(" ");
        }
        return res + 'Z';
    }
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

},{}],20:[function(require,module,exports){
var svg = require('./svg');

module.exports = function (ctx) {

    var action;

    return d3.drag()
        .on("start", function (d) {
            activate(d3.select(this));
            console.log(d3.select(this).attr('transform'), d3.select(this).datum())
            drag(d);
        })
        .on("drag", drag)
        .on("end", function (d) {
            action.endTranslate(d);
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            action = null;

            console.log(d3.select(this).attr('transform'), d3.select(this).datum())
        });

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
    }

    function activate(g) {
        ctx.active = g;
        ctx.active.raise();
        action = createTranslateAction(ctx.active.datum());
    }

    function createTranslateAction(d) {
        var prev = {x: d.x, y: d.y, el: ctx.active};
        var next;
        return {
            endTranslate: function(d) {
                next = {x: d.x, y:d.y, el: ctx.active};
            },
            undo: function () {
                assign(prev);
            },
            redo: function () {
                assign(next);
            }
        }
    }

    function assign(d) {
        ctx.active = d.el;
        ctx.active.datum().x = d.x;
        ctx.active.datum().y = d.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }
};

},{"./svg":19}],21:[function(require,module,exports){
// app/undoredo.js

module.exports = function (ctx) {

    var undoQueue = [];
    var redoQueue = [];

    ctx.broker.on(ctx.broker.events.UNDO, undo);
    ctx.broker.on(ctx.broker.events.REDO, redo);
    ctx.broker.on(ctx.broker.events.ACTION, add);

    function add(action) {
        if (!action.undo || !action.redo) {
            throw Error('undo/redo method not found')
        }
        undoQueue.push(action);
        redoQueue = [];
        fireEvents();
    }

    function fireEvents() {
        ctx.broker.fire(ctx.broker.events.CAN_REDO, redoQueue.length);
        ctx.broker.fire(ctx.broker.events.CAN_UNDO, undoQueue.length);
    }

    function undo() {
        if (!undoQueue.length)
            return;
        var action = undoQueue.pop();
        action.undo();
        redoQueue.push(action);
        fireEvents();
    }

    function redo() {
        if (!redoQueue.length)
            return;
        var action = redoQueue.pop();
        action.redo();
        undoQueue.push(action);
        fireEvents();
    }
};

},{}],22:[function(require,module,exports){
// index.js

var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createPanZoom = require('./app/panzoom');
var createBroker = require('./app/broker');
var createModes = require('./app/modes');
var createPathEditor = require('./app/edit');
var addUndoRedoSupport = require('./app/undoredo');
var svg = require('./app/svg');

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape

    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg');
    ctx.defs = ctx.svg.append('defs');
    ctx.transform = d3.zoomTransform(ctx.svg);

    svg.setContext(ctx);

    ctx.broker = createBroker();
    ctx.axes = createAxes(ctx.svg);
    ctx.canvas = createCanvas(ctx);
    ctx.extent = createExtent(ctx);
    ctx.edit = createPathEditor(ctx);
    createModes(ctx);
    createPanZoom(ctx);
    addUndoRedoSupport(ctx);


    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;
};

},{"./app/axes":8,"./app/broker":9,"./app/canvas":10,"./app/edit":11,"./app/extent":13,"./app/modes":15,"./app/panzoom":16,"./app/svg":19,"./app/undoredo":21}],23:[function(require,module,exports){
// mode/circle.js
var svg = require('../app/svg');
var svgpath = require('svgpath');
var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, mouse) {
    active = group.append("path")
        .classed('figure ellipse', true)
        .datum(mouse);

    dragMove(mouse);

    return active;
}

function dragMove(mouse) {
    active
        .attr('d', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return svgpath(svg.circlePath(d.x, d.y, Math.sqrt(x*x + y*y), 45)).unarc().toString()
        })
}

},{"../app/svg":19,"svgpath":1}],24:[function(require,module,exports){
// mode/line.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    active = group.append("path")
        .classed('figure line', true)
        .datum({
            x1: e.x,
            y1: e.y
        });

    dragMove(e);

    return active;
}

function dragMove(e) {

    active.datum().x2 = e.x;
    active.datum().y2 = e.y;

    active.attr('d', function (d) {
        return 'M ' + d.x1 + ',' + d.y1 + ' L ' + d.x2 + ',' + d.y2;
    });

}

},{}],25:[function(require,module,exports){
// mode/pen.js

var line = d3.line().curve(d3.curveBasis);

var ctx;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    var dataArray = [[e.x, e.y], [e.x, e.y]];

    ctx = {
        d: dataArray,
        active: group.append("path")
            .classed('figure', true)
            .datum(dataArray),
        x0: e.x,
        y0: e.y
    };

    dragMove(e);

    return ctx.active;
}

function dragMove(e) {

    var x1 = e.x,
        y1 = e.y,
        dx = x1 - ctx.x0,
        dy = y1 - ctx.y0;

    if (dx * dx + dy * dy > 10)
        ctx.d.push([ctx.x0 = x1, ctx.y0 = y1]);
    else
        ctx.d[ctx.d.length - 1] = [x1, y1];

    ctx.active.attr("d", line);
}

},{}],26:[function(require,module,exports){
// mode/rect.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {
    active = group.append("path")
        .classed('figure rectangle', true)
        .datum({
            x: e.x,
            y: e.y
        });

    dragMove(e);
    return active;
}

function dragMove(e) {
    var d = active.datum();

    d.w = e.x - d.x;
    d.h = e.y - d.y;

    active
        .attr('d', function (d) {
            return 'M' + d.x + ',' + d.y +
                'L' + (d.x + d.w) +',' + d.y +
                'L' + (d.x + d.w) +',' + (d.y + d.h) +
                'L' + d.x +',' + (d.y + d.h) +
                'z'
        })
}

},{}]},{},[22]);
