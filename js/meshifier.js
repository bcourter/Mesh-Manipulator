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

    var cookie = getCookie("view");
    if (cookie !== undefined && false) {
        var viewdata = cookie.split(',');

        camera.position.x = viewdata[0];
        camera.position.y = viewdata[1];
        camera.position.z = viewdata[2];

        camera.rotation.x = viewdata[3];
        camera.rotation.y = viewdata[4];
        camera.rotation.z = viewdata[5];
    }

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

      //  var prefix = 'resources/obj/4-5.37-';
      //  var prefix = 'resources/obj/4-5.40-';
        var prefix = 'resources/obj/4-5.39-';
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

var circleToSphere = function(vertex) {
    var radiusSquared = vertex.x * vertex.x + vertex.y * vertex.y;
   // var radius = Math.sqrt(radiusSquared);       
    var p = new THREE.Vector3(
        2 * vertex.x / (1 + radiusSquared),
        2 * vertex.y / (1 + radiusSquared),
        (-1 + radiusSquared) / (1 + radiusSquared)
    );

  //  var pradius = Math.sqrt(p.x * p.x + p.y * p.y);
  //  var theta = Math.acos(pradius);
  //  var normal = new THREE.Vector3(p.x, p.y, pradius*Math.sin(theta));

    return p.add(p.clone().multiplyScalar(-vertex.z * (1-radiusSquared)));
};

var circleToStrip = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);
    z = Complex.atanh(z).scale(4 / Math.PI);  // butulov says 2 * pi, my old notes this.  what up?  Doesn't seem to matter yet...

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

// http://bulatov.org/math/1001/
// w=(12)(-alog(1-az)-log(1-z))
var circleToHeartStrip = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);
    var a = Complex.createPolar(1, Math.PI / 8);
    // z = Complex.add(
    //         Complex.multiply(
    //             a,
    //             Complex.atanh(
    //                 Complex.multiply(a,z)
    //             )
    //         ),
    //         Complex.atanh(z)
    //     );

    //z = Complex.add(z, Complex.i);

    var cutoff = 0.99996
    z = Complex.subtract(
        Complex.multiply(a, Complex.log(Complex.add(Complex.one, Complex.multiply(a.conjugate().scale(cutoff), z)))),  
        Complex.multiply(a.conjugate(), Complex.log(Complex.subtract(Complex.one, Complex.multiply(a.scale(cutoff), z))))
        ).scale(0.5);

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

// http://bulatov.org/math/1003/index_ring.html
// w=exp(za)
var stripToAnnulus = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    var a =  Math.PI / 2.2788701240774127 / 2
    z = Complex.exp(z.scale(a));

    vertex.x = z.re;
    vertex.y = z.im;
 //   vertex.z = vertex.z + Complex.exp(z.scale(a * 2)).re;
    return vertex;
};

var stripToAnnulusZ = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    var a =  Math.PI / 2.2788701240774127 / 2.5;
    z = Complex.exp(z.scale(a));

    vertex.x = z.re;
    vertex.y = z.im;
    var s = Math.cos(z.argument() * 2.5 ) * 0.2;
    vertex.z += s * z.modulus() * 2.5/2;
//    vertex.z += );
   // vertex.z += (Math.atan2(z.im, z.re));
 //   vertex.z = vertex.z + Complex.exp(z.scale(a * 2)).re;
    return vertex;
};



var rotate = function(vertex, angle) {             
    var z = new Complex(vertex.x, vertex.y);

    var rotation = Mobius.createRotation(angle);
    z = z.transform(rotation);

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var squarify = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    z = Complex.sqrt(Complex.divide(
            Complex.multiply(
                Complex.i,
                Complex.subtract(Complex.one, z)
            ),
            Complex.add(z, Complex.one)
        ));

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};



