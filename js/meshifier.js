var renderer, camera, settings, panels, geometry, lightGeometry;
var objModel = [];
var objModelCount = 3;
var lastTime = 0, lastAnimation = 0, lastRotation = 0;

init();
animate();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 70;

	controls = new THREE.OrbitControls(camera);

	controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 0.2;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	controls.addEventListener( 'change', render );

    window.addEventListener('resize', onWindowResize, false);

    var Settings = function () {
		this.show4dExplode = document.getElementById("show4dExplode");
		this.is4dExplode = document.getElementById("is4dExplode");
		this.showHyperbolic = document.getElementById("showHyperbolic")
		this.isHyperbolic = document.getElementById("isHyperbolic");

        this.show4dExplode.onclick = panelRefresh;
        this.showHyperbolic.onclick = panelRefresh;
        document.getElementById("saveObj").onclick = saveObj;
    };

    var Panels = function () {
        this.explode = document.getElementById("4dExplodePanel");
        this.hyperbolic = document.getElementById("hyperbolicPanel");
    };

        var prefix = 'resources/obj/4-5.40-';
        var extension = '.stl';

        var loader0 = new THREE.STLLoader();
        loader0.addEventListener('load', function (event) { objModel[0] = basicMeshFromGeometry(loadGeometry(event.content)); });
        loader0.load(prefix + 0 + extension);
    
        var loader1 = new THREE.STLLoader();
        loader1.addEventListener('load', function (event) { objModel[1] = basicMeshFromGeometry(loadGeometry(event.content)); });
        loader1.load(prefix + 1 + extension);
    
        var loader2 = new THREE.STLLoader();
        loader2.addEventListener('load', function (event) { objModel[2] = basicMeshFromGeometry(loadGeometry(event.content)); });
        loader2.load(prefix + 2 + extension);
    
    settings = new Settings();
    panels = new Panels();
	panelRefresh();
}

function loadGeometry(geometry) {
    geometry.computeBoundingBox();
    var box = new THREE.Box3();
    box.union(geometry.boundingBox);  //TBD does this accidentaly cause it to include zero from the first time?
    var center = box.center();
//      var scale = box.size().length() * 0.5;
    var scale = 1;
    var vertices = geometry.vertices;
    for (var i = 0; i < vertices.length; i++) {  
        geometry.vertices[i] = vertices[i].sub(center).multiplyScalar(scale);
    }

    return geometry;
}

function panelRefresh() {
	panels.explode.hidden = !settings.show4dExplode.checked;
	panels.hyperbolic.hidden = !settings.showHyperbolic.checked;
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

var circleToStrip = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);
    z = Complex.atanh(z).scale(4 / Math.PI);  // butulov says 2 * pi, my old notes this.  what up?

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var rotate = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    var rotation = Mobius.createRotation(1/4 * Math.PI);
    z = z.transform(rotation);

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var translate = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    var p = 4;
    var q = 5;
    var sinP2 = Math.pow(Math.sin(Math.PI / p), 2);
    var cosQ2 = Math.pow(Math.cos(Math.PI / q), 2);
    var r = Math.sqrt(sinP2 / (cosQ2 - sinP2));
    var d = Math.sqrt(cosQ2 / (cosQ2 - sinP2));
    distEuclid = (d - r);

    var phi = Math.PI * (0.5 - (1.0 / p + 1.0 / q));
    var polar = Complex.createPolar(r, Math.PI - phi);
    var p1 = Complex.add(new Complex(d, 0), polar);

    var translation = Mobius.createDiscAutomorphism(new Complex(-p1.modulus(), 0), 3/10 * Math.PI);
  //  var translation = Mobius.createDiscAutomorphism(p1, 0);
    z = z.transform(translation);

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var roll = function(vertex) {         
    var n = 4;
    var sign = 1;
    var period = 1.1394350620387064 * 4;
    var radius = n * period / 2 / Math.PI;

    var thickness = 0.25 / 25.4 / 0.13;
    var radiusOffset = 0;
    if (sign == -1) {
        if (vertex.z < -0.02) {
            radiusOffset = thickness;
        } else {
            radiusOffset = -thickness/5;
        }
    }

    if (sign == 1) {
        if (vertex.z < -0.02) {
            radiusOffset = -thickness/5;
        } else {
            radiusOffset = thickness;
        }
    }

    var depth = vertex.z * Math.cos(vertex.y * Math.PI / 2);
    var phi = vertex.x / radius;
    var dist = radius + sign * depth * 2 + radiusOffset;
    vertex.z = dist * Math.cos(phi);
    vertex.x = dist * Math.sin(phi);

 //   vertex.z = vertex.x * 1/Math.tan(Math.asin(vertex.x / radius));
    return vertex;
};

