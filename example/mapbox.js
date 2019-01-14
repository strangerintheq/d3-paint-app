
var lon = 30;
var lat = 31.2;
var zoom = 15;

var map = new mapboxgl.Map({
    container: 'mapbox',
    style: 'style.json',
    // style: 'https://strangerintheq.bitbucket.io/latest/bundle/common/resources/mapbox-style-buildings-heights.json',
    center: [lon, lat],
    zoom: zoom
});

var paint = d3Paint("#paint");

window.addEventListener('resize', paint.adjustSize);

paint.onZoom(function (t) {
    var merc = Math.cos(map.transform._center.lat*Math.PI/180);
    var z = zoom + Math.log2(t.k);
    var s = Math.pow(2, z) * 256 / 180 / merc;
    map.jumpTo({
        center: [
            lon - t.x / s / merc,
            lat + t.y / s
        ],
        zoom: z
    });
});

d3.selectAll('button').each(function () {
    let btn = d3.select(this);
    btn.on('click', function () {
        let id = btn.attr('id');
        paint.setMode(id);
        d3.select('#currentMode').text('currentMode: ' + id)
    })
});