(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
// app/broker.js

var events = require('./events');

module.exports = broker;

function broker() {

    var listeners = {};

    return {
        events: events,

        fire: function (evt, arg) {

            console.log('evt: ' + evt + (arg ? '[' + JSON.stringify(arg) + ']' : ''));

            listeners[evt] && listeners[evt].forEach(invoke);

            function invoke(listener) {
                listener(arg);
            }
        },

        on: function (evt, func) {
            !listeners[evt] && (listeners[evt] = []);
            listeners[evt].push(func);
        }
    }
}

},{"./events":4}],3:[function(require,module,exports){
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
            .style('cursor', 'move')
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
            .call(createTranslate(ctx));

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

},{"./svg":10,"./translate":11}],4:[function(require,module,exports){
// app/events.js

module.exports = {
    UNDO: 'undo',
    REDO: 'redo',
    MODE: 'mode',
    RESIZE: 'resize',
    TRANSFORM: 'transform',
    ACTION: 'action',
    DELETE: 'delete',
    CAN_REDO: 'can-redo',
    CAN_UNDO: 'can-undo'
};

},{}],5:[function(require,module,exports){
// app/extent.js

module.exports = extent;

var svg = require('./svg');
var rotate = require('./rotate');
var scale = require('./scale');

function extent(ctx) {

    var extent = svg.g('extent');

    var path = extent.append('path')
        .call(style)
        .attr('pointer-events', 'none');

    var center = extent.append('circle')
        .call(circle)
        .attr('pointer-events', 'none');

    var placementKeys = [
        ['nw', 0, 0, scale(ctx, 'ne', 'sw')],
        ['w', 0, 1, scale(ctx, 'e', null)],
        ['sw', 0, 1, scale(ctx, 'se', 'nw')],
        ['s', 1, 0, scale(ctx, null, 'n')],
        ['se', 1, 0, scale(ctx, 'sw', 'ne')],
        ['e', 0, -1, scale(ctx, 'w', null)],
        ['ne', 0, -1, scale(ctx, 'nw', 'se')],
        ['n', -1, 0, scale(ctx, null, 's')],
        ['r', 0, -15, rotate(ctx, center)]
    ];

    var knobs = extent.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .classed('knob', true)
        .call(circle)
        .attr('cursor', 'pointer')
        .each(function (d) {
            var knob = d3.select(this);
            knob.classed('knob ' + d[0], true);
            d[3] && knob.call(d[3](knob));
        });

    return {
        updateExtent: render
    };

    function render() {
        var a = ctx.active;
        if (!a) {
            path.attr('d', '');
            knobs.attr('display', 'none');
            return;
        }

        var thick = a.attr('stroke-width') ||
            d3.select(a.node().firstChild).attr('stroke-width');

        var pad = 2 + thick / 2 / ctx.transform.k;
        var calc = svg.createPointCalc(a, pad);

        var pts = placementKeys.map(function (p) {
            var absolute = Math.abs(p[2]) > 1.0001 ? ctx.transform.k : null;
            return calc.shift(p[1], p[2], absolute).calc();
        });

        var ox = svg.screenOffsetX(ctx);
        var oy = svg.screenOffsetY(ctx);
        var d = "";
        pts.forEach(function (p, i) {

            d3.select('circle.' + placementKeys[i][0])
                .attr('display', 'visible')
                .attr('cx', p.x - ox)
                .attr('cy', p.y - oy);

            if (i % 2 === 0 && i !== pts.length - 1) {
                d += !d ? "M" : "L";
                d += (p.x - ox) + ",";
                d += (p.y - oy) + " ";
            }

        });
        path.attr('d', d + "Z");
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

},{"./rotate":8,"./scale":9,"./svg":10}],6:[function(require,module,exports){
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

},{"../mode/circle":15,"../mode/line":16,"../mode/pen":17,"../mode/rect":18}],7:[function(require,module,exports){
// app/panzoom.js

module.exports = panzoom;

function panzoom(ctx) {

    ctx.svg.call(createZoom());

    ctx.broker.on(ctx.broker.events.RESIZE, adjustSize);

    function applyTransform() {
        ctx.canvas.applyTransform()
        ctx.axes.applyZoom(ctx.transform);
        ctx.active && ctx.extent.updateExtent(ctx);
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

},{}],8:[function(require,module,exports){
// app/rotate.js

var svg = require('./svg');

module.exports = rotate;

function rotate(ctx, center) {
    return function (knob) {
        var action;
        return d3.drag()
            .on("start", function (d) {
                fill(knob, 'rgba(0, 40, 255, 0.5)');
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - svg.screenOffsetX(ctx);
                d.cy = r.y + r.height/2 - svg.screenOffsetY(ctx);
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');
                action = createRotateAction(ctx.active);
            })
            .on("drag", function (d) {
                var x = d3.event.x;
                var y = d3.event.y;
                var a = Math.atan2(y - d.cy, x - d.cx) * 180 / Math.PI + 90;

                // if (d3.event.sourceEvent.ctrlKey && Math.abs(a) % 90 < 9)
                //     a = 90 * (a/90).toFixed(0);

                doRotate(ctx.active, a);
            })
            .on("end", function (d) {
                fill(knob, 'transparent');
                center.attr('display', 'none');
                action.endRotate();
                ctx.broker.fire(ctx.broker.events.ACTION, action);
                action = null;
            })
    };

    function fill(el, col) {
        el.transition()
            .duration(100)
            .style('fill', col)
    }

    function doRotate(shape, r) {
        shape.datum().r = r;
        shape.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
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

},{"./svg":10}],9:[function(require,module,exports){
var Vector = require('./vector');

module.exports = function (ctx, oppositeX, oppositeY) {
    return function (knob) {
        return d3.drag()
            .on("start", function (d) {
                d.lineX = line(knob, oppositeX);
                d.lineY = line(knob, oppositeY);
                d.start = {
                    x: +knob.attr('cx'),
                    y: +knob.attr('cy')
                }
            })
            .on("drag", function (d) {
                if (d.lineX && !d.lineY)
                    calcLine(d, d.lineX);
                if (!d.lineX && d.lineY)
                    calcLine(d, d.lineY);

                if (d.lineX && d.lineY) {
                }

                upd(d.lineX);
                upd(d.lineY);
            })
            .on("end", function (d) {
                del(d, 'lineX');
                del(d, 'lineY');
            });

        function calcLine(d, line) {

            var datum = line.datum();

            var v1 = new Vector(
                d.start.x - datum.x1,
                d.start.y - datum.y1
            );

            var v2 = new Vector(
                d3.event.x - datum.x1,
                d3.event.y - datum.y1
            );

            v1.normalize().multiply(v2.length()*Math.cos(v1.angleTo(v2)));

            datum.x2 = +datum.x1 + v1.x;
            datum.y2 = +datum.y1 + v1.y;
        }
    };

    function del(d, key) {
        if (!d[key])
            return;
        d[key].remove();
        d[key] = null;
    }

    function upd(line) {
        if (!line)
            return;

        line.attr('x1', function (d) {
            return d.x1
        }).attr('y1', function (d) {
            return d.y1
        }).attr('x2', function (d) {
            return d.x2
        }).attr('y2', function (d) {
            return d.y2
        })
    }

    function line(knob, op) {
        if (!op)
            return;
        op = d3.select('circle.knob.' + op);
        return ctx.svg.append('line')
            .datum({
                x1: +op.attr('cx'),
                y1: +op.attr('cy'),
                x2: +knob.attr('cx'),
                y2: +knob.attr('cy')
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }
};
},{"./vector":13}],10:[function(require,module,exports){
// app/svg.js

var ctx;
var pt;

module.exports = {

    createPointCalc: function(node, pad) {

        if (!pt) {
            pt = ctx.svg.node().createSVGPoint();
        }

        var bbox = node.node().getBBox();
        var matrix = node.node().getScreenCTM();
        var hw = bbox.width / 2 + pad;
        var hh = bbox.height / 2 + pad;

        reset();

        var calc = {
            reset : reset,
            shift: shift,
            calc: function () {
                return pt.matrixTransform(matrix)
            }
        };

        return calc;

        function shift(x, y, absolute) {
            pt.x += offset(x, hw, absolute);
            pt.y += offset(y, hh, absolute);
            return calc;
        }

        function offset(a, b, k) {
            return k ? a/k : a*b;
        }

        function reset() {
            pt.x = bbox.x - pad;
            pt.y = bbox.y - pad;
            return calc;
        }
    },

    setContext: function(c) {
        ctx = c
    },

    getTransform: function (d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return 'rotate(' + d.r + ',' + (x + d.x) + ',' + (y + d.y) + ')' +
            'translate(' + d.x + ',' + d.y + ')';
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
    }
};

},{}],11:[function(require,module,exports){
var svg = require('./svg');

module.exports = function (ctx) {

    var action;

    return d3.drag()
        .on("start", function (d) {
            activate(d3.select(this));
            drag(d);
        })
        .on("drag", drag)
        .on("end", function (d) {
            action.endTranslate(d);
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            action = null;
        });

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }

    function activate(g) {
        action = createTranslateAction(ctx.active.datum());
        ctx.active = g;
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

},{"./svg":10}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
module.exports = Vector;

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype = {
    negative: function() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    },
    add: function(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
        } else {
            this.x += v;
            this.y += v;
        }
        return this;
    },
    subtract: function(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
        } else {
            this.x -= v;
            this.y -= v;
        }
        return this;
    },
    multiply: function(v) {
        if (v instanceof Vector) {
            this.x *= v.x;
            this.y *= v.y;
        } else {
            this.x *= v;
            this.y *= v;
        }
        return this;
    },
    divide: function(v) {
        if (v instanceof Vector) {
            if(v.x != 0) this.x /= v.x;
            if(v.y != 0) this.y /= v.y;
        } else {
            if(v != 0) {
                this.x /= v;
                this.y /= v;
            }
        }
        return this;
    },
    equals: function(v) {
        return this.x == v.x && this.y == v.y;
    },
    dot: function(v) {
        return this.x * v.x + this.y * v.y;
    },
    cross: function(v) {
        return this.x * v.y - this.y * v.x
    },
    length: function() {
        return Math.sqrt(this.dot(this));
    },
    normalize: function() {
        return this.divide(this.length());
    },
    min: function() {
        return Math.min(this.x, this.y);
    },
    max: function() {
        return Math.max(this.x, this.y);
    },
    toAngles: function() {
        return -Math.atan2(-this.y, this.x);
    },
    angleTo: function(a) {
        return Math.acos(this.dot(a) / (this.length() * a.length()));
    },
    toArray: function(n) {
        return [this.x, this.y].slice(0, n || 2);
    },
    clone: function() {
        return new Vector(this.x, this.y);
    },
    set: function(x, y) {
        this.x = x; this.y = y;
        return this;
    }
};

},{}],14:[function(require,module,exports){
// index.js

var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createPanZoom = require('./app/panzoom');
var createBroker = require('./app/broker');
var createModes = require('./app/modes');
var addUndoRedoSupport = require('./app/undoredo');
var svg = require('./app/svg');

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape

    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg');
    ctx.transform = d3.zoomTransform(ctx.svg);

    svg.setContext(ctx);

    ctx.broker = createBroker();
    ctx.axes = createAxes(ctx.svg);
    ctx.canvas = createCanvas(ctx);
    ctx.extent = createExtent(ctx);

    createModes(ctx);
    createPanZoom(ctx);
    addUndoRedoSupport(ctx);

    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;
};

},{"./app/axes":1,"./app/broker":2,"./app/canvas":3,"./app/extent":5,"./app/modes":6,"./app/panzoom":7,"./app/svg":10,"./app/undoredo":12}],15:[function(require,module,exports){
// mode/circle.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, mouse) {
    active = group.append("circle")
        .classed('figure', true)
        .datum(mouse);

    dragMove(mouse);

    return active;
}

function dragMove(mouse) {
    active.attr('cx', function (d) {return d.x;})
        .attr('cy', function (d) {return d.y;})
        .attr('r', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return Math.sqrt(x*x + y*y);
        })
}

},{}],16:[function(require,module,exports){
// mode/line.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    active = group.append("line")
        .classed('figure', true)
        .attr('x1', e.x)
        .attr('y1', e.y)
        .datum(e.subject);

    dragMove(e);

    return active;
}

function dragMove(e) {
    active
        .attr('x2', e.x)
        .attr('y2', e.y)
}

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
// mode/rect.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {
    active = group.append("rect")
        .classed('figure', true)
        .datum([[e.x, e.y], [e.x, e.y]]);

    dragMove(e);
    return active;
}

function dragMove(e) {
    active
        .attr('x', function (d) {
            return Math.min(e.x, d[0][0]);
        })
        .attr('y', function (d) {
            return Math.min(e.y, d[0][1]);
        })
        .attr('width', function (d) {
            return Math.abs(e.x - d[0][0]);
        })
        .attr('height', function (d) {
            return Math.abs(e.y - d[0][1]);
        })
}

},{}]},{},[14]);
