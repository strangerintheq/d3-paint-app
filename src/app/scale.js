module.exports = function (ctx, opposite) {
    return function (knob) {
        var op = d3.select('circle.knob,' + opposite);
        return d3.drag()
            .on("start", function (d) {
                console.log('scale start', d)
            })
            .on("drag", function (d) {
                console.log('scale ', d)
            })
            .on("end", function (d) {
                console.log('scale end', d)
            })
    };
};