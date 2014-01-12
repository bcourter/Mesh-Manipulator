function Disc(region, circleLimit, maxRegions, geometry, materials) {
    this.region = region;
    this.circleLimit = circleLimit;
    this.maxRegions = maxRegions;

    this.circleMaxModulus;
    this.radiusLimit = 1E-4;
    
    this.initialFace = Face.create(region, geometry); //.transform(Mobius.createDiscAutomorphism(new Complex([0.001, 0.001]), 0));
    this.initialFace = this.initialFace.transform(Mobius.identity);
	
   	this.faces = [this.initialFace];

    this.drawCount = 1;
    this.totalDraw = 0;

    this.geometries = this.initFaces(this.initialFace.geometries);

    this.model = new THREE.Object3D();
    for (var i = 0, length = this.geometries.length; i < length; i++) 
        this.model.add(THREE.SceneUtils.createMultiMaterialObject(this.geometries[i], materials));
}

Disc.prototype.initFaces = function (geometries) {
    var seedFace = this.initialFace;
    var faceQueue = [seedFace];
    var faceCenters = new ComplexCollection();

    var count = 1;
    var minDist = 1;
    while (faceQueue.length > 0 && count < this.maxRegions) {
        face = faceQueue.pop();

        for (var i = 0; i < face.edges.length; i++) {
            var edge = face.edges[i];
            if (edge.isConvex())
                continue;

            var c = edge.Circline;
            if (c.constructor != Circle)
                continue;


            //       if (face.edgeCenters[i].magnitudeSquared > 0.9) 
            //          continue;

            if (c.radiusSquared() < this.radiusLimit)
                continue;

            var mobius = edge.Circline.asMobius();
            var image = face.conjugate().transform(mobius);
            //          if (isNaN(image.center.re)) {
            //              output("NaN!");
            //             continue;
            //         }

            if (image.center.modulusSquared() > this.circleLimit)
                continue;

			// var arg = image.center.argument();
			// if (arg <= -0.0001 || arg > 2 *Math.PI /3 )
			// 	continue;

            if (faceCenters.contains(image.center))
                continue;

            //this.faces.push(image);
            geometries = geometries.concat(image.geometries);
            faceQueue.unshift(image);
            faceCenters.add(image.center);
            count++;
        //    break;
        }
    }

    this.circleMaxModulus = faceCenters.max;
	return geometries;
};

var backgroundColor = null;

function colorAlpha(color, alpha) {
    return [color[0], color[1], color[2], alpha];
}

