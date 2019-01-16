module.exports = transformer;

function transformer(ctx) {

    var zoomCallbacks = [];

    ctx.svg.call(createZoom());

    return {
        adjustSize: adjustSize,
        onTransform: onTransform
    };

    function onTransform(onZoomFn) {
        zoomCallbacks.push(onZoomFn);
    }

    function zoomed() {
        ctx.helpers.attr("transform", ctx.transform);
        ctx.canvas.attr("transform", ctx.transform);
        ctx.axes.applyZoom(ctx.transform);
        ctx.active && ctx.extent.updateExtent(ctx);
        zoomCallbacks.forEach(function (zoomCallback) {
            zoomCallback(ctx.transform);
        });
    }

    function adjustSize() {
        var w = ctx.containerElement.node().clientWidth;
        var h = ctx.containerElement.node().clientHeight;
        ctx.svg.attr('width', w).attr('height', h)
            .attr('viewBox', -w/2 + ' ' + -h/2 + ' ' + w + ' ' + h);
        ctx.axes.applySize(w, h);
        zoomed()
    }

    function createZoom() {
        return d3.zoom()
            .filter(function () {
                return true;
            })
            .scaleExtent([0.1, 100])
            .on("zoom", function() {
                ctx.transform = d3.event.transform;
                zoomed();
            });
    }
}