var scale = function(vertex) {         
    vertex.multiplyScalar(0.13);
    return vertex;
};

function linearToHyperbolic(x) {
    x++;  // to scale...
    return Math.log(x + Math.sqrt(x * x - 1)); // arcosh(x)
}

function basicMeshFromGeometry(geometry) {
    return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
}

function mergeAllVertices(object3D) {
    var offset = 0;
    var geometry = new THREE.Geometry();
    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            if (geometry.vertices.length == 0) {
                geometry = child.geometry.clone();
                return;
            }

            THREE.GeometryUtils.merge(geometry, child.geometry);
        }
    });

    geometry.mergeVertices();
    return geometry;
}

function render() {
    var time = new Date().getTime() / 1000;
    lastTime = time;

    for (var i = 0; i < objModelCount; i++) {
        if (objModel[i] === undefined)
            return;
    }

    if (geometry === undefined) {
        var objGeometry = [];
        for (var i = 0; i < objModelCount; i++) {
            objGeometry[i] = mergeAllVertices(objModel[i])
        }

    	if (settings.is4dExplode.checked) {
        	geometry = tool4dExplode.method(geometry, time);
    	} 

    	else if (settings.isHyperbolic.checked) {
            geometry = toolHyperbolic.method(objGeometry, time, function(p) {
                p = rotate(p);
                p = translate(p);
                p = circleToStrip(p);
                return p;
            } );

        //    geometry = toolOffset.method(geometry, 0.001 * 0.13);
            geometry = toolFunction.method(geometry, roll);
            // geometry = toolFunction.method(geometry, scale);
        	// geometry = toolIdentity.method(geometry);
    	}
    }

    material = [
        new THREE.MeshLambertMaterial( { 
            color: 0x222222, 
            side: THREE.DoubleSide,
            shading: THREE.FlatShading, 
            transparent: true,  
            opacity: 0.5
        } ),
        new THREE.MeshBasicMaterial( { 
            color: 0xEEEEEE, 
            shading: THREE.FlatShading, 
            wireframe: true
        } )
    ];

    var scene = new THREE.Scene();
    scene.add(THREE.SceneUtils.createMultiMaterialObject(geometry, material));

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

function saveObj() {
    var op = THREE.saveToObj(basicMeshFromGeometry(geometry));

    var newWindow = window.open("");
    newWindow.document.write(op);

    //console.log(op);
}

THREE.saveToObj = function (object3d) {
    var s = '';
	var offset = 1;

    object3d.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var mesh = child;

			var geometry = mesh.geometry;
			mesh.updateMatrixWorld();

			for (i = 0; i < geometry.vertices.length; i++) {
				var vector = new THREE.Vector3(geometry.vertices[i].x, geometry.vertices[i].y, geometry.vertices[i].z);
				mesh.matrixWorld.multiplyVector3(vector);

				s += 'v ' + (vector.x) + ' ' +
				vector.y + ' ' +
				vector.z + '<br />';
			}

			for (i = 0; i < geometry.faces.length; i++) {
				s += 'f ' +
				    (geometry.faces[i].a + offset) + ' ' +
				    (geometry.faces[i].b + offset) + ' ' +
				    (geometry.faces[i].c + offset)
				;

				if (geometry.faces[i].d !== undefined) {
				    s += ' ' + (geometry.faces[i].d + offset);
				}
				s += '<br />';
			}

			offset += geometry.vertices.length;
		}
	});

    return s;
}
