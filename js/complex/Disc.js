function Disc(region, circleLimit, maxRegions, geometry, fn) {
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

    this.fn = fn;
    this.geometry = this.initFaces();

    this.geometry = toolFunction.method(this.geometry, fn);
}

Disc.prototype.initFaces = function () {
    var seedFace = this.initialFace;
    var faceQueue = [seedFace];
 //   var faceCenters = new ComplexCollection();
    var faceCenters = [];
    var geom = this.initialFace.geometry[0].clone();

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
            if (arg <= -0.1 || arg > Math.PI + 0.1 )
            	continue;

            var p = new THREE.Vector3(image.center.re, image.center.im, 0);
            p = this.fn(p);
            if (p.x > 1.4) 
                continue;
            if (p.x < -0.5)
                continue;
            if (Math.abs(p.y) > this.circleLimit)
                continue;

         //   if (faceCenters.contains(image.center))
          //      continue;

            var halt = false
            for (var j = 0; j < faceCenters.length; j++) {
                if (Complex.equals(faceCenters[j], image.center))
                    halt = true;
            }
            if (halt)
                continue;

            var n = 0;
            if (Math.abs(p.y) > 0.45)
                n = 1;
            if (Math.abs(p.y) > 0.75)
                n = 2;

            THREE.GeometryUtils.merge(geom, image.geometry[n]);
            faceQueue.unshift(image);
        //    faceCenters.add(image.center);
            faceCenters.push(image.center);
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

