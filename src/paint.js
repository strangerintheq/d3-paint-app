var createAxes = require('./axes');

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
        .attr('preserveAspectRatio','xMidYMid meet');

    window.oncontextmenu = function () {
        return false;
    };

    var helpers = svg.append('g')
        .classed('helpers', true);

    var t = d3.zoomTransform(svg);

    helpers.append('rect')
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('x', -width/2)
        .attr('y', -height/2)
        .attr('width', width)
        .attr('height', height)
        .call(createDrag());

    var canvas = svg.append('g')
        .classed('canvas', true);

    var axes = createAxes(svg);
    svg.call(createZoom());
    adjustSize();

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
        helpers.attr("transform", t);
        canvas.attr("transform", t);
        axes.applyZoom(t);
        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(t);
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
            // .container(function() {
            //     return this;
            // })
            // .subject(function() {
            //     var p = [
            //         d3.event.x,
            //         d3.event.y
            //     ];
            //     return [p, p];
            // })
            .on("start", dragStart)
            .on("drag", dragMove)
            .on("end", dragEnd);
    }

    function dragStart() {
        if (!mode)
            return;

        var group = canvas.append('g');
        mode.dragStart(group, mouseOffset(d3.event));
        // this.createExtent(group);
        applyBrush(mode.active);
    }

    function applyBrush(active) {
        active.attr('stroke-width', 2)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function dragMove() {
        mode && mode.dragMove && mode.dragMove(mouseOffset(d3.event));
    }

    function dragEnd() {
        mode && mode.dragEnd && mode.dragEnd();
    }

    function mouseOffset(m) {
        // if (t) {
        //     m.x = (-t.x + m.x) / t.k;
        //     m.y = (-t.y + m.y) / t.k;
        // }
        return m;
    }

    function createZoom() {
        return d3.zoom().filter(function () {
            return true;
        })
        .scaleExtent([0.1, 1000])
        .on("zoom", function() {
            t = d3.event.transform;
            zoomed();
        });
    }
};

