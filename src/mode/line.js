var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    active = group.append("line")
        .classed('figure', true)
        .attr('x1', e.x)
        .attr('y1', e.y)
        .datum(e.subject);

    dragMove(e);

    return active;
}

function dragMove(e) {
    active
        .attr('x2', e.x)
        .attr('y2', e.y)
}