module.exports = extent;

function extent(svg) {

    var extent = svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    return {
        updateExtent: function (paint) {
            var a = paint.active;
            var r = a.node().getBoundingClientRect();
            var b = a.node().getBBox();
            var n = svg.node().parentNode;
            // a.attr('transform',
            //     'translate('+(-b.x)+' '+(-b.y)+')' +
            //     'rotate(90 0 0)' +
            //     'translate('+(b.x)+' '+(b.y)+')');
            var pad = 1 + a.attr('stroke-width')/2 * paint.transform.k;
            var x = r.x - n.clientWidth/2 - n.offsetLeft - pad;
            var y = r.y - n.clientHeight/2 - n.offsetTop - pad;
            var w = r.width + pad * 2;
            var h = r.height + pad * 2;
            extent.attr('x', x).attr('y', y)
                .attr('width', w).attr('height', h)
        }
    }
}
