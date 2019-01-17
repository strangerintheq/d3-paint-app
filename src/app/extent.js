// extent.js

module.exports = extent;

var placementKeys = [
    ['nw', 0, 0],
    ['n', 1, 0],
    ['ne', 1, 0],
    ['e', 0, 1],
    ['se', 0, 1],
    ['s', -1, 0],
    ['sw', -1, 0],
    ['w', 0, -1]
];

function extent(ctx) {

    var pt = ctx.svg.node().createSVGPoint();

    var extent = ctx.svg.append('g')
        .classed('extent', true)
        .append('path')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    ctx.svg.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .attr('cx', -1e10)
        .attr('cy', -1e10)
        .attr('r', 5)
        .each(function (d) {
            d3.select(this)
                .classed('knob ' + d[0], true);
        });

    return {
        updateExtent: function () {

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
                pt.x += p[1] * hw;
                pt.y += p[2] * hh;
                return pt.matrixTransform(matrix);
            });

            var n = ctx.svg.node().parentNode;
            var ox = n.clientWidth / 2 + n.offsetLeft;
            var oy = n.clientHeight / 2 + n.offsetTop;
            var d = "";
            pts.forEach(function (p, i) {
                d3.select('circle.' + placementKeys[i][0])
                    .attr('cx', p.x - ox)
                    .attr('cy', p.y - oy);

                if (i%2 === 0) {
                    d += !d ? "M" : "L";
                    d += (p.x - ox) + ",";
                    d += (p.y - oy) + " ";
                }
            });

            extent.attr('d', d + "Z");

        }
    };
}
