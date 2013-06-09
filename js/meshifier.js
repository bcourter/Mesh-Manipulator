var renderer, camera, settings, panels, materials, objModel, newModel, lightGeometry;
var lastTime = 0, lastAnimation = 0, lastRotation = 0;

init();
animate();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 70;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);

    window.addEventListener('resize', onWindowResize, false);

    var Settings = function () {
        document.getElementById("4dExplode").onclick = show4dExplode;
        document.getElementById("saveObj").onclick = saveObj;
    };

    var Panels = function () {
        this.explode = document.getElementById("4dExplodePanel");
    };

    var loader = new THREE.OBJLoader();
    loader.addEventListener('load', function (event) {
        objModel = event.content;

        var box = new THREE.Box3();
        objModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.geometry.computeBoundingBox();
                box.union(child.geometry.boundingBox);  //TBD does this accidentaly cause it to include zero from the first time?
            }
        });

        objModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                var mesh = child;
                var center = box.center();
                var scale = box.size().length() * 0.5;

                var vertices = mesh.geometry.vertices;
                for (var i = 0; i < vertices.length; i++) {  
                    mesh.geometry.vertices[i] = vertices[i].sub(center).multiplyScalar(scale);
                }
            };
        });
    });

    loader.load("resources/obj/jig.obj");

    settings = new Settings();
    panels = new Panels();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate, renderer.domElement);

    render();
    controls.update();
    //stats.update();
}

function render() {
    var time = new Date().getTime() / 1000;
    lastTime = time;

    if (objModel === undefined)
        return;

    var scene = new THREE.Scene();

    var newModel = tool4DExplode.method(objModel, time);
    scene.add(newModel);

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(-1, -1, -1).normalize();
    scene.add(directionalLight);

    renderer.render(scene, camera);
}

function show4dExplode() {
    panels.explode.style.visibility = false;
}

function saveObj() {
    var mesh = jigMesh;
    var op = THREE.saveGeometryToObj(mesh);

    var newWindow = window.open("");
    newWindow.document.write(op);
}

THREE.saveGeometryToObj = function (geo) {
    var nums = geo.length;
    geo.updateMatrixWorld();
    var s = '';

    for (i = 0; i < geo.geometry.vertices.length; i++) {
        var vector = new THREE.Vector3(geo.geometry.vertices[i].x, geo.geometry.vertices[i].y, geo.geometry.vertices[i].z);
        geo.matrixWorld.multiplyVector3(vector);

        s += 'v ' + (vector.x) + ' ' +
        vector.y + ' ' +
        vector.z + '<br />';
    }

    for (i = 0; i < geo.geometry.faces.length; i++) {
        s += 'f ' +
            (geo.geometry.faces[i].a + 1) + ' ' +
            (geo.geometry.faces[i].b + 1) + ' ' +
            (geo.geometry.faces[i].c + 1)
        ;

        if (geo.geometry.faces[i].d !== undefined) {
            s += ' ' + (geo.geometry.faces[i].d + 1);
        }
        s += '<br />';
    }

    return s;
}