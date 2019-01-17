// mode/rect.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {
    active = group.append("rect")
        .classed('figure', true)
        .datum([[e.x, e.y], [e.x, e.y]]);

    dragMove(e);
    return active;
}

function dragMove(e) {
    active
        .attr('x', function (d) {
            return Math.min(e.x, d[0][0]);
        })
        .attr('y', function (d) {
            return Math.min(e.y, d[0][1]);
        })
        .attr('width', function (d) {
            return Math.abs(e.x - d[0][0]);
        })
        .attr('height', function (d) {
            return Math.abs(e.y - d[0][1]);
        })
}