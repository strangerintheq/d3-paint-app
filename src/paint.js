var d3 = require('d3');

window.d3Paint = function (elementOrSelector) {

    // var zoom = 1;
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
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height);


    var canvas = svg.append('g')
        .classed('canvas', true);

    var pad = 25;
    var zoom = d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[-pad, -pad], [width+pad, height+pad]])
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
        adjustSize: adjustSize
    };

    function zoomed() {
        if (!t)
            return;
        helpers.attr("transform", t);
        canvas.attr("transform", t);
        gX.call(xAxis.scale(t.rescaleX(x)));
        gY.call(yAxis.scale(t.rescaleY(y)));
    }

    function adjustSize() {
        var w = containerElement.node().clientWidth;
        var h = containerElement.node().clientHeight;
        svg.attr('width', w).attr('height', h);

        x.domain([-0.5, w + 0.5]).range([-0.5, w + 0.5]);
        y.domain([-0.5, h + 0.5]).range([-0.5, h + 0.5]);

        xAxis.ticks((w + 2) / (h + 2) * 10)
            .tickSize(h)
            .tickPadding(8 - h);

        yAxis.ticks(10)
            .tickSize(w)
            .tickPadding(8 - w);

        zoomed()
    }
};

