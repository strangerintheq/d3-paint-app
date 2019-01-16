// extent.js

module.exports = extent;

function extent(ctx) {

    var extent = ctx.svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    return {
        updateExtent: function () {
            var a = ctx.active;
            var r = a.node().getBoundingClientRect();
            var b = a.node().getBBox();
            var t = a.attr('stroke-width') ||
                d3.select(a.node().firstChild).attr('stroke-width');
            var n = ctx.svg.node().parentNode;
            // a.attr('transform',
            //     'translate('+(-b.x)+' '+(-b.y)+')' +
            //     'rotate(90 0 0)' +
            //     'translate('+(b.x)+' '+(b.y)+')');
            var p = 2 + t/2 * ctx.transform.k;
            var x = r.x - n.clientWidth/2 - n.offsetLeft - p;
            var y = r.y - n.clientHeight/2 - n.offsetTop - p;
            var w = r.width + p * 2;
            var h = r.height + p * 2;

            extent
                .attr('x', x)
                .attr('y', y)
                .attr('width', w)
                .attr('height', h)

        }
    }

}
