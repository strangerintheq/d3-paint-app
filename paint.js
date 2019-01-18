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

var width = 800;
var height = 600;

module.exports = canvas;

function canvas(ctx) {

    ctx.helpers.append('rect')
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

    function drawStart() {

        var dragger = d3.drag()
            .on("start", function (d) {
                ctx.active = d3.select(this);
                drag(d);
            })
            .on("drag", drag);

        var group = ctx.canvas
            .append('g')
            .style('cursor', 'move')
            .datum({x: 0, y: 0, r: 0, id:'x'})
            .call(dragger);

        ctx.active = ctx.mode
            .dragStart(group, d3.event);

        applyBrush(ctx.active);

        function drag(d) {
            d.x = d3.event.x;
            d.y = d3.event.y;
            ctx.active.attr('transform', getTransform);
            ctx.extent.updateExtent(ctx);
        }
    }

    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function getTransform(d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return'rotate(' + d.r +',' + (x+d.x)  + ',' + (y+d.y) + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function drawEnd() {
        ctx.extent.updateExtent(ctx);
        ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode);
    }

}






},{}],4:[function(require,module,exports){
// app/events.js

module.exports = {
    UNDO: 'undo',
    REDO: 'redo',
    MODE: 'mode',
    RESIZE: 'resize',
    TRANSFORM: 'transform',
    ACTION: 'action'
};
},{}],5:[function(require,module,exports){
// app/extent.js

module.exports = extent;

var rotate = require('./rotate');

function extent(ctx) {

    var pt = ctx.svg.node().createSVGPoint();

    var extent = ctx.svg.append('g')
        .classed('extent', true);
    var path = extent.append('path')
        .call(style)
        .attr('pointer-events', 'none');
    var center = extent.append('circle')
        .call(circle)
        .attr('pointer-events', 'none');

    var placementKeys = [
        ['nw', 0, 0],
        ['w', 0, 1],
        ['sw', 0, 1],
        ['s', 1, 0],
        ['se', 1, 0],
        ['e', 0, -1],
        ['ne', 0, -1],
        ['n', -1, 0],
        ['r', 0, -15, rotate(ctx, center)]
    ];

    extent.selectAll('circle.knob')
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

    return {
        updateExtent: render
    };

    function render() {
        var a = ctx.active;
        var t = a.attr('stroke-width') ||
            d3.select(a.node().firstChild).attr('stroke-width');
        var bbox = a.node().getBBox();
        var matrix = a.node().getScreenCTM();
        var pad = 2 + t/2 / ctx.transform.k;
        var hw = bbox.width / 2 + pad;
        var hh = bbox.height / 2 + pad;

        pt.x = bbox.x - pad;
        pt.y = bbox.y - pad;

        var pts = placementKeys.map(function (p) {
            pt.x += offset(p[1], hw, ctx.transform.k);
            pt.y += offset(p[2], hh, ctx.transform.k);
            return pt.matrixTransform(matrix);
        });

        var n = ctx.svg.node().parentNode;
        var ox = n.clientWidth / 2 + n.offsetLeft;
        var oy = n.clientHeight / 2 + n.offsetTop;
        var d = "";
        pts.forEach(function (p, i) {
            d3.select('circle.' + placementKeys[i][0])
                .attr('display', 'visible')
                .attr('cx', p.x - ox)
                .attr('cy', p.y - oy);
            if (i%2 === 0 && i!== pts.length-1) {
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

    function offset(a, b, k) {
        return Math.abs(a) > 1.01 ? a/k : a*b;
    }
}

},{"./rotate":7}],6:[function(require,module,exports){
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
},{"../mode/circle":11,"../mode/line":12,"../mode/pen":13,"../mode/rect":14}],7:[function(require,module,exports){
module.exports = rotate;

function rotate(ctx, center) {
    return function (knob) {
        return d3.drag()
            .on("start", function (d) {
                fill(knob, 'rgba(0, 40, 255, 0.5)');
                var n = ctx.svg.node().parentNode;
                var ox = n.clientWidth / 2 + n.offsetLeft;
                var oy = n.clientHeight / 2 + n.offsetTop;
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - ox;
                d.cy = r.y + r.height/2 - oy;
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');

            })
            .on("drag", function (d) {
                var x = d3.event.x;
                var y = d3.event.y;
                var a = Math.atan2(y - d.cy, x - d.cx) * 180 / Math.PI + 90;

                // if (d3.event.sourceEvent.ctrlKey && Math.abs(a) % 90 < 9)
                //     a = 90 * (a/90).toFixed(0);

                d = ctx.active.datum();
                d.r = a;
                ctx.active.attr('transform', getTransform(d));
                ctx.extent.updateExtent();
            })
            .on("end", function () {
                fill(knob, 'transparent');
                center.attr('display', 'none');
            })
    };

    function getTransform(d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return'rotate(' + d.r +',' + (x+d.x) + ',' + (y+d.y) + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function fill(el, col) {
        el.transition()
            .duration(100)
            .style('fill', col)
    }
}
},{}],8:[function(require,module,exports){
// app/transformer.js

module.exports = transformer;

function transformer(ctx) {

    ctx.svg.call(createZoom());

    ctx.broker.on(ctx.broker.events.RESIZE, adjustSize);

    function applyTransform() {
        ctx.helpers.attr("transform", ctx.transform);
        ctx.canvas.attr("transform", ctx.transform);
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
            });
    }
}


},{}],9:[function(require,module,exports){
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
    }

    function undo() {
        undoQueue.length && redoQueue.push(undoQueue.pop().undo());
    }

    function redo() {
        redoQueue.length && undoQueue.push(redoQueue.pop().redo());
    }
};
},{}],10:[function(require,module,exports){
// index.js

var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createTransformer = require('./app/transformer');
var createEvents = require('./app/broker');
var createModes = require('./app/modes');
var addUndoRedoSupport = require('./app/undoredo');
window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape
    ctx.broker = createEvents();
    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    ctx.helpers = g('helpers');
    ctx.canvas = g('canvas');
    ctx.axes = createAxes(ctx.svg);
    ctx.extent = createExtent(ctx);
    ctx.transform = d3.zoomTransform(ctx.svg);

    createTransformer(ctx);
    createModes(ctx);
    createCanvas(ctx);
    addUndoRedoSupport(ctx);

    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;

    function g(className) {
        return ctx.svg.append('g').classed(className, true);
    }

};

},{"./app/axes":1,"./app/broker":2,"./app/canvas":3,"./app/extent":5,"./app/modes":6,"./app/transformer":8,"./app/undoredo":9}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{}]},{},[10]);
