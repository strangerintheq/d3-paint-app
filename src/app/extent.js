// extent.js

module.exports = extent;

var placementKeys = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function extent(ctx) {

    var extent = ctx.svg.append('g')
        .classed('extent', true)
        .append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 5');

    ctx.svg.selectAll('circle.knob')
        .data(placementKeys)
        .enter()
        .append('circle')
        .attr('cx', -1e10)
        .attr('cy', -1e10)
        .attr('r', 5)
        .each(function (d) {
            d3.select(this)
                .classed('knob ' + d, true);
        });

    return {
        updateExtent: function () {
            var a = ctx.active;
            var r = a.node().getBoundingClientRect();

            var t = a.attr('stroke-width') ||
                d3.select(a.node().firstChild).attr('stroke-width');
            var n = ctx.svg.node().parentNode;

            var p = 2 + t/2 * ctx.transform.k;
            var ox = n.clientWidth / 2 + n.offsetLeft;
            var x = r.x - ox - p;
            var oy = n.clientHeight / 2 + n.offsetTop;
            var y = r.y - oy - p;
            var w = r.width + p * 2;
            var h = r.height + p * 2;

            extent
                .attr('x', x)
                .attr('y', y)
                .attr('width', w)
                .attr('height', h)


            drawMarkers(a.node(), ox, oy);
        }
    }


    var RAD2DEG = 180 / Math.PI;

    function makePlacementMarker(name, point, ox, oy) {
        d3.select('circle.' + name)
            .attr('cx', point.x - ox)
            .attr('cy', point.y - oy)
    }

    function drawMarkers(el, ox, oy) {
        var pt = ctx.svg.node().createSVGPoint();
        var bbox = el.getBBox(),
            matrix = el.getScreenCTM(),
            halfWidth = bbox.width / 2,
            halfHeight = bbox.height / 2,
            placements = [] ;

        function pushPlacement() {
            placements.push(pt.matrixTransform(matrix));
        }

        // get bbox corners and midpoints
        pt.x = bbox.x;
        pt.y = bbox.y;
        pushPlacement();
        pt.x += halfWidth;
        pushPlacement();
        pt.x += halfWidth;
        pushPlacement();
        pt.y += halfHeight;
        pushPlacement();
        pt.y += halfHeight;
        pushPlacement();
        pt.x -= halfWidth;
        pushPlacement();
        pt.x -= halfWidth;
        pushPlacement();
        pt.y -= halfHeight;
        pushPlacement();

        // determine rotation
        var rotation, steps;
        if (placements[0].y !== placements[1].y || placements[0].x !== placements[7].x) {
            rotation = Math.atan2( matrix.b, matrix.a ) * RAD2DEG;
            steps = Math.ceil(((rotation % 360) - 22.5) / 45);
            if (steps < 1) steps += 8;
            while (steps--) {
                placementKeys.push(placementKeys.shift());
            }
        }

        var placementMap = {};
        for (var x=0; x<placements.length; x++) {
            placementMap[placementKeys[x]] = placements[x];
            makePlacementMarker(placementKeys[x], placements[x], ox, oy);
        }
    }




}
