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
    this.c = Circle.prototype.create(new Complex([this.d, 0]), this.r);
    var center = this.c.center();

    var polar = Complex.createPolar(this.r, Math.PI - this.phi);
    this.p0 = Complex.zero;
    this.p1 = Complex.add(new Complex([this.d, 0]), polar);
    this.p2 = new Complex([this.d - this.r, 0]);
}


function Face(region, center, geometries, isFlipped) {
    this.region = region;
    this.center = center;
	this.geometries = geometries;
    this.isFlipped = isFlipped;
}

Face.create = function (region, geometry) {
    var p = region.p;
    var increment = Mobius.createRotation(2 * Math.PI / p);
    var midvertex = region.p1;
    
    var zDist = region.p2.data[0];
    var hDist = Math.log((1+zDist) / (1-zDist));
    
    var geom = geometry.clone(); 
	geom.computeBoundingBox();
	var offset = geom.boundingBox.max.sub(geom.boundingBox.min);

 	var vertices = geom.vertices;
    for (var i = 0; i < vertices.length; i++) {
    	var z = vertices[i].z;
    	var rHyp = hDist * Math.sqrt(vertices[i].x*vertices[i].x + vertices[i].y*vertices[i].y);
    	var dir = new THREE.Vector3(vertices[i].x, vertices[i].y, 0).normalize();
    	var eRHyp = Math.exp(rHyp);
    //	var rZ = (eRHyp - 1)/(eRHyp + 1);
    //	vertices[i] = dir.multiplyScalar(rZ);
    	vertices[i].z = z;
		vertices[i].x += offset.x/2;
		vertices[i].y += offset.y/2;
    }
    
	this.geometries = [];
    var face = new Face(region, Complex.zero, this.geometries, false);

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

		for (var j = 0; j < vertices.length; j++) {
			var z = new Complex([vertices[j].x, vertices[j].y]);
			var zc = z.conjugate().transform(rotation);
			z = z.transform(rotation);

			newVertices[j] = new THREE.Vector3(z.data[0], z.data[1], vertices[j].z);
			newVerticesC[j] = new THREE.Vector3(zc.data[0], zc.data[1], vertices[j].z);
		}

        face.geometries.push(newGeom);
        face.geometries.push(newGeomC);
    }

    return face;
};

Face.createFromExisting = function (previous, edges, center, geometries, isFlipped) {
    var face = new Face(previous.region, center, geometries, isFlipped);
    face.edges = edges;
    return face;
};

Face.prototype.transform = function (mobius) {
	var geoms = [];
	for (var j = 0; j < this.geometries.length; j++) {
		var geom = this.geometries[j].clone(); 
	 	var vertices = geom.vertices;
		for (var i = 0; i < vertices.length; i++) {
			var z = vertices[i].z;
			vertices[i] = Complex.createFromVector3(vertices[i]).transform(mobius).toVector3();
			vertices[i].z = z;
		}
		
		var p = this.region.p;
		var edges = [];
	   	for (var i = 0; i < p; i++) {
		    edges[i] = this.edges[i].transform(mobius);
		}
    	
		geoms.push(geom);
	}

    return Face.createFromExisting(this, edges, this.center.transform(mobius), geoms, this.isFlipped);
};

Face.prototype.conjugate = function () {
 	var geoms = [];
	for (var j = 0; j < this.geometries.length; j++) {
		var geom = this.geometries[j].clone(); 
	 	var vertices = geom.vertices;
		for (var i = 0; i < vertices.length; i++) {
			vertices[i] = new THREE.Vector3(vertices[i].x, -vertices[i].y, vertices[i].z);
		}

		var p = this.region.p;
		var edges = [];
		for (var i = 0; i < p; i++) {
		    edges[i] = this.edges[i].conjugate();
		}

		geoms.push(geom);
	}

    return Face.createFromExisting(this, edges, this.center.conjugate(), geoms, !this.isFlipped);
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

