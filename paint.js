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
        var group = ctx.canvas.append('g').call(d3.drag()
            .on("start", function () {
                ctx.active = d3.select(this);
                ctx.extent.updateExtent(ctx);
            })
            .on("drag", function () {
                d3.select(this).attr('transform', getTransform());
                ctx.extent.updateExtent(ctx);
            }));

        ctx.active = ctx.mode.dragStart(group, d3.event);

        applyBrush(ctx.active);
    }


    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function getTransform() {
        var x = 0;
        var y = 0;
        return 'translate(' + x +',' + y + ')'
    }

    function dragEnd() {
        ctx.extent.updateExtent(ctx);
    }

}






},{}],3:[function(require,module,exports){
// extent.js

module.exports = extent;

function extent(ctx) {

    var extent = ctx.svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    return {
        updateExtent: function () {
            var a = ctx.active;
            var r = a.node().getBoundingClientRect();
            var b = a.node().getBBox();
            var t = a.attr('stroke-width') ||
                d3.select(a.node().firstChild).attr('stroke-width');
            var n = ctx.svg.node().parentNode;
            // a.attr('transform',
            //     'translate('+(-b.x)+' '+(-b.y)+')' +
            //     'rotate(90 0 0)' +
            //     'translate('+(b.x)+' '+(b.y)+')');
            var p = 2 + t/2 * ctx.transform.k;
            var x = r.x - n.clientWidth/2 - n.offsetLeft - p;
            var y = r.y - n.clientHeight/2 - n.offsetTop - p;
            var w = r.width + p * 2;
            var h = r.height + p * 2;

            extent
                .attr('x', x)
                .attr('y', y)
                .attr('width', w)
                .attr('height', h)
        }
    }

}

},{}],4:[function(require,module,exports){
var createAxes = require('./axes');
var createExtent = require('./extent');
var createCanvas = require('./canvas');
var createTransformer = require('./transformer');

var modes = {
    circle: require('./mode/circle'),
    rect: require('./mode/rect'),
    line: require('./mode/line'),
    pen: require('./mode/pen')
};

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    ctx.helpers = g('helpers');
    ctx.canvas = g('canvas');
    ctx.axes = createAxes(ctx.svg);
    ctx.extent = createExtent(ctx);
    ctx.transformer = createTransformer(ctx);

    ctx.transform = d3.zoomTransform(ctx.svg);
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape

    createCanvas(ctx);

    ctx.transformer.adjustSize();

    window.oncontextmenu = function () {
        return false
    };

    return {
        adjustSize: ctx.transformer.adjustSize,
        onTransform: ctx.transformer.onTransform,
        setMode: setMode
    };

    function setMode(newMode) {
        ctx.mode = modes[newMode];
    }

    function g(className) {
        return ctx.svg.append('g').classed(className, true);
    }
};

},{"./axes":1,"./canvas":2,"./extent":3,"./mode/circle":5,"./mode/line":6,"./mode/pen":7,"./mode/rect":8,"./transformer":9}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
module.exports = transformer;

function transformer(ctx) {

    var zoomCallbacks = [];

    ctx.svg.call(createZoom());

    return {
        adjustSize: adjustSize,
        onTransform: onTransform
    };

    function onTransform(onZoomFn) {
        zoomCallbacks.push(onZoomFn);
    }

    function zoomed() {
        ctx.helpers.attr("transform", ctx.transform);
        ctx.canvas.attr("transform", ctx.transform);
        ctx.axes.applyZoom(ctx.transform);
        ctx.active && ctx.extent.updateExtent(ctx);
        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(ctx.transform);
        });
    }

    function adjustSize() {
        var w = ctx.containerElement.node().clientWidth;
        var h = ctx.containerElement.node().clientHeight;
        ctx.svg.attr('width', w).attr('height', h)
            .attr('viewBox', -w/2 + ' ' + -h/2 + ' ' + w + ' ' + h);
        ctx.axes.applySize(w, h);
        zoomed()
    }

    function createZoom() {
        return d3.zoom()
            .filter(function () {
                return true;
            })
            .scaleExtent([0.1, 100])
            .on("zoom", function() {
                ctx.transform = d3.event.transform;
                zoomed();
            });
    }
}


},{}]},{},[4]);
