var MeshTool = function (name, method) {
    this.name = name;
    this.method = method;
};

var tool4DExplode = new MeshTool("4D Explode", function (objModel, time) {
    var newModel = objModel.clone();

    var translate = new FOUR.Matrix5().makeTranslation(0, 0, 0, 0);
    var trans = new FOUR.Matrix5().makeRotationWX(time * 0.03);
    var trans2 = new FOUR.Matrix5().makeRotationWY(time * 0.2);
    var trans3 = new FOUR.Matrix5().makeRotationZW(time * 0.02);
    trans = trans2.multiply(trans).multiply(translate);

    newModel.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var geometry = child.geometry;

            var vertices = geometry.vertices;
            var newVertices = [];
            for (var i = 0, il = vertices.length; i < il; i++) {
                var sumSq = (1 + vertices[i].lengthSq())
                var vertex = vertices[i].clone();
                vertex = vertex.multiplyScalar(2 / sumSq);
                var vertex4 = new THREE.Vector4(vertex.x, vertex.y, vertex.z, (sumSq - 2) / sumSq);  // reverse stereographic

                vertex4.applyMatrix5(trans);

                var newVertex = new THREE.Vector3(vertex4.x, vertex4.y, vertex4.z);
                newVertex = newVertex.divideScalar(vertex4.w);  // stereographic
                newVertex = newVertex.divideScalar(vertex.lengthSq());  // inversion
                newVertices.push(newVertex);
            }
            geometry.vertices = newVertices;

            var faces = geometry.faces;
            geometry.faces = [];
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
        }
    });

    return newModel;
});


