// app/svg.js

var ctx;
var pt1;
var pt2;
module.exports = {

    createPointCalc: function(node, pad) {

        if (!pt1) {
            pt1 = ctx.svg.node().createSVGPoint();
            pt2 = ctx.svg.node().createSVGPoint();
        }

        var bbox = node.node().getBBox();
        var matrix = node.node().getScreenCTM();
        var hw = bbox.width / 2;
        var hh = bbox.height / 2;

        reset();

        var calc = {
            reset : reset,
            shift: shift,
            calc: function () {
                return {
                    pad: pt1.matrixTransform(matrix),
                    orig: pt2.matrixTransform(matrix)
                }
            }
        };

        return calc;

        function shift(x, y, absolute) {
            pt1.x += offset(x, hw + pad, absolute);
            pt1.y += offset(y, hh+ pad, absolute);
            pt2.x += offset(x, hw, absolute);
            pt2.y += offset(y, hh, absolute);
            return calc;
        }

        function offset(a, b, k) {
            return k ? a/k : a*b;
        }

        function reset() {
            pt1.x = bbox.x - pad;
            pt1.y = bbox.y - pad;
            pt2.x = bbox.x;
            pt2.y = bbox.y;
            return calc;
        }
    },

    setContext: function(c) {
        ctx = c
    },

    getTransform: function (d) {
        var r = ctx.active.node().getBBox();
        var dx = d.x - (d.dx || 0);
        var dy = d.y - (d.dy || 0);
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return 'rotate(' + d.r + ',' + (x + dx) + ',' + (y + dy) + ')'
            +  'translate(' + dx + ',' + dy + ')'
    },

    screenOffsetX: function () {
        var n = ctx.containerElement.node();
        return n.clientWidth / 2 + n.offsetLeft;
    },

    screenOffsetY: function () {
        var n = ctx.containerElement.node();
        return n.clientHeight / 2 + n.offsetTop;
    },

    g: function (className) {
        return ctx.svg.append('g').classed(className, true);
    },

    fill: function (el, col, t) {
        el.transition()
            .duration(t||0)
            .style('fill', col ? 'rgba(0, 40, 255, 0.7)' : 'transparent')
    },

    circlePath: function (x, y, r, a) {
        var res = "";
        a = a || 45;
        for (var i = 0; i < 360/a; i++) {
            var s = polarToCartesian(x, y, r, a * i);
            var e = polarToCartesian(x, y, r, a * i + a);
            if (!res)
                res += ["M", s.x, s.y].join(" ");
            res += [" A", r, r, 0, 0, 1, e.x, e.y].join(" ");
        }
        return res + 'Z';
    }
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}
