function Region(p, q) {
    this.p = p;
    this.q = q;
    var sinP2 = Math.pow(Math.sin(Math.PI / p), 2);
    var cosQ2 = Math.pow(Math.cos(Math.PI / q), 2);
    this.r = Math.sqrt(sinP2 / (cosQ2 - sinP2));
    this.d = Math.sqrt(cosQ2 / (cosQ2 - sinP2));
    this.phi = Math.PI * (0.5 - (1.0 / p + 1.0 / q));

    this.l1 = Line.createTwoPoint(Complex.zero, Complex.one);
    this.l2 = Line.createPointAngle(Complex.zero, Math.PI / p);
    this.c = Circle.prototype.create(new Complex(this.d, 0), this.r);

    var polar = Complex.createPolar(this.r, Math.PI - this.phi);
    this.p0 = Complex.zero;
    this.p1 = Complex.add(new Complex(this.d, 0), polar);
    this.p2 = new Complex(this.d - this.r, 0);
}


function Face(region, center, geometry, isFlipped) {
    this.region = region;
    this.center = center;
	this.geometry = geometry;
    this.isFlipped = isFlipped;
}

var origVertices;
Face.create = function (region, geometry) {
    var p = region.p;
    var increment = Mobius.createRotation(2 * Math.PI / p);
    var midvertex = region.p1;
    
    var geom = geometry.clone(); 
	geom.computeBoundingBox();
	var offset = geom.boundingBox.max.sub(geom.boundingBox.min);

    for (var i = 0; i < geom.vertices.length; i++) {
		geom.vertices[i].x += offset.x/2;
		geom.vertices[i].y += offset.y/2;
    }
    
    var face = new Face(region, Complex.zero, new THREE.Geometry(), false);
 	origVertices = geom.vertices;

    var edge = new Edge(this, region.c, midvertex, midvertex.transform(increment.inverse()));
    face.edges = [];
    var rotation = Mobius.identity;
    for (var i = 0; i < p; i++) {
        rotation = Mobius.multiply(rotation, increment);
        face.edges[i] = edge.transform(rotation);
       
    	var newGeom = geom.clone(); 
    	var newGeomC = geom.clone(); 
 		var newVertices = newGeom.vertices;
 		var newVerticesC = newGeomC.vertices;

		for (var j = 0; j < geom.vertices.length; j++) {
			var z = new Complex(geom.vertices[j].x, geom.vertices[j].y);
			var zc = z.conjugate().transform(rotation);
			z = z.transform(rotation);

			newVertices[j] = new THREE.Vector3(z.re, z.im, geom.vertices[j].z);
			newVerticesC[j] = new THREE.Vector3(zc.re, zc.im, geom.vertices[j].z);
		}

		newGeom.computeFaceNormals();
    	newGeom.computeVertexNormals();
		newGeomC.computeFaceNormals();
    	newGeomC.computeVertexNormals();

    	for (var k = 0, kl = newGeomC.faces.length; k < kl; k++) {
    		var normals = newGeomC.faces[k].vertexNormals;
    		for (var j = 0, jl = normals.length; j < jl; j++) 
      	    	normals[j] = normals[j].multiplyScalar(-1);
      	}

        THREE.GeometryUtils.merge(face.geometry, newGeom);
        THREE.GeometryUtils.merge(face.geometry, newGeomC);
    }

    face.geometry.mergeVertices();
    return face;
};

Face.createFromExisting = function (previous, edges, center, geometry, isFlipped) {
    var face = new Face(previous.region, center, geometry, isFlipped);
    face.edges = edges;
    return face;
};

Face.prototype.transform = function (mobius) {
	var geom = this.geometry.clone(); 
 	var vertices = geom.vertices;

	var newVertices = [];
	for (var i = 0; i < vertices.length; i++) {
		newVertices[i] = Complex.createFromVector3(vertices[i]).transform(mobius).toVector3();
		var x = newVertices[i].x;
		var y = newVertices[i].y;
		var r = Math.sqrt(x * x + y * y);
		newVertices[i].z = vertices[i].z;
	}
	
	geom.vertices = newVertices;

	var p = this.region.p;
	var edges = [];
   	for (var i = 0; i < p; i++) {
	    edges[i] = this.edges[i].transform(mobius);
	}

    return Face.createFromExisting(this, edges, this.center.transform(mobius), geom, this.isFlipped);
};

Face.prototype.conjugate = function () {
	var geom = this.geometry.clone(); 
 	var vertices = geom.vertices;
	for (var i = 0; i < vertices.length; i++) {
		vertices[i] = new THREE.Vector3(vertices[i].x, -vertices[i].y, vertices[i].z);
	}

	var p = this.region.p;
	var edges = [];
	for (var i = 0; i < p; i++) {
	    edges[i] = this.edges[i].conjugate();
	}

    return Face.createFromExisting(this, edges, this.center.conjugate(), geom, !this.isFlipped);
};

function Edge(Face, Circline, start, end) {
    this.Face = Face;
    this.Circline = Circline;
    this.start = start;
    this.end = end;
}

Edge.prototype.transform = function (mobius) {
    return new Edge(this.Face, this.Circline.transform(mobius), this.start.transform(mobius), this.end.transform(mobius));
};

Edge.prototype.conjugate = function () {
    return new Edge(this.Face, this.Circline.conjugate(), this.end.conjugate(), this.start.conjugate());
};

Edge.prototype.isConvex = function () {
    if (this.Circline.constructor != Circle)
        return false;

    var a1 = Complex.subtract(this.end, this.start).argument();
    var a2 = Complex.subtract(this.Circline.center(), this.start).argument();
    return (a1 - a2 + 4 * Math.PI) % (2 * Math.PI) < Math.PI;
};

