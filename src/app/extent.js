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
