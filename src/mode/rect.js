// mode/rect.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {
    active = group.append("path")
        .classed('figure rectangle', true)
        .datum({
            x: e.x,
            y: e.y
        });

    dragMove(e);
    return active;
}

function dragMove(e) {
    var d = active.datum();

    d.w = e.x - d.x;
    d.h = e.y - d.y;

    active
        .attr('d', function (d) {
            return 'M' + d.x + ',' + d.y +
                'L' + (d.x + d.w) +',' + d.y +
                'L' + (d.x + d.w) +',' + (d.y + d.h) +
                'L' + d.x +',' + (d.y + d.h) +
                'z'
        })
}
