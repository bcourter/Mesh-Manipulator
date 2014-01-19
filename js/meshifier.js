var renderer, camera, settings, panels, materials, model, objModel, lightGeometry;
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

	materials = [
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
          //      var scale = box.size().length() * 0.5;
                var scale = 1;

                var vertices = mesh.geometry.vertices;
                for (var i = 0; i < vertices.length; i++) {  
                    mesh.geometry.vertices[i] = vertices[i].sub(center).multiplyScalar(scale);
                }
            };
        });
    });

   // loader.load("resources/obj/kleinquartic.4.obj");
    loader.load("resources/obj/4-5.30-1.obj");

    settings = new Settings();
    panels = new Panels();
	panelRefresh();
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
    vertex.z *= Math.cos(vertex.y * Math.PI / 2) 
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
    var phi = vertex.x / radius;
    var dist = radius + sign * vertex.z * 2;
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

function render() {
    var time = new Date().getTime() / 1000;
    lastTime = time;

    if (objModel === undefined)
        return;

    if (model === undefined) {
        model = objModel;

    	if (settings.is4dExplode.checked) {
        	model = tool4dExplode.method(model, time);
    	} 

    	else if (settings.isHyperbolic.checked) {
            model = toolHyperbolic.method(model, time);
             model = toolFunction.method(model, rotate);
             model = toolFunction.method(model, translate);
             model = toolFunction.method(model, circleToStrip);

             model = toolOffset.method(model, 0.001 / 0.13);
           //  model = toolFunction.method(model, roll);
            // model = toolFunction.method(model, scale);
        	 model = toolIdentity.method(model);
    	}
    }

    var scene = new THREE.Scene();
    scene.add(model.clone());

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

function geometriesFromObj(objModel) {
    var newModel = new THREE.Object3D();

    objModel.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = new THREE.Geometry();

            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) 
                geometry.vertices.push(vertices[i].clone());

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) 
                geometry.faces.push(faces[i]);

            newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, materials));
        }
    });

    return [ newModel ];
}

function saveObj() {
    var op = THREE.saveToObj(model);

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
