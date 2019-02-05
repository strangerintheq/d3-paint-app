function scene(overlayTarget, map, svg) {

    overlayTarget = document.querySelector(overlayTarget);

    var w = overlayTarget.clientWidth;
    var h = overlayTarget.clientHeight;

    var app = {
        map: map
    };

    var renderer = createRenderer(w, h);

    app.world = new THREE.Group();
    app.world.name = 'world';
    app.world.matrixAutoUpdate = false;

    app.buildingGroup = new THREE.Group();
    app.buildingGroup.name = 'building';
    app.world.add(app.buildingGroup);

    var scene = new THREE.Scene();
    scene.add(app.world);

    app.camera = new THREE.PerspectiveCamera(28, w / h, 1e-2, 5e8);
    app.camera.matrixAutoUpdate = false;

    app.render = function () {
        renderer.render(scene, app.camera);
    };

    map.on('move', function () {
        syncSceneWithMap(app);
    });

    svg2three(app.buildingGroup, svg);

    var z = 1 / Math.pow(2, 16);
    var rot = 0;

    app.buildingGroup.scale.set(z, z, z);
    app.buildingGroup.rotation.set(0, -rot / 180 * Math.PI, 0);
    app.buildingGroup.position.copy(applyMercatorProjection([30.2, 60]));
    syncSceneWithMap(app);
}

function applyMercatorProjection(coords) {
    var MERCATOR_A = 6378137.0;
    var PROJECTION_WORLD_SIZE = 512 / (2 * (MERCATOR_A * Math.PI));
    var PI_180 = Math.PI / 180;
    var projected = [
        -MERCATOR_A * coords[0] * PI_180 * PROJECTION_WORLD_SIZE,
        -MERCATOR_A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * coords[1] * PI_180))) * PROJECTION_WORLD_SIZE
    ];
    return new THREE.Vector3(projected[0], projected[1], 0.0);
}

function createRenderer(w, h) {
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(w, h);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    return renderer;
}

function syncSceneWithMap(app) {

    var map = app.map;
    var fov = 0.6435011087932844;

    try {
        applySyncParams();
    } catch (e) {
        console.error(e);
    }

    app.render();

    function calcProjectionMatrix(cameraToCenterDistance) {

        var halfFov = fov / 2;
        var groundAngle = Math.PI / 2 + map.transform._pitch;
        var topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);
        // Calculate z distance of the farthest fragment that should be rendered.
        var furthestDistance = Math.cos(Math.PI / 2 - map.transform._pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        var farZ = furthestDistance * 1.01;
        return makePerspectiveMatrix(fov, map.transform.width / map.transform.height, 1, farZ);
    }

    function applySyncParams() {

        var cameraToCenterDistance = 0.5 / Math.tan(fov / 2) * map.transform.height;
        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        app.camera.projectionMatrix = calcProjectionMatrix(cameraToCenterDistance);

        var cameraWorldMatrix = new THREE.Matrix4();

        var cameraTranslateZ = new THREE.Matrix4()
            .makeTranslation(0, 0, cameraToCenterDistance);

        var cameraRotateX = new THREE.Matrix4()
            .makeRotationX(map.transform._pitch);

        var cameraRotateZ = new THREE.Matrix4()
            .makeRotationZ(map.transform.angle);

        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(cameraRotateX)
            .premultiply(cameraRotateZ);

        app.camera.matrixWorld.copy(cameraWorldMatrix);

        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        var scale = new THREE.Matrix4();
        var translateCenter = new THREE.Matrix4();
        var translateMap = new THREE.Matrix4();
        var rotateMap = new THREE.Matrix4();

        var zoomPow = map.transform.scale;
        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateCenter.makeTranslation(512 / 2, -512 / 2, 0);
        translateMap.makeTranslation(-map.transform.x, map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        app.world.matrix = new THREE.Matrix4();
        app.world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
    }

    function makePerspectiveMatrix(fovy, aspect, near, far) {
        var out = new THREE.Matrix4();
        var f = 1.0 / Math.tan(fovy / 2);
        var nf = 1 / (near - far);
        out.elements[0] = f / aspect;
        out.elements[5] = f;
        out.elements[10] = (far + near) * nf;
        out.elements[11] = -1;
        out.elements[14] = (2 * far * near) * nf;
        out.elements[15] = 0;
        return out;
    }
}
