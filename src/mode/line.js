// mode/line.js

var active;

var mode = {
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    active = group.append("path")
        .classed('figure line', true)
        .datum({
            x1: e.x,
            y1: e.y
        });

    dragMove(e);

    return active;
}

function dragMove(e) {

    active.datum().x2 = e.x;
    active.datum().y2 = e.y;

    active.attr('d', function (d) {
        return 'M ' + d.x1 + ',' + d.y1 + ' L ' + d.x2 + ',' + d.y2;
    });

}
