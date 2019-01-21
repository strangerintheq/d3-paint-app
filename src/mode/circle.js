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
        .attr('d', function (d) {
            var x = mouse.x - d.x;
            var y = mouse.y - d.y;
            return getPath(d.x, d.y, Math.sqrt(x*x + y*y))
        })
}


function getPath(cx,cy,r){
    var res = "";
    var a = 4;
    for (var i = 0; i<360/a; i++)
        res += describeArc(cx,cy, r, 360-i*a,360-(i*a+a));
    return res
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle){

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d + ' ';
}