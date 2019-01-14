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
        updateExtent: function (node) {



            console.log(node.getBBox())
            var r = node.getBoundingClientRect();
            var el = svg.node().parentNode;
            let x = r.x  - el.clientWidth/2 - el.offsetLeft -5;
            let y = r.y -el.clientHeight/2 - el.offsetTop -5;
            let w = r.width + 10;
            let h = r.height + 10;
            extent.attr('x', x)
                .attr('y', y)
                .attr('width', w)
                .attr('height', h)

        }
    }
}
