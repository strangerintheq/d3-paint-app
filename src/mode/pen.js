var line = d3.line().curve(d3.curveBasis);

var ctx;

var mode = {
    active: null,
    dragStart: dragStart,
    dragMove: dragMove
};

module.exports = mode;

function dragStart(group, e) {

    var dataArray = [[e.x, e.y], [e.x, e.y]];

    mode.active = group.append("path")
        .classed('figure', true)
        .datum(dataArray);

    ctx = {
        d: dataArray,
        active: mode.active,
        x0: e.x,
        y0: e.y
    };

    dragMove(e);
}

function dragMove(e) {

    var x1 = e.x,
        y1 = e.y,
        dx = x1 - ctx.x0,
        dy = y1 - ctx.y0;

    if (dx * dx + dy * dy > 10)
        ctx.d.push([ctx.x0 = x1, ctx.y0 = y1]);
    else
        ctx.d[ctx.d.length - 1] = [x1, y1];

    ctx.active.attr("d", line);
}