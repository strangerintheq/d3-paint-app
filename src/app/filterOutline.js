module.exports = filter_Outline;


function filter_Outline(defs, id) {
    // https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
    var filter = defs.append('filter')
        .attr('id', id);

    filter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '1')
        //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
        .attr('color-interpolation-filters', 'sRGB')
        .attr('result', 'blur');

    // filter.append('feColorMatrix')
    //     .attr('in', 'blur')
    //     .attr('mode', 'matrix')
    //     .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9')
}