mapboxgl.accessToken = 'pk.eyJ1IjoidmNuIiwiYSI6ImNra25lODk1ZTJhNGUyd3BkOXo2Zm92d3QifQ.21PBPdqCt0Awz5J-nVinSA';
var r_data;
var map = new mapboxgl.Map({
    container: 'map', // container element id
    style: 'mapbox://styles/vcn/ckl5ucsjo4p3v17tj1nf8psid',
    center: [-97.84962864925768,  37.47404305735127], // initial map center in [lon, lat]
    zoom: 3
});
var scale = new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
});
map.addControl(scale);

scale.setUnit('metric');

var size = 50;

// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

// get rendering context for the map canvas when layer is added to the map
    onAdd: function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
    },

// called once before every frame where the icon will be used
    render: function () {
        var duration = 1000;
        var t = (performance.now() % duration) / duration;

        var radius = (size / 2) * 0.3;
        var outerRadius = (size / 2) * 0.7 * t + radius;
        var context = this.context;

// draw outer circle
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            outerRadius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
        context.fill();

// draw inner circle
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgb(10,231,40)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

// update this image's data with data from the canvas
        this.data = context.getImageData(
            0,
            0,
            this.width,
            this.height
        ).data;

// continuously repaint the map, resulting in the smooth animation of the dot
        map.triggerRepaint();

// return `true` to let the map know that the image was updated
        return true;
    }
};

map.on('load', function () {
    map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

    map.addSource('points', {
        'type': 'vector',
        'tiles': [
            'http://178.128.219.155:7800/public.tbl_data/{z}/{x}/{y}.pbf'
        ],
        'minzoom': 0,
        'maxzoom': 22
    });
    map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'points',
        'source-layer': 'public.tbl_data',
        'layout': {
            'icon-image': 'pulsing-dot'
        }
    });
});

map.on('click', 'points', function (e) {
    var coordinates = e.features[0].geometry.coordinates.slice();
    var properties = e.features[0].properties;

    var prop_html = '<table>';
    prop_html+='<tr><td>Country</td><td>'+properties['country']+'</td></tr>'
    prop_html+='<tr><td>city</td><td>'+properties['city']+'</td></tr>'
    prop_html+='<tr><td>version</td><td>'+properties['version']+'</td></tr>'
    prop_html+='<tr><td>createdat</td><td>'+properties['createdat']+'</td></tr>'
    // for (const property in properties) {
    //     prop_html+=`<tr><td>${property}</td><td>${properties[property]}</td></tr>`
    // }
    prop_html+='</table>'
// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(prop_html)
        .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'points', function () {
    map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', 'points', function () {
    map.getCanvas().style.cursor = '';
});

$(document).ready(function(){
        var poi_data;
        $.ajax({
            url: "http://178.128.219.155:9000/collections/public.tbl_data/items.json",
            success: function(data){
                poi_data = data;
                populate_search(poi_data)
            }});

        function populate_search(pois) {
            $('#title_hotspot').html(pois['numberReturned']);
            pois['features'].forEach(add_hotspot)
            $("li").on('click', function() {
                var x = this.id.split('_')[0];
                var y = this.id.split('_')[1];
                zoommap(x,y);
            });
        }
    // {"address":"188.166.165.99","country":"Germany","country_code":"DE","createdat":"2021-02-20T19:40:05.038Z","id":"60316595a206f4634f0a2504","port":"6888","protocol":"70015","v":"0","version":"VersaCoin:0.17.1","x":8.6843,"y":50.1188}}
        function add_hotspot(hotspot) {
            console.log(hotspot)
            var hotspot = hotspot['properties']
            var id = hotspot['x']+'_'+hotspot['y']
            var temp_html = '                 <li class="hotspotclick" id="'+id+'">' +
                '                                <div class=" hotspot">' +
                '                                    <header class=" hotspot-header">' +
                '                                        <div class=" hotspot-section">' +
                '                                            <div class=" hotspot-location mono">'+hotspot['city']+', '+hotspot['country']+', '+hotspot['country_code']+
                '                                            </div>' +
                '                                        </div>' +
                '                                        <div class=" hotspot-section">' +
                '                                            <div class="hotspot-name">'+hotspot['address']+'</div>' +
                '                                        </div>' +
                '                                        <div class=" hotspot-section">' +
                '                                            <div class=" hotspot-owner mono"> id: ' + hotspot['id'] +' | created : '+hotspot['createdat']
            '                                            </div>' +
                '                                        </div>' +
                '                                    </header>' +
                '                                </div>' +
                '                            </div>';
            $('#hotspot_list').append(temp_html);
        };



});

function myFunction() {
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    ul = document.getElementById("hotspot_list");
    li = ul.getElementsByTagName("li");
    var t_records = li.length;
    var records = li.length;
    $('#title_hotspot').html(records);

    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByClassName("hotspot-location")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";

        } else {
            li[i].style.display = "none";
            records--;
            $('#title_hotspot').html(records);
        }
    }
}

function zoommap(x,y) {

    map.flyTo({
        center: [
            x,
            y
        ],
        essential: true,
        zoom: 15 // this animation is considered essential with respect to prefers-reduced-motion
    });
}
