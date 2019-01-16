(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
let events = {
    MODE: 'mode',
    RESIZE: 'resize',
    TRANSFORM: 'transform'
};

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


},{}],3:[function(require,module,exports){
// canvas.js

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
                ctx.mode && dragStart();
            })
            .on("drag", function () {
                ctx.mode && ctx.mode.dragMove(d3.event);
            })
            .on("end", function () {
                ctx.mode && dragEnd();
            }));

    function dragStart() {

        var dragger = d3.drag()
            .subject(function (d) {
                return d;
            })
            .on("start", function (d) {
                ctx.active = d3.select(this);
                drag(d);
            })
            .on("drag", drag);

        var group = ctx.canvas.append('g')
            .datum({x: 0, y: 0, r: 77})
            .call(dragger);

        ctx.active = ctx.mode.dragStart(group, d3.event);

        applyBrush(ctx.active);

        function drag(d) {
            //d.x = d3.event.x;
            //d.y = d3.event.y;
            d.r = d3.event.y;
            ctx.active.attr('transform', getTransform(d));
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
        return'rotate(' + d.r +',' + x + ',' + y + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function dragEnd() {
        ctx.extent.updateExtent(ctx);
        ctx.broker.fire(ctx.broker.events.MODE, 'null')
    }

}






},{}],4:[function(require,module,exports){
// extent.js

module.exports = extent;

var placementKeys = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function extent(ctx) {

    var extent = ctx.svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    ctx.svg.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .attr('cx', -1e10)
        .attr('cy', -1e10)
        .attr('r', 5)
        .each(function (d) {
            d3.select(this)
                .classed('knob ' + d, true);
        });

    return {
        updateExtent: function () {
            var a = ctx.active;
            var r = a.node().getBoundingClientRect();

            var t = a.attr('stroke-width') ||
                d3.select(a.node().firstChild).attr('stroke-width');
            var n = ctx.svg.node().parentNode;

            var p = 2 + t/2 * ctx.transform.k;
            var ox = n.clientWidth / 2 + n.offsetLeft;
            var x = r.x - ox - p;
            var oy = n.clientHeight / 2 + n.offsetTop;
            var y = r.y - oy - p;
            var w = r.width + p * 2;
            var h = r.height + p * 2;

            extent
                .attr('x', x)
                .attr('y', y)
                .attr('width', w)
                .attr('height', h)


            drawMarkers(a.node(), ox, oy);
        }
    }


    var RAD2DEG = 180 / Math.PI;

    function makePlacementMarker(name, point, ox, oy) {
        d3.select('circle.' + name)
            .attr('cx', point.x - ox)
            .attr('cy', point.y - oy)
    }

    function drawMarkers(el, ox, oy) {
        var pt = ctx.svg.node().createSVGPoint();
        var bbox = el.getBBox(),
            matrix = el.getScreenCTM(),
            halfWidth = bbox.width / 2,
            halfHeight = bbox.height / 2,
            placements = [] ;

        function pushPlacement() {
            placements.push(pt.matrixTransform(matrix));
        }

        // get bbox corners and midpoints
        pt.x = bbox.x;
        pt.y = bbox.y;
        pushPlacement();
        pt.x += halfWidth;
        pushPlacement();
        pt.x += halfWidth;
        pushPlacement();
        pt.y += halfHeight;
        pushPlacement();
        pt.y += halfHeight;
        pushPlacement();
        pt.x -= halfWidth;
        pushPlacement();
        pt.x -= halfWidth;
        pushPlacement();
        pt.y -= halfHeight;
        pushPlacement();

        // determine rotation
        var rotation, steps;
        if (placements[0].y !== placements[1].y || placements[0].x !== placements[7].x) {
            rotation = Math.atan2( matrix.b, matrix.a ) * RAD2DEG;
            steps = Math.ceil(((rotation % 360) - 22.5) / 45);
            if (steps < 1) steps += 8;
            while (steps--) {
                placementKeys.push(placementKeys.shift());
            }
        }

        var placementMap = {};
        for (var x=0; x<placements.length; x++) {
            placementMap[placementKeys[x]] = placements[x];
            makePlacementMarker(placementKeys[x], placements[x], ox, oy);
        }
    }




}

},{}],5:[function(require,module,exports){
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
},{"../mode/circle":8,"../mode/line":9,"../mode/pen":10,"../mode/rect":11}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createTransformer = require('./app/transformer');
var createEvents = require('./app/broker');
var createModes = require('./app/modes');

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

    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;

    function g(className) {
        return ctx.svg.append('g').classed(className, true);
    }

};

},{"./app/axes":1,"./app/broker":2,"./app/canvas":3,"./app/extent":4,"./app/modes":5,"./app/transformer":6}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}]},{},[7]);
