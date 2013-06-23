function Disc(region, circleLimit, maxRegions, geometry) {
    this.region = region;
    this.circleLimit = circleLimit;
    this.maxRegions = maxRegions;

    this.circleMaxModulus;
    this.radiusLimit = 1E-4;
    
	this.geometries = [];
    this.initialFace = Face.create(region, geometry, this.geometries); //.transform(Mobius.createDiscAutomorphism(new Complex([0.001, 0.001]), 0));
	this.geometries.push(this.initialFace.geometry);
 
   	this.faces = [this.initialFace];

    this.drawCount = 1;
    this.totalDraw = 0;

    this.initFaces(this.geometries);
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
            //          if (isNaN(image.center.data[0])) {
            //              output("NaN!");
            //             continue;
            //         }

            if (image.center.modulusSquared() > this.circleLimit)
                continue;

      //      if (faceCenters.contains(image.center))
     //           continue;

            this.faces.push(image);
            geometries.push(image.geometry);
            faceQueue.unshift(image);
            faceCenters.add(image.center);
            count++;
        //    break;
        }
    }

    this.circleMaxModulus = faceCenters.max;
};

var backgroundColor = null;

function colorAlpha(color, alpha) {
    return [color[0], color[1], color[2], alpha];
}

