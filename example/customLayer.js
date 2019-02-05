function scene(overlayTarget, map, svg) {

    var translate = fromLL(30.2, 60);

    var transform = {
        translateX: translate[0],
        translateY: translate[1],
        translateZ: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1/Math.pow(2,16)/512
    };

    // converts from WGS84 Longitude, Latitude into a unit vector anchor at the top left as needed for GL JS custom layers
    function fromLL(lon,lat) {
        // derived from https://gist.github.com/springmeyer/871897
        var extent = 20037508.34;

        var x = lon * extent / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * extent / 180;

        return [(x + extent) / (2 * extent), 1 - ((y + extent) / (2 * extent))];
    }

    var layer = {
        id: 'custom_layer',
        type: 'custom',
        onAdd: function (map, gl) {

            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();


            this.buildingGroup = new THREE.Group();
            this.buildingGroup.scale.set(1, -1, 1);
            this.buildingGroup.name = 'building';
            this.scene.add(this.buildingGroup);

            svg2three(this.buildingGroup, svg);

            this.map = map;

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                opacity: true,
                canvas: map.getCanvas(),
                context: gl
            });

            this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
            var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), transform.rotateX);
            var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), transform.rotateY);
            var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), transform.rotateZ);

            var m = new THREE.Matrix4().fromArray(matrix);
            var l = new THREE.Matrix4().makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
                .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale))
                .multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix.elements = matrix;
            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    };


    map.addLayer(layer);
}
