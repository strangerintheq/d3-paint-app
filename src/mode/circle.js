// mode/circle.js
var svg = require('../app/svg');

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, mouse) {
    active = group.append("path")
        .classed('figure ellipse', true)
        .datum(mouse);

    dragMove(mouse);

    return active;
}

function dragMove(mouse) {
    active
        .attr('d', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return svg.circlePath(d.x, d.y, Math.sqrt(x*x + y*y), 15)
        })
}
