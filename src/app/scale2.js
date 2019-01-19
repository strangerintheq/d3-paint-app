var svgpath = require('svgpath');

module.exports = function (ctx, vxs, vxe, vys, vye, dw, dh) {
    return function (knob) {
        return d3.drag()
            .on("start", function (d) {
                d.lineX = line(knob, vxs, vxe);
                d.lineY = line(knob, vys, vye);
                d.path = ctx.active.node().firstChild.getAttribute('d');
                var box = ctx.active.node().firstChild.getBBox();
                d.boxX = box.x+ dw * box.width;
                d.boxY = box.y+ dh * box.height;
            })
            .on("drag", function (d) {
                calc(d.lineX);
                calc(d.lineY);

                var transformed = svgpath(d.path)
                    .translate(- d.boxX, -d.boxY)
                    .scale(d.lineX.datum().scale, d.lineY.datum().scale)
                    .translate( d.boxX, d.boxY)
                    .round(3);

                ctx.active.node().firstChild.setAttribute('d', transformed.toString());
                ctx.extent.updateExtent();
            })
            .on("end", function (d) {
                del(d, 'lineX');
                del(d, 'lineY');
                d.path = null;
            });

        function calc(line) {
            var datum = line.datum();
            var x1 = datum.sx;
            var y1 = datum.sy;
            var x2 = datum.ex;
            var y2 = datum.ey;
            var x3 = d3.event.x;
            var y3 = d3.event.y;
            var dx = x2-x1;
            var dy = y2-y1;
            var k = (dy * (x3-x1) - dx * (y3-y1)) / (dy*dy + dx*dx);
            datum.x1 = x3;
            datum.y1 = y3;
            datum.x2 = x3 - k * dy;
            datum.y2 = y3 + k * dx;

            datum.scale = Math.sqrt(Math.pow(datum.x2-x1,2) + Math.pow(datum.y2-y1,2))/Math.sqrt(dx*dx + dy*dy);
            upd(line);
        }

    };

    function del(d, key) {
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
                sx: +vs.attr('cx'),
                sy: +vs.attr('cy'),
                ex: +ve.attr('cx'),
                ey: +ve.attr('cy')
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }
};