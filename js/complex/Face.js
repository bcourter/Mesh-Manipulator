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

	geometry[0].computeBoundingBox();
	var offset = geometry[0].boundingBox.max.sub(geometry[0].boundingBox.min);

    var face = new Face(region, Complex.zero, [], false);
    for (var n = 0; n < geometry.length; n++) {
        var geom = geometry[n].clone(); 
        for (var i = 0; i < geom.vertices.length; i++) {
    		geom.vertices[i].x += offset.x/2;
    		geom.vertices[i].y += offset.y/2;
        }
        
        face.geometry[n] = new THREE.Geometry();
     	origVertices = geom.vertices;

        var edge = new Edge(this, region.c, midvertex, midvertex.transform(increment.inverse()));
        face.edges = [];

        var geomC = geom.clone(); 
     	var faces = geomC.faces;
    	for (var i = 0; i < faces.length; i++) {
    		var tmp = faces[i].a;
    		faces[i].a = faces[i].b;
    		faces[i].b = tmp;
    	}

        var rotation = Mobius.identity;
        for (var i = 0; i < p; i++) {
            rotation = Mobius.multiply(rotation, increment);
            face.edges[i] = edge.transform(rotation);
           
        	var newGeom = geom.clone(); 
        	var newGeomC = geomC.clone(); 
     		var newVertices = newGeom.vertices;
     		var newVerticesC = newGeomC.vertices;

    		for (var j = 0; j < geom.vertices.length; j++) {
    			var z = new Complex(geom.vertices[j].x, geom.vertices[j].y);
    			var zc = z.conjugate().transform(rotation);
    			z = z.transform(rotation);

    			newVertices[j] = new THREE.Vector3(z.re, z.im, geom.vertices[j].z);
    			newVerticesC[j] = new THREE.Vector3(zc.re, zc.im, geom.vertices[j].z);
    		}

            THREE.GeometryUtils.merge(face.geometry[n], newGeom);
            THREE.GeometryUtils.merge(face.geometry[n], newGeomC);
        }

        face.geometry[n].mergeVertices();
    }

    return face;
};

Face.createFromExisting = function (previous, edges, center, geometry, isFlipped) {
    var face = new Face(previous.region, center, geometry, isFlipped);
    face.edges = edges;
    return face;
};

Face.prototype.transform = function (mobius) {
    var geom = [];

    for (var n = 0; n < this.geometry.length; n++) {
    	geom[n] = this.geometry[n].clone(); 
     	var vertices = geom[n].vertices;

    	var newVertices = [];
    	for (var i = 0; i < vertices.length; i++) {
    		newVertices[i] = Complex.createFromVector3(vertices[i]).transform(mobius).toVector3();
    		var x = newVertices[i].x;
    		var y = newVertices[i].y;
    		newVertices[i].z = vertices[i].z;
    	}
    	
    	geom[n].vertices = newVertices;
    }

    var p = this.region.p;
    var edges = [];
    for (var i = 0; i < p; i++) {
        edges[i] = this.edges[i].transform(mobius);
    }

    return Face.createFromExisting(this, edges, this.center.transform(mobius), geom, this.isFlipped);
};

Face.prototype.conjugate = function () {
    var geom = [];

    for (var n = 0; n < this.geometry.length; n++) {
    	geom[n] = this.geometry[n].clone(); 
     	var vertices = geom[n].vertices;
    	for (var i = 0; i < vertices.length; i++) 
    		vertices[i] = new THREE.Vector3(vertices[i].x, -vertices[i].y, vertices[i].z);

    	var faces = geom[n].faces;
    	for (var i = 0; i < faces.length; i++) {
    		var tmp = faces[i].a;
    		faces[i].a = faces[i].b;
    		faces[i].b = tmp;
    	}
    }

	var p = this.region.p;
	var edges = [];
	for (var i = 0; i < p; i++) 
	    edges[i] = this.edges[i].conjugate();

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

  // console.log(a1.toString() + " " + a2.toString() + " " + ((a1 - a2 + 4.0 * Math.PI) % (2.0 * Math.PI) < Math.PI).toString());
    return (a1 - a2 + 4 * Math.PI) % (2 * Math.PI) < Math.PI;
};

