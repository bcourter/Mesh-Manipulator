var MeshTool = function (name, method) {
    this.name = name;
    this.method = method;

	this.materials = [
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
};

basicMaterial = [
    new THREE.MeshLambertMaterial( { 
        color: 0x222222, 
        side: THREE.DoubleSide,
        shading: THREE.FlatShading, 
        transparent: true,  
        opacity: 0.5
    } )];

var tool4dExplode = new MeshTool("4d Explode", function (geometries, time) {
    var newModel = new THREE.Object3D();

    var translate = new FOUR.Matrix5().makeTranslation(0, 0, 0, 0);
    var trans = new FOUR.Matrix5().makeRotationWX(time * 0.03);
    var trans2 = new FOUR.Matrix5().makeRotationWY(time * 0.2);
    var trans3 = new FOUR.Matrix5().makeRotationZW(time * 0.02);
    trans = trans2.multiply(trans).multiply(translate);

    objModel.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = new THREE.Geometry();

            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) {
                var sumSq = (1 + vertices[i].lengthSq())
                var vertex = vertices[i].clone();
                vertex = vertex.multiplyScalar(2 / sumSq);
                var vertex4 = new THREE.Vector4(vertex.x, vertex.y, vertex.z, (sumSq - 2) / sumSq);  // reverse stereographic

                vertex4.applyMatrix5(trans);

                var newVertex = new THREE.Vector3(vertex4.x, vertex4.y, vertex4.z);
                newVertex = newVertex.divideScalar(vertex4.w);  // stereographic
                newVertex = newVertex.divideScalar(vertex.lengthSq());  // inversion
                geometry.vertices.push(newVertex);
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                var a = faces[i].a;
                var b = faces[i].b;
                var c = faces[i].c;
                var d = faces[i].d;

                var maxLength = 20;
                if (geometry.vertices[a].distanceTo(geometry.vertices[b]) > maxLength ||
                    geometry.vertices[b].distanceTo(geometry.vertices[c]) > maxLength ||
                    geometry.vertices[a].distanceTo(geometry.vertices[c]) > maxLength ||
                    (d && geometry.vertices[b].distanceTo(geometry.vertices[d]) > maxLength)
                ) {
                    continue;
                }

                var face;
                if (d === undefined)
                    face = new THREE.Face3(a, b, c, null, faces[i].color, faces[i].materialIndex);
                else
                    face = new THREE.Face4(a, b, c, d, null, faces[i].color, faces[i].materialIndex);

                geometry.faces.push(face);
            }

			newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, basicMaterial));
		}
	});

    return newModel;
});

var toolHyperbolic = new MeshTool("Hyperbolic", function (object3D, time) {
    disc = new Disc(new Region(4, 5), 0.99, 144, colsolidateGeometry(object3D), basicMaterial);
    return disc.model;
});

function colsolidateGeometry(object3D) {
    var offset = 0;
    var geometry = new THREE.Geometry();
    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) {
                 var vertex = vertices[i].clone();
                geometry.vertices.push(vertex);
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                var a = faces[i].a;
                var b = faces[i].b;
                var c = faces[i].c;
                var d = faces[i].d;

                var face;
                if (d === undefined)
                    face = new THREE.Face3(a + offset, b + offset, c + offset, null, faces[i].color, faces[i].materialIndex);
                else
                    face = new THREE.Face4(a + offset, b + offset, c + offset, d + offset, null, faces[i].color, faces[i].materialIndex);

                geometry.faces.push(face);
            }

            offset += child.geometry.vertices.length;
        }
    });

return geometry;
}

var toolStrip = new MeshTool("Strip", function (object3D, time) {
    var newModel = new THREE.Object3D();

    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = new THREE.Geometry();
            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) {
                var vertex = vertices[i].clone();
                
                var z = new Complex(vertex.x, vertex.y);
                z = Complex.atanh(z).multiplyScalar(4 / Math.PI);

                vertex.x = z.re;
                vertex.y = z.im;
                geometry.vertices.push(vertex);
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                geometry.faces.push(faces[i]);
            }

            newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, basicMaterial));
        }
    });

    return newModel;
});

var toolFunction = new MeshTool("Function", function (object3D, fn) {
    var newModel = new THREE.Object3D();

    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = new THREE.Geometry();
            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) {
                var vertex = vertices[i].clone();
                geometry.vertices.push(fn(vertex));
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                geometry.faces.push(faces[i]);
            }

            newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, basicMaterial));
        }
    });

    return newModel;
});

var toolIdentity = new MeshTool("Identity", function (object3D, time) {
    var newModel = new THREE.Object3D();

    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = new THREE.Geometry();
            var vertices = child.geometry.vertices;
            for (var i = 0, il = vertices.length; i < il; i++) {
                var vertex = vertices[i].clone();
                vertex.x = vertex.x;
                geometry.vertices.push(vertex);
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                geometry.faces.push(faces[i]);
            }

            newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, basicMaterial));
        }
    });

    return newModel;
});

