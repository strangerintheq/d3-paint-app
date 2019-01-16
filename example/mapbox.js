
var lon = 30.2;
var lat = 59.89;
var zoom = 15;

var map = new mapboxgl.Map({
    container: 'mapbox',
    style: 'style.json',
    // style: 'https://strangerintheq.bitbucket.io/latest/bundle/common/resources/mapbox-style-buildings-heights.json',
    center: [lon, lat],
    zoom: zoom
});

var paint = d3Paint("#paint");

window.addEventListener('resize',
    paint.fire.bind(paint, 'resize'));

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
    d3.selectAll('button').style('color', function () {
        d3.select('#currentMode').text('currentMode: ' + mode)
        return d3.select(this).attr('id') === mode ? 'red' : 'black';
    })
});

d3.selectAll('button').each(function () {
    let btn = d3.select(this);
    btn.attr('id', btn.html());
    btn.on('click', function () {
        paint.fire('mode', btn.attr('id'));
    })
});

