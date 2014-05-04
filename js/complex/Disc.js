function Disc(region, sizeLimit, maxRegions, geometry, fn) {
    this.region = region;
    this.sizeLimit = sizeLimit;
    this.maxRegions = maxRegions;

    this.circleMaxModulus;
    this.radiusLimit = 1E-5;
    
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

            var mobius = edge.Circline.asMobius();
            var image = face.conjugate().transform(mobius);
            console.log(image.center.re + ", " + image.center.im);

            var faceCenter = this.fn(new THREE.Vector3(face.center.re, face.center.im, 0));
            var imageCenter = this.fn(new THREE.Vector3(image.center.re, image.center.im, 0));
            var r = faceCenter.sub(imageCenter).length();

            // var averageVector = new THREE.Vector3(0, 0, 0);
            // for (var j = 0; j < image.edges.length; j++) {
            //     var ev = image.edges[j].start;
            //     averageVector = averageVector.add(this.fn(new THREE.Vector3(ev.re, ev.im, 0)));
            // }
            // averageVector = averageVector.multiplyScalar(1/image.edges.length)

            // var averageRadius = 0;
            // for (var j = 0; j < image.edges.length; j++) {
            //     var ev = image.edges[j].start;
            //     averageRadius = averageVector.sub(this.fn(new THREE.Vector3(ev.re, ev.im, 0))).length();
            // }
            // averageRadius /= image.edges.length;
            // console.log(averageRadius);

            if (r < this.sizeLimit)
                continue;

    //         if (imageCenter.x < -0.1 || imageCenter.y > 0.1)
    //             continue;

         //   if (faceCenters.contains(image.center))
          //      continue;

       //     var arg = new Complex(p.x, p.y).argument();
        //    if (arg <= -0.1 || arg > Math.P/3 + 0.1 )
        //        continue;

            var halt = false
            for (var j = 0; j < faceCenters.length; j++) {
                if (Complex.equals(faceCenters[j], image.center)) {
                    halt = true;
                    break;
                }
            }
            if (halt) continue;

            var n = 0;
            if (r < this.sizeLimit * 25)
                n = 1;
            if (r < this.sizeLimit * 10)
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

    geom.mergeVertices();
	return geom;
};

var backgroundColor = null;

function colorAlpha(color, alpha) {
    return [color[0], color[1], color[2], alpha];
}

