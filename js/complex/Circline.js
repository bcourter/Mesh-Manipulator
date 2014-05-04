function Circline(a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
	
	if(isNaN(a) || isNaN(b.re || isNaN(b.im) || isNaN(c)))	{
		var d = 0; // tbd throw
	}
}

Circline.create = function(a, b, c) {
	if (Accuracy.lengthIsZero(a)) {
		return new Line(b, c);
	}

	return new Circle(a, b, c);
};

Circline.prototype.transform = function(mobius) {
	var inverse = mobius.inverse();
	//			Mobius hermitian = inverse.Transpose *
	//			new Mobius(new Complex(Circline.a, 0), Circline.b.Conjugate, Circline.b, new Complex(Circline.c, 0)) *
	//			inverse.Conjugate;
	var a = inverse.transpose();
	var b = new Mobius(new Complex(this.a, 0), this.b.conjugate(), this.b, new Complex(this.c, 0));
	var c = inverse.conjugate();	
	
	var hermitian = Mobius.multiply(
		Mobius.multiply(
			a, 
			b
		),
		c
	);

	//console.log(hermitian.a.re + " " + hermitian.c.re + " " +  hermitian.c.im + " " + hermitian.d.re);

	return Circline.create(hermitian.a.re, hermitian.c, hermitian.d.re);
};

Circline.prototype.equals = function(circline) {
	return accuracy.lengthEquals(this.a, circline.a) && Complex.equals(this.b, circline.b) && accuracy.lengthEquals(c, circline.c);
};

Circline.prototype.isPointOnLeft = function(point) {
	return (this.a * point.modulusSquared + Complex.add(Complex.multiply(this.b.conjugate(), point),
	Complex.multiply(this.b , point.conjugate)).re + this.c + Accuracy.LinearTolerance) > 0;
};

Circline.prototype.containsPoint = function(point) {
	return accuracy.lengthIsZero(this.a * point.ModulusSquared + Complex.add(Complex.multiply(this.b.conjugate(), point) , 			Complex.multiply(this.b , point.conjugate)).re + c);
};

Circline.prototype.arePointsOnSameSide = function(p1, p2) {
	if (Complex.equals(p1, p2))
		return true;

	return Circline.isPointOnLeft(p1) ^ Circline.isPointOnLeft(p2);
};

Circline.prototype.conjugate = function() {
	return Circline.create(this.a, this.b.conjugate(), this.c);
};

function Circle(a, b, c) {
//	Circline.call(this);
	this.a = 1;
	this.b = b.scale(1/a);
	this.c = c/a;
}

Circle.prototype = new Circline();
Circle.prototype.constructor = Circle;

Circle.prototype.create = function(center, radius) {
	return new Circle(1, center.negative(), center.modulusSquared() - radius * radius);
};

Circle.unit = Circle.prototype.create(Complex.zero, 1);

Circle.prototype.center = function() {
	return this.b.negative().scale(1/this.a);
};

Circle.prototype.radiusSquared = function() {
	return this.center().modulusSquared() - this.c / this.a;
};

Circle.prototype.radius = function() {
	return Math.sqrt(this.radiusSquared());
};

Circle.prototype.inverse = function() {
	if (accuracy.lengthIsZero((this.center().modulusSquared() - this.radiusSquared()))) {
		return new Line(this.b.negative().conjugate(), 1);
	}

	return new Circle(this.center().modulusSquared() - this.radiusSquared(), this.b.conjugate(), 1);
};

Circle.prototype.asMobius = function() {
	return new Mobius(this.center(), new Complex(this.radiusSquared() - this.center().modulusSquared(), 0), Complex.one, this.b.conjugate());
};

Circle.prototype.scale = function(scale) {
	if (scale.constructor == Complex) {
		scale = scale.modulus;
	}

	return Circle.prototype.create(this.center().scale(scale), this.radius() * scale);
};

function Line(b, c) {
//	Circline.call(this);
	this.a = 0;
	this.b = b;
	this.c = c;
}

Line.prototype = new Circline();
Line.prototype.constructor = Line;

Line.createTwoPoint = function(p1, p2) { 
	dx = p2.re - p1.re;
	dy = p2.im - p1.im;

	return Line.createFromEquation(-dy, dx, dx * p1.im - dy * p1.re);
};

// Creates a linear Circle a * x + b * y + c = 0 from reals a, b, and c.
Line.createFromEquation = function(a, b, c) {
	return new Line(new Complex(a / 2, b / 2), c);
};

Line.createPointAngle = function(point, angle) { 
	return Line.createTwoPoint(point, Complex.subtract(point, Complex.createPolar(1, angle)));
};
	
Line.prototype.inverse = function() {
	if (accuracy.lengthIsZero(c)) {  
		return new Line(this.b.conjugate(), 0);
	}

	return new Circle(this.b.conjugate.scale(1 / c), this.b.modulus / c);
};

Line.prototype.asMobius = function() {
	return new Mobius(this.b, Complex.one, Complex.zero, this.b.negative().conjugate());
};

