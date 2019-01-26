// app/extent.js

module.exports = extent;

var svg = require('./svg');
var rotate = require('./rotate');
var scale = require('./scale');
var filterOutline = require('./filterOutline');
function extent(ctx) {

    var extent = svg.g('extent');

    filterOutline(ctx.defs, 'filter-outline');

    var path = extent.append('path')
        .call(style)
        .attr("clip-path", "url(#clip-knobs)")
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
        ['r', 0, -25, rotate(ctx, center)]
    ];

    var clipPath = ctx.defs.append("clipPath")
        .attr("id", "clip-knobs")
        .append("path");

    var knobs = extent.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .call(circle)
        .attr('cursor', 'pointer')
        .each(function (d) {
            var knob = d3.select(this);
            knob.classed('knob ' + d[0], true);
            d[3] && knob.call(d[3](knob));
        });

    var outline = ctx.svg.select('.helpers')

        .append('path')
        .style('filter', 'url(#filter-outline)')
        .classed('outline', true)
        .attr('stroke', 'skyblue')
        //.attr('stroke-linecap', 'square')
        .attr('fill', 'transparent')
        .attr('pointer-events', 'none');

   // animate();

    function animate() {
        outline.transition()
            .duration(1000)
            .attr('stroke', 'rgba(255, 40, 0, 0.3)')
            .transition()
            .duration(1000)
            .attr('stroke', 'rgba(0, 40, 255, 0.3)')
            .on('end', animate)
    }

    var canDelete;

    return {
        updateExtent: render
    };

    function changeCanDeleteState() {
        ctx.broker.fire(ctx.broker.events.CAN_DELETE, canDelete = !canDelete);
        ctx.broker.fire(ctx.broker.events.CAN_EDIT, canDelete);
    }

    function render() {
        var a = ctx.active;

        if (canDelete && !ctx.active || !canDelete && ctx.active)
            changeCanDeleteState()

        if (!a) {
            path.attr('d', '');
            knobs.attr('display', 'none');
            outline.attr('d', '');
            return;
        }

        var thick = a.attr('stroke-width') ||
            d3.select(a.node().firstChild).attr('stroke-width');

        var pad = 0;//2 + thick / 2 / ctx.transform.k;
        var calc = svg.createPointCalc(a, pad);

        var pts = placementKeys.map(function (p) {
            var absolute = Math.abs(p[2]) > 1.0001 ? ctx.transform.k : null;
            return calc.shift(p[1], p[2], absolute).calc();
        });

        var ox = svg.screenOffsetX(ctx);
        var oy = svg.screenOffsetY(ctx);
        var d = "";
        var clipD = "M-2000,-2000L-2000,2000L2000,2000L2000,-2000Z";
        pts.forEach(function (p, i) {

            d3.selectAll('circle.' + placementKeys[i][0])
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

            clipD += svg.circlePath(p.pad.x - ox, p.pad.y - oy, 5)

        });
        clipPath.attr('d', clipD);
        path.attr('d', d + "Z");
        outline.attr('d', a.attr('d') || d3.select(a.node().firstChild).attr('d'))
            .attr('stroke-width', (5/ctx.transform.k) +(+thick))
            .attr('transform', a.attr('transform') || d3.select(a.node().parentNode).attr('transform'));

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
