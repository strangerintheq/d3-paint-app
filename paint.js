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
module.exports = extent;

function extent(svg) {

    var extent = svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    return {
        updateExtent: function (paint) {
            var a = paint.active;
            var r = a.node().getBoundingClientRect();
            var b = a.node().getBBox();
            var n = svg.node().parentNode;
            a.attr('transform',
                'translate('+(-b.x)+' '+(-b.y)+')' +
                'rotate(90 0 0)' +
                'translate('+(b.x)+' '+(b.y)+')');
            var pad = 1 + a.attr('stroke-width')/2 * paint.transform.k;
            var x = r.x - n.clientWidth/2 - n.offsetLeft - pad;
            var y = r.y - n.clientHeight/2 - n.offsetTop - pad;
            var w = r.width + pad * 2;
            var h = r.height + pad * 2;
            extent.attr('x', x).attr('y', y)
                .attr('width', w).attr('height', h)
        }
    }
}

},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
var createAxes = require('./axes');
var createExtent = require('./extent');

var modes = {
    circle: require('./mode/circle'),
    rect: require('./mode/rect'),
    line: require('./mode/line'),
    pen: require('./mode/pen')
};

window.d3Paint = function (elementOrSelector) {

    var mode;
    var width = 800;
    var height = 600;
    var zoomCallbacks = [];
    var containerElement = d3.select(elementOrSelector);
    var svg = containerElement.append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet');

    var axes = createAxes(svg);
    var helpers = g('helpers');
    var canvas = g('canvas');
    var extent = createExtent(svg);
    svg.call(createZoom());

    window.oncontextmenu = function () {
        return false
    };

    helpers.append('rect')
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('x', -width/2)
        .attr('y', -height/2)
        .attr('width', width)
        .attr('height', height)
        .call(createDrag());

    var paint = {
        transform : d3.zoomTransform(svg),
        active: null,
        adjustSize: adjustSize,
        onZoom: onZoom,
        setMode: function (newMode) {
            mode = modes[newMode];
        }
    };

    adjustSize();

    return paint;

    function onZoom(onZoomFn) {
        zoomCallbacks.push(onZoomFn);
    }

    function zoomed() {
        helpers.attr("transform", paint.transform);
        canvas.attr("transform", paint.transform);
        axes.applyZoom(paint.transform);
        paint.active && extent.updateExtent(paint);
        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(paint.transform);
        });
    }

    function adjustSize() {
        var w = containerElement.node().clientWidth;
        var h = containerElement.node().clientHeight;
        svg.attr('width', w).attr('height', h)
            .attr('viewBox', -w/2 + ' ' + -h/2 + ' ' + w + ' ' + h);
        axes.applySize(w, h);
        zoomed()
    }

    function createDrag() {
        return d3.drag()
            .on("start", function () {
                mode && dragStart();
            })
            .on("drag", function () {
                mode && mode.dragMove(d3.event);
            })
            .on("end", function () {
                mode && dragEnd();
            });
    }

    function dragStart() {
        var group = canvas.append('g');
        paint.active = mode.dragStart(group, d3.event);
        applyBrush(paint.active);
    }

    function dragEnd() {
        extent.updateExtent(paint);
    }

    function g(className) {
        return svg.append('g').classed(className, true);
    }

    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function createZoom() {
        return d3.zoom().filter(function () {
            return true;
        })
        .scaleExtent([0.1, 1000])
        .on("zoom", function() {
            paint.transform = d3.event.transform;
            zoomed();
        });
    }
};

},{"./axes":1,"./extent":2,"./mode/circle":3,"./mode/line":4,"./mode/pen":5,"./mode/rect":6}]},{},[7]);
