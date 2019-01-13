var d3 = require('d3');

window.d3Paint = function (elementOrSelector) {

    var zoomCallbacks = [];
    var width = 800;
    var height = 600;
    var containerElement = d3.select(elementOrSelector);

    var svg = containerElement.append('svg')
       .attr('preserveAspectRatio','xMidYMid meet')
        .style('background-color', 'white');

    var helpers = svg.append('g')
        .classed('helpers', true);

    var t = d3.zoomTransform(svg);

    helpers.append('rect')
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('x', -width/2)
        .attr('y', -height/2)
        .attr('width', width)
        .attr('height', height);


    var canvas = svg.append('g')
        .classed('canvas', true);

    var zoom = d3.zoom()
        .on("zoom", function() {
            t = d3.event.transform;
            zoomed();
        });

    var x = d3.scaleLinear();
    var y = d3.scaleLinear();
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisRight(y);

    var gX = svg.append("g")
        .attr("class", "axis axis--x")
        .call(xAxis);

    var gY = svg.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    svg.call(zoom);

    adjustSize();

    return {
        adjustSize: adjustSize,
        onZoom: onZoom
    };

    function onZoom(onZoomFn) {
        zoomCallbacks.push(onZoomFn);
    }

    function zoomed() {
        helpers.attr("transform", t);
        canvas.attr("transform", t);

        gX.call(xAxis.scale(t.rescaleX(x)));
        gY.call(yAxis.scale(t.rescaleY(y)));

        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(t);
        })
    }

    function adjustSize() {
        var w = containerElement.node().clientWidth;
        var h = containerElement.node().clientHeight;
        svg.attr('width', w)
            .attr('height', h)
            .attr('viewBox', -w/2 + ' ' + -h/2 + ' ' + w + ' ' + h);

        x.domain([-w/2, w/2]).range([-w/2, w/2]);
        y.domain([-h/2, h/2]).range([-h/2, h/2]);

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

        zoomed()
    }
};

