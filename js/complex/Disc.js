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

    this.geometry = this.initFaces(this.initialFace.geometry);

    this.model = new THREE.Object3D();
    this.model.add(THREE.SceneUtils.createMultiMaterialObject(this.geometry, materials));
}

Disc.prototype.initFaces = function (geometry) {
    var seedFace = this.initialFace;
    var faceQueue = [seedFace];
    var faceCenters = new ComplexCollection();
    var geom = geometry.clone();

    var count = 1;
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

            // if (c.radiusSquared() < this.radiusLimit)
            //     continue;

            var mobius = edge.Circline.asMobius();
            var image = face.conjugate().transform(mobius);

      //      if (image.center.modulusSquared() > this.circleLimit)
      //         continue;

			 var arg = image.center.argument();
			 if (arg <= -0.001 || arg > Math.PI + 0.001 )
			 	continue;

             var p = new THREE.Vector3(image.center.re, image.center.im, 0);
             p = rotate(p);
             p = translate(p);
             p = circleToStrip(p);
             if (p.x > 1.4) 
                continue;
            if (p.x < -0.5)
                continue;
            if (Math.abs(p.y) > this.circleLimit)
                continue;


            if (faceCenters.contains(image.center))
                continue;

            THREE.GeometryUtils.merge(geom, image.geometry);
            faceQueue.unshift(image);
            faceCenters.add(image.center);
            count++;
        //    break;
        }
    }

    this.circleMaxModulus = faceCenters.max;
	return geom;
};

var backgroundColor = null;

function colorAlpha(color, alpha) {
    return [color[0], color[1], color[2], alpha];
}

