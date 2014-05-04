var MeshTool = function (name, method) {
    this.name = name;
    this.method = method;
};

var tool4dExplode = new MeshTool("4d Explode", function (geometryIn, time) {
    var geometry = new THREE.Geometry();
    var translate = new FOUR.Matrix5().makeTranslation(0, 0, 0, 0);
    var trans = new FOUR.Matrix5().makeRotationWX(time * 0.03);
    var trans2 = new FOUR.Matrix5().makeRotationWY(time * 0.2);
    var trans3 = new FOUR.Matrix5().makeRotationZW(time * 0.02);
    trans = trans2.multiply(trans).multiply(translate);

    var vertices = geometryIn.vertices;
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

    var faces = geometryIn.faces;
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

    return geometry;
});

var toolHyperbolic = new MeshTool("Hyperbolic", function (geometryIn, time, fn) {
    disc = new Disc(new Region(4, 5), 0.01, 222, geometryIn, fn);

    numpoints = 360;
    for (var i = 0; i < numpoints; i++){
        var z = Complex.createPolar(1, Math.PI * 2 * i / numpoints);
        var p = new THREE.Vector3(z.re, z.im, 0);
        p = fn(p);
     //   p = roll(p);
 //       console.log(p.x + " " + p.y + " " + p.z);
    }

    return disc.geometry;
});

var toolFunction = new MeshTool("Function", function (geometryIn, fn) {
    var geometry = new THREE.Geometry();
    var vertices = geometryIn.vertices;
    for (var i = 0, il = vertices.length; i < il; i++) {
        var vertex = vertices[i].clone();
        geometry.vertices.push(fn(vertex));
    }

    var faces = geometryIn.faces;
    for (var i = 0, il = faces.length; i < il; i++) {
        geometry.faces.push(faces[i]);
    }

    return geometry;
});

var toolOffset = new MeshTool("Offset", function (geometryIn, thickness) {
    var consolidated = geometryIn.clone();

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

        if (normals[i] !== undefined) {
            normals[i] = normals[i].normalize();
            vertex.add(normals[i].multiplyScalar(thickness))
        } else {
            var test = 0;
        }

        geometry.vertices.push(vertex);
    }

    var faces = consolidated.faces;
    for (var i = 0, il = faces.length; i < il; i++) {
        geometry.faces.push(faces[i]);
    }

    return geometry;
});


var toolIdentity = new MeshTool("Identity", function (geometryIn, time) {
    var geometry = new THREE.Geometry();
    var vertices = geometryIn.vertices;
    for (var i = 0, il = vertices.length; i < il; i++) {
        var vertex = vertices[i].clone();
        geometry.vertices.push(vertex);
    }

    var faces = geometryIn.faces;
    for (var i = 0, il = faces.length; i < il; i++) {
        geometry.faces.push(faces[i]);
    }

    newModel.add(THREE.SceneUtils.createMultiMaterialObject(geometry, this.materials));

    return geometry;
});

