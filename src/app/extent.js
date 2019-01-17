// app/extent.js

module.exports = extent;

var placementKeys = [
    ['nw', 0, 0],
    ['w', 0, 1],
    ['sw', 0, 1],
    ['s', 1, 0],
    ['se', 1, 0],
    ['e', 0, -1],
    ['ne', 0, -1],
    ['n', -1, 0],
    ['r', 0, -15]
];

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

    extent.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .call(circle)
        .attr('cursor', 'pointer')
        .each(function (d) {

            var knob = d3.select(this);
            knob.classed('knob ' + d[0], true);

            if (d[0] !== 'r')
                return;

            knob.call(dragKnob(knob));

        });

    return {
        updateExtent: render
    };

    function render() {
        var a = ctx.active;
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

        var n = ctx.svg.node().parentNode;
        var ox = n.clientWidth / 2 + n.offsetLeft;
        var oy = n.clientHeight / 2 + n.offsetTop;
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

    function dragKnob(knob) {
        return d3.drag()
            .on("start", function (d) {
                fill(knob, 'rgba(0, 40, 255, 0.5)');
                var n = ctx.svg.node().parentNode;
                var ox = n.clientWidth / 2 + n.offsetLeft;
                var oy = n.clientHeight / 2 + n.offsetTop;
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - ox;
                d.cy = r.y + r.height/2 - oy;
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');

            })
            .on("drag", function (d) {
                var x = d3.event.x;
                var y = d3.event.y;
                var a = Math.atan2(y - d.cy, x - d.cx) * 180 / Math.PI + 90;

                // if (d3.event.sourceEvent.ctrlKey && Math.abs(a) % 90 < 9)
                //     a = 90 * (a/90).toFixed(0);

                ctx.active.datum().r = a;
                ctx.active.attr('transform', function () {
                    return getTransform(ctx.active.datum());
                });
                render();
            })
            .on("end", function () {
                fill(knob, 'transparent');
                center.attr('display', 'none');
            })
    }

    function getTransform(d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return'rotate(' + d.r +',' + (x+d.x)  + ',' + (y+d.y) + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function circle(el) {
        el.call(style)
            .attr('display', 'none')
            .attr('r', 5)
    }

    function fill(el, col) {
        el.transition()
            .duration(100)
            .style('fill', col)
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
