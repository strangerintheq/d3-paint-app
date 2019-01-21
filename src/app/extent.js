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
        ['nw', 0, 0, scale(ctx, 'se', 'sw', 'se', 'ne',1,1, 'ne', 'se', 'sw')],
        ['w', 0, 1, scale(ctx, 'e', 'w', null,null, 1, 0.5, 'e', null, null)],
        ['sw', 0, 1, scale(ctx, 'ne', 'nw', 'ne', 'se',1,0, 'se', 'ne', 'nw')],
        ['s', 1, 0, scale(ctx, null, null, 'n', 's', 0.5, 0, null, null, 'n')],
        ['se', 1, 0, scale(ctx, 'nw','ne','nw', 'sw',0,0, 'sw', 'nw', 'ne')],
        ['e', 0, -1, scale(ctx, 'w', 'e', null, null, 0, 0.5,'w', null, null)],
        ['ne', 0, -1, scale(ctx, 'sw', 'se','sw', 'nw',0,1, 'nw', 'sw', 'se')],
        ['n', -1, 0, scale(ctx, null, null,'s', 'n',0.5, 1,null, null, 's')],
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
                .attr('cx', p.pad.x - ox)
                .attr('cy', p.pad.y - oy)
                .datum({
                    x: p.orig.x - ox,
                    y: p.orig.y - oy
                });

            if (i % 2 === 0 && i !== pts.length - 1) {
                d += !d ? "M" : "L";
                d += (p.pad.x - ox) + ",";
                d += (p.pad.y - oy) + " ";
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
