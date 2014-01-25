
//if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer;

var cross;

init();
animate();

function init() {
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 50;
	camera.fov *= 1/4;
	camera.updateProjectionMatrix();

	controls = new THREE.TrackballControls( camera );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];  // 	MOVE mouse &amp; press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan

	controls.addEventListener( 'change', render );

	// world

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x000000, 0.002 );
	
 	var geom = new THREE.SphereGeometry(1);
	var mesh = new THREE.Mesh( geom );
    scene.add(mesh);

	var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, side: THREE.DoubleSide } );
//	var material = new THREE.MeshNormalMaterial( { color:0xffffff, side: THREE.DoubleSide } );

	var loader = new THREE.OBJLoader();
	loader.addEventListener( 'load', function ( event ) {
		var mesh = null;
		var object = event.content;
	
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				if (mesh == null) {
					mesh = child;
				} else {
					THREE.GeometryUtils.merge(mesh.geometry, child.geometry);
				}
			}
		} );
	
		mesh.material = material;
		mesh.geometry.computeFaceNormals();
		mesh.geometry.computeBoundingBox();
		var size = mesh.geometry.boundingBox.size();
		mesh.geometry.applyMatrix( 
			new THREE.Matrix4()
			.makeScale( 2/size.x, 2/size.y, 2/size.z )
			.translate(mesh.geometry.boundingBox.center().negate())
		);
		
		//scene.add( mesh );
		
	    disc = new Disc(new Region(4, 5), 0.995, 22, mesh.geometry.clone(), scene);
		
		var mesh2 = new THREE.Mesh( mesh.geometry, material );
		mesh2.position.y = 2;
	//	scene.add(mesh2);

		render();
	});
	loader.load( 'gyroid-evolver.obj' );

	// lights

	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0x002288 );
	light.position.set( -1, -1, -1 );
	scene.add( light );

	light = new THREE.AmbientLight( 0x222222 );
	scene.add( light );


	// renderer

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setClearColor( scene.fog.color, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	controls.handleResize();

	render();

}

function animate() {

	requestAnimationFrame( animate );
	controls.update();

}

function render() {

	renderer.render( scene, camera );
	stats.update();

}
