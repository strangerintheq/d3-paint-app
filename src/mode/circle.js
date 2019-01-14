
var mode = {
    active: null,
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, mouse) {
    mode.active = group.append("circle")
        .classed('figure', true)
        .datum(mouse);

    dragMove(mouse);
}

function dragMove(mouse) {
    mode.active.attr('cx', function (d) {return d.x;})
        .attr('cy', function (d) {return d.y;})
        .attr('r', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return Math.sqrt(x*x + y*y);
        })
}