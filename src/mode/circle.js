// mode/circle.js

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
        // .attr('cx', function (d) {return d.x;})
        // .attr('cy', function (d) {return d.y;})
        // .attr('r', function (d) {
        //     var x = mouse.x - d.x;
        //     var y = mouse.y - d.y;
        //     return Math.sqrt(x*x + y*y);
        // })
        .attr('d', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return getPath(d.x, d.y, Math.sqrt(x*x + y*y))
        })
}


function getPath(cx,cy,r){
    return "M" + cx + "," + cy + "m" + (-r) + ",0a" + r + "," + r + " 0 1,0 " + (r * 2) + ",0a" + r + "," + r + " 0 1,0 " + (-r * 2) + ",0";
}