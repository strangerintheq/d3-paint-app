
var lon = 30.2;
var lat = 60;
var zoom = 16;

var map = new mapboxgl.Map({
    container: 'mapbox',
    style: 'style.json',
    // style: 'https://strangerintheq.bitbucket.io/latest/bundle/common/resources/mapbox-style-buildings-heights.json',
    center: [lon, lat],
    zoom: zoom
});

var paint = d3Paint("#paint");

window.addEventListener('resize', paint.fire.bind(paint, 'resize'));

paint.on('transform', function (transform) {
    var merc = Math.cos(map.transform._center.lat*Math.PI/180);
    var z = zoom + Math.log2(transform.k);
    var s = Math.pow(2, z) * 256 / 180 / merc;
    map.jumpTo({
        center: [
            lon - transform.x / s / merc,
            lat + transform.y / s
        ],
        zoom: z
    });
});

paint.on('mode', function (mode) {
    var btn = d3.selectAll('#mode button');
    btn.style('color', function () {
        d3.select('#currentMode').text('currentMode: ' + mode);
        return d3.select(this).attr('id') === mode ? 'red' : 'black';
    })
});

['undo','redo','delete', 'edit'].forEach(function (type) {
    paint.on('can-' + type, function (can) {
        var node = d3.select('button#' + type).node();
        can ? node.removeAttribute('disabled'): node.setAttribute('disabled', '')
    });
});

d3.selectAll('#mode button').each(function () {
    let btn = d3.select(this);
    btn.attr('id', btn.html());
    btn.on('click', function () {
        paint.fire('mode', btn.attr('id'));
    })
});

buttons('#mode','mode');
buttons('#actions');

function buttons(selector, event) {
    d3.selectAll(selector + ' button').each(function () {
        let btn = d3.select(this);
        btn.attr('id', btn.html());
        btn.on('click', function () {
            if (event)
                paint.fire(event, btn.attr('id'));
            else
                paint.fire(btn.attr('id'));
        })
    });
}

d3.select('button#_3d').on('click', function () {

    Potrace.loadImageFromUrl('data:image/svg+xml;base64,' + btoa(paint.getImage()));
    Potrace.process(function(){
        var d = Potrace.getSVG(1);
        d3.select('body').html(d)
    });


    d3.select('#paint').remove();
});