var halfplane = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    z = Complex.divide(
            Complex.multiply(
                Complex.i,
                Complex.subtract(Complex.one, z)
            ),
            Complex.add(z, Complex.one)
        );

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var halfstrip = function(vertex) {             
    var z = new Complex(vertex.x, vertex.y);

    z = Complex.acosh(z);

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var translate = function(vertex, point, angle) {             
    var z = new Complex(vertex.x, vertex.y);
    var a = new Complex(point.x, point.y);

    var translation = Mobius.createDiscAutomorphism(a, angle);
    z = z.transform(translation).conjugate();

    vertex.x = z.re;
    vertex.y = z.im;
    return vertex;
};

var offset = 0.25 / 25.4 / 0.13;
var offsetZOnly = 0.5;
var roll = function(vertex, n) {         
    var sign = vertex.z > 0 ? 1 : -1;
    if (vertex.z * sign < 0.01)
        sign = 0;

    var period = 1.1394350620387064 * 4;
    var radius = n * period / 2 / Math.PI;

    var thickness = offset * offsetZOnly ;  //tiara

    var phi = vertex.x / radius;
    var dist = radius + offset/3*0 + vertex.z / 2;
    vertex.z = dist * Math.cos(phi);
    vertex.x = dist * Math.sin(phi);

 //   vertex.z = vertex.x * 1/Math.tan(Math.asin(vertex.x / radius));
    return vertex;
};


var rollRing = function(vertex, n, sign, scale) {         
    var period = 1.1394350620387064 * 4;
    var radius = n * period / 2 / Math.PI;

    var thickness = offset * offsetZOnly * 2.5; // ring
 //   var thickness = offset * offsetZOnly ;  //tiara

    var bottomScale = 0.2;
    var radiusOffset = 0;
    if (sign == -1) {
        if (vertex.z < -0.02) {
            radiusOffset = thickness;
        } else {
            radiusOffset = 0;
        }
    }

    if (sign == 1) {
        if (vertex.z < -0.02) {
            radiusOffset = -thickness;
        } else {
            radiusOffset = bottomScale * thickness;
        }

        radiusOffset += thickness;
    }

    var depth = vertex.z * Math.cos(vertex.y * Math.PI / 2) * scale;
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

var frame = 0;
function render() {
    frame++;
    var time = new Date().getTime() / 1000;
    lastTime = time;

    for (var i = 0; i < objModelCount; i++) {
        if (objModel[i] === undefined)
            return;
    }

    var thickness = offset / 4 * (1 - offsetZOnly); //  / 2 * (1 + Math.sin(time));
    if (geometry === undefined) {
        var objGeometry = [];
        for (var i = 0; i < objModelCount; i++) {
            objGeometry[i] = mergeAllVertices(objModel[i])
        }

    	if (settings.is4dExplode.checked) {
        	geometry = tool4dExplode.method(geometry, time);
    	} 

    	else if (settings.isHyperbolic.checked) {
            var p = 4;
            var q = 5;
            var sinP2 = Math.pow(Math.sin(Math.PI / p), 2);
            var cosQ2 = Math.pow(Math.cos(Math.PI / q), 2);
            var r = Math.sqrt(sinP2 / (cosQ2 - sinP2));
            var d = Math.sqrt(cosQ2 / (cosQ2 - sinP2));
            distEuclid = d - r;

            var phi = Math.PI * (0.5 - (1.0 / p + 1.0 / q));
            var polar = Complex.createPolar(r, Math.PI - phi);
            var p1 = Complex.add(new Complex(d, 0), polar);

            geometry = toolHyperbolic.method(objGeometry, time, function(p) {
                p = rotate(p, 1/4 * Math.PI);
                p = translate(p, new THREE.Vector3(-p1.modulus(), 0, 0), 3/10 * Math.PI);


// lamp                p = circleToSphere(p);
           p = halfplane(p);
           p = halfstrip(p);

         //   console.log(p.x + "," + p.y + "," + p.z)

           //     p = circleToStrip(p);
           //     p = rollRing(p, 6, -1, 1.5);

           //     Annulus
           //    p = circleToStrip(p);
           //    p = rotate(p, 1/2 * Math.PI);
           //    p = stripToAnnulus(p);
            //   p = stripToAnnulusZ(p);

            // Tiara
            //    p = translate(p, new THREE.Vector3(0, -0.1, 0), Math.PI);
            //    p = p.add(new THREE.Vector3(0, 0.1, 0));
            //    p = circleToHeartStrip(p);
                return p;
            } );

     //        geometry = toolOffset.method(geometry, -0.007);
    //        geometry = toolFilterFaceCenters.method(geometry, function(v) { return Math.atan2(v.y, v.x) >= Math.PI -Math.PI/5 - 2*Math.PI/5 });
        //    geometry = toolFilterFaceCenters.method(geometry, function(v) { return (v.y <= 0) && (v.x <= 0) } );
   //         geometry = toolFilterFaceCenters.method(geometry, function(v) { return (v.x > 0) && (v.y > 0.01) } );
// LAMP            geometry = toolFilterFaceCenters.method(geometry, function(v) { return v.y > 0 && v.x > 0; } );
// LAMP            geometry = toolScaleSweep.method(geometry, 1-1/18);

            // ring
            // geometry = toolOffset.method(geometry, thickness * 0.9);
            // geometry = toolOffset.method(geometry, thickness * 0.9);

            // var period = 1.1394350620387064 * 4;
            // var radius = 5 * period / 2 / Math.PI;  // don't change - this is the reference
            // geometry = toolFunction.method(geometry, function(p) { return p.multiplyScalar(1 / radius / 1.05); });  // import as cm

            // Tiara
            // geometry = toolFunction.method(geometry, roll);
            // geometry = toolOffset.method(geometry, -thickness/2);
            
          //   geometry = toolOffset.method(geometry, -thickness);

            //geometry = toolFunction.method(geometry, scale);
        	// geometry = toolIdentity.method(geometry);
    	}
    }

    var animGeometry = geometry;

 
    material = [
        new THREE.MeshPhongMaterial( { 
            color: 0x000000, 
            side: THREE.DoubleSide,
            shading: THREE.FlatShading, 
            specular: 0x999999,
            emissive: 0x000000,
            shininess: 10 
        } ),
        // new THREE.MeshLambertMaterial( { 
        //     color: 0x222222, 
        //     side: THREE.DoubleSide,
        //     shading: THREE.FlatShading, 
        //     transparent: true,  
        //     opacity: 0.5
        // } ),
        new THREE.MeshBasicMaterial( { 
            color: 0xEEEEEE, 
            shading: THREE.FlatShading, 
            wireframe: true,
            wireframeLinewidth: 2
        } )
    ];

    var scene = new THREE.Scene();
    scene.add(THREE.SceneUtils.createMultiMaterialObject(animGeometry, material));

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);

    renderer.render(scene, camera);

    if (frame % 100 == 0) {
        var viewdata = [6];

        viewdata[0] = camera.position.x;
        viewdata[1] = camera.position.y;
        viewdata[2] = camera.position.z;

        viewdata[3] = camera.rotation.x;
        viewdata[4] = camera.rotation.y;
        viewdata[5] = camera.rotation.z;

        setCookie("view", viewdata.join()); 
    }
}

function saveObj() {
    var op = THREE.saveToObj(basicMeshFromGeometry(geometry));

    // var newWindow = window.open("");
    // newWindow.document.write(op);

    saveData(op, "meshifier.obj");

    //console.log(op);
}

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var blob = new Blob([data], {type: "text/object3d"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

THREE.saveToObj = function (object3d) {
    var s = '';
	var offset = 1;
   // var cr = '<br />';
    var cr = '\n';

    object3d.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var mesh = child;

			var geometry = mesh.geometry;
			mesh.updateMatrixWorld();

			for (i = 0; i < geometry.vertices.length; i++) {
				var vector = new THREE.Vector3(geometry.vertices[i].x, geometry.vertices[i].y, geometry.vertices[i].z);
				vector.applyMatrix4(mesh.matrixWorld);

				s += 'v ' + (vector.x) + ' ' +
				vector.y + ' ' +
				vector.z + cr;
			}

			for (i = 0; i < geometry.faces.length; i++) {
				s += 'f ' +
				    (geometry.faces[i].a + offset) + ' ' +
				    (geometry.faces[i].b + offset) + ' ' +
				    (geometry.faces[i].c + offset);

				if (geometry.faces[i].d !== undefined) {
				    s += ' ' + (geometry.faces[i].d + offset);
				}

				s += cr;
			}

			offset += geometry.vertices.length;
		}
	});

    return s;
}

    // from http://stackoverflow.com/questions/4825683/how-do-i-create-and-read-a-value-from-cookie
function setCookie(c_name,value,exdays) {
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + 
    ((exdays==null) ? "" : ("; expires="+exdate.toUTCString()));
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++) {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name) {
            return unescape(y);
        }
    }
}