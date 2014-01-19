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
    var geometry = mergeAllVertices(object3D);
    disc = new Disc(new Region(4, 5), 0.975, 144, geometry, basicMaterial);
    return disc.model;
});

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

var toolOffset = new MeshTool("Function", function (object3D, thickness) {
    var newModel = new THREE.Object3D();
    var consolidated = mergeAllVertices(object3D);

    var geometry = new THREE.Geometry();
    consolidated.computeFaceNormals();
    consolidated.computeVertexNormals();
    var vertices = consolidated.vertices;
    var normals = [vertices.length];

    for ( f = 0, fl = consolidated.faces.length; f < fl; f ++ ) {
        face = consolidated.faces[ f ];

        if ( face instanceof THREE.Face3 ) {
            normals[face.a] = face.vertexNormals[ 0 ];
            normals[face.b] = face.vertexNormals[ 1 ];
            normals[face.c] = face.vertexNormals[ 2 ];
        } else if ( face instanceof THREE.Face4 ) {
            normals[face.a] = face.vertexNormals[ 0 ];
            normals[face.b] = face.vertexNormals[ 1 ];
            normals[face.c] = face.vertexNormals[ 2 ];
            normals[face.d] = face.vertexNormals[ 3 ];
        }
    }

    for (var i = 0, il = vertices.length; i < il; i++) {
        var vertex = vertices[i].clone();
        var widthRatio = Math.abs(vertex.y);

      //  if (normals[i].z < 0)
       //     normals[i] = normals[i].multiplyScalar(-1);

    //   var azimuth = Math.atan2(normals[i].z, Math.sqrt(normals[i].x * normals[i].x + normals[i].y * normals[i].y));
        // if (vertex.z > 0.04) {
        //     normals[i].x = 0;
        //     normals[i].y = 0;
        //     normals[i].z = 2/3;
        // }

        // if (vertex.z < -0.04) {
        //     normals[i].z = 0;
        // }

        // var stretch = 1 - vertex.z / 0.08 + 0.08
        // stretch *= Math.sqrt(widthRatio) * 1/3;
        // normals[i].x *= stretch;
        // normals[i].y *= stretch;

        var scale = 1;
        
        vertex.add(normals[i].multiplyScalar(thickness * scale))
        geometry.vertices.push(vertex);
    }

    var faces = consolidated.faces;
    for (var i = 0, il = faces.length; i < il; i++) {
        geometry.faces.push(faces[i]);
    }

    newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, basicMaterial));

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
                geometry.vertices.push(vertex);
            }

            var faces = child.geometry.faces;
            for (var i = 0, il = faces.length; i < il; i++) {
                geometry.faces.push(faces[i]);
            }

            newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, this.materials));
        }
    });

    return newModel;
});

