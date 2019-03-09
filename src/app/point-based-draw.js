


let points = [];
let dragged;
let selected;
let group;
let line = d3.line().curve(d3.curveCardinal);
let ctx;
let pointBasedTool;

module.exports = {

    isNeedToCreateGroup : function(){
        return points.length === 0;
    },

    init: function (context) {
        ctx = context;
        if (!pointBasedTool) {
            pointBasedTool = ctx.svg.append('g')
                .classed('point-based-tool', true);
        }
        points = [];
    },

    dragStart: mousedown,
    dragEnd: mouseup,
    dragMove: mousemove,
};

function redraw() {

    var circle = pointBasedTool
        .selectAll("circle.knob")
        .data(points, d => d);

    circle.exit()
        .remove();

    let newNodes = circle.enter()
        .append("circle")
        .classed('knob', true)
        .attr("r", 1e-6)
        .on("mousedown", d => {
            selected = dragged = d;
            redraw();
        })
        .transition()
        .duration(250)
        .attr("r", 6.5);

    circle.merge(newNodes)
        .classed("selected", d => d === selected)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1]);

    if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }
}



function mousedown(e) {

    if (!points.length) {

        group = ctx.svg.select('g.canvas')
            .append('g')
            .datum({x: 0, y: 0, r: 0});

        ctx.active = group.append("path")
            .attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
            .classed('figure point-based', true);
    }

    points.push(selected = dragged = d3.mouse(ctx.svg.node()));

    ctx.active.datum(points).attr('d', line);

    redraw();
}

function mousemove(e) {
    if (!dragged)
        return;

    let m = d3.mouse(ctx.svg.node());
    dragged[0] = m[0];
    dragged[1] = m[1];

    redraw();
}

function mouseup(e) {
    if (!dragged)
        return;
    mousemove(e);
    dragged = null;
}

