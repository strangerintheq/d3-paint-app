var svgpath = require('svgpath');
var svg = require('./svg');

module.exports = function (ctx, vxs, vxe, vys, vye, dw, dh) {
    return function (knob) {
        return d3.drag()
            .on("start", function (d) {
                svg.fill(knob, 'rgba(0, 40, 255, 0.5)', 150);
                if (vxs && vxe)
                    d.lineX = line(knob, vxs, vxe);
                if (vys && vye)
                    d.lineY = line(knob, vys, vye);
                d.path = ctx.active.node().firstChild.getAttribute('d');

                var box = ctx.active.node().firstChild.getBBox();
                var x = box.x + dw * box.width;
                var y = box.y + dh * box.height;

              //  var r = ctx.active.node().getBoundingClientRect();
              //  var cx = r.x + r.width / 2 - svg.screenOffsetX(ctx);
              //  var cy = r.y + r.height / 2 - svg.screenOffsetY(ctx);

                d.origin = {x: x, y: y};//rotate(cx, cy, x,y, ctx.active.datum().r)
            })
            .on("drag", function (d) {
                calc(d.lineX);
                calc(d.lineY);

                var transformed = svgpath(d.path)
                    .translate(-d.origin.x, -d.origin.y)
                    .scale(
                        d.lineX ? d.lineX.datum().scale : 1,
                        d.lineY ? d.lineY.datum().scale : 1
                    )
                    .translate(d.origin.x, d.origin.y)
                    .round(1);

                ctx.active.node().firstChild.setAttribute('d', transformed.toString());
                ctx.active.attr('transform', svg.getTransform);
                ctx.extent.updateExtent();
            })
            .on("end", function (d) {
                svg.fill(knob, 'transparent', 150);
                del(d, 'lineX');
                del(d, 'lineY');
                d.path = null;
            });

        function calc(line) {
            if (!line)
                return;
            var datum = line.datum();
            var x1 = datum.sx, y1 = datum.sy;
            var x2 = datum.ex, y2 = datum.ey;
            var x3 = d3.event.x, y3 = d3.event.y;
            var dx = x2 - x1, dy = y2 - y1;
            var k = (dy * (x3 - x1) - dx * (y3 - y1)) / (dy * dy + dx * dx);
            datum.x1 = x3;
            datum.y1 = y3;
            datum.x2 = x3 - k * dy;
            datum.y2 = y3 + k * dx;
            datum.scale = Math.sqrt(
                Math.pow(datum.x2 - x1, 2) + Math.pow(datum.y2 - y1, 2)
            ) / Math.sqrt(dx * dx + dy * dy);
            upd(line);
        }

    };

    function del(d, key) {
        if (!d[key])
            return;
        d[key].remove();
        d[key] = null;
    }

    function upd(line) {
        line.attr('x1', function (d) {
            return d.x1
        }).attr('y1', function (d) {
            return d.y1
        }).attr('x2', function (d) {
            return d.x2
        }).attr('y2', function (d) {
            return d.y2
        })
    }

    function line(knob, vs, ve) {
        vs = d3.select('circle.knob.' + vs);
        ve = d3.select('circle.knob.' + ve);
        return ctx.svg.append('line')
            .datum({
                sx: +vs.datum().x,
                sy: +vs.datum().y,
                ex: +ve.datum().x,
                ey: +ve.datum().y
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }

    function rotate(cx, cy, x, y, angle) {
        var radians = (Math.PI / 180) * angle;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
        var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return {x: nx, y: ny};
    }
};