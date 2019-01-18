// app/extent.js

module.exports = extent;

var svg = require('./svg');
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
            path.attr('d', '')
            return knobs.attr('display', 'none');
        }
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

        var ox = svg.screenOffsetX(ctx);
        var oy = svg.screenOffsetY(ctx);
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
