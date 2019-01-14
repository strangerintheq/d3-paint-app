var createAxes = require('./axes');
var createExtent = require('./extent')
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
    var transform = d3.zoomTransform(svg);
    svg.call(createZoom());
    adjustSize();
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

    return {
        adjustSize: adjustSize,
        onZoom: onZoom,
        setMode: function (newMode) {
            mode = modes[newMode];
        }
    };

    function onZoom(onZoomFn) {
        zoomCallbacks.push(onZoomFn);
    }

    function zoomed() {
        helpers.attr("transform", transform);
        canvas.attr("transform", transform);
        axes.applyZoom(transform);
        mode && mode.active && extent.updateExtent(mode.active.node());
        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(transform);
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
        mode.dragStart(group, d3.event);
        applyBrush(mode.active);
    }

    function dragEnd() {
        extent.updateExtent(mode.active.node());
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
            transform = d3.event.transform;
            zoomed();
        });
    }
};
