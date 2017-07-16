/**
 * @author alteredq / http://alteredqualia.com/
 * @authod mrdoob / http://mrdoob.com/
 * @authod arodic / http://aleksandarrodic.com/
 * @authod fonserbc / http://fonserbc.github.io/
 *
 * Off-axis stereoscopic effect based on http://paulbourke.net/stereographics/stereorender/
 */

THREE.StereoEffect = function ( renderer ) {

	// API

    this.separation = 2.0; //3;

	/*
	 * Distance to the non-parallax or projection plane
	 */
	this.focalLength = 15;

	// internals

	var _width, _height;

	var _position = new THREE.Vector3();
	var _quaternion = new THREE.Quaternion();
	var _scale = new THREE.Vector3();

	var _cameraL = new THREE.PerspectiveCamera();
	var _cameraR = new THREE.PerspectiveCamera();

	var _fov;
	var _outer, _inner, _top, _bottom;
	var _ndfl, _halfFocalWidth, _halfFocalHeight;
	var _innerFactor, _outerFactor;

    var leftFrustum = new THREE.Frustum();
    var rightFrustum = new THREE.Frustum();

	// initialization

	renderer.autoClear = false;

	this.setSize = function ( width, height ) {

		_width = width / 2;
		_height = height;

		renderer.setSize( width, height );

	};

    this.UpdateLeftFrustum = function()
    {
        var frustumMat = new THREE.Matrix4();
        frustumMat.multiplyMatrices( _cameraL.projectionMatrix, _cameraL.matrixWorldInverse );
        leftFrustum.setFromMatrix( frustumMat );        
    }

    this.UpdateRightFrustum = function()
    {
        var frustumMat = new THREE.Matrix4();
        frustumMat.multiplyMatrices( _cameraR.projectionMatrix, _cameraR.matrixWorldInverse );
        rightFrustum.setFromMatrix( frustumMat );        
    }

    this.ContainsSphere = function( center, radius )
    {        
        for( var i=0; i<6; i++ ) 
        {
            var distance = leftFrustum.planes[ i ].distanceToPoint( center );
			if( distance < radius ) 
            {
				return true;
			}

			distance = rightFrustum.planes[ i ].distanceToPoint( center );
			if( distance < radius ) 
            {
				return true;
			}
		}

        return false;
    }

    this.ContainsPoint = function( p )
    {
        if( leftFrustum.containsPoint( p )
            || rightFrustum.containsPoint( p )
            )
            return true;

        return false;
    }

	this.render = function ( scene, camera ) 
    {

		scene.updateMatrixWorld();

		if ( camera.parent === undefined ) camera.updateMatrixWorld();
	
		camera.matrixWorld.decompose( _position, _quaternion, _scale );

		// Stereo frustum calculation

		// Effective fov of the camera
		_fov = THREE.Math.radToDeg( 2 * Math.atan( Math.tan( THREE.Math.degToRad( camera.fov ) * 0.5 ) ) );

		_ndfl = camera.near / this.focalLength;
		_halfFocalHeight = Math.tan( THREE.Math.degToRad( _fov ) * 0.5 ) * this.focalLength;
		_halfFocalWidth = _halfFocalHeight * 0.5 * camera.aspect;

		_top = _halfFocalHeight * _ndfl;
		_bottom = -_top;
		_innerFactor = ( _halfFocalWidth + this.separation * 0.5 ) / ( _halfFocalWidth * 2.0 );
		_outerFactor = 1.0 - _innerFactor;

		_outer = _halfFocalWidth * 2.0 * _ndfl * _outerFactor;
		_inner = _halfFocalWidth * 2.0 * _ndfl * _innerFactor;

		// left

		_cameraL.projectionMatrix.makeFrustum(
			-_outer,
			_inner,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraL.position.copy( _position );
		_cameraL.quaternion.copy( _quaternion );
		_cameraL.translateX( - this.separation * 0.5 );

		// right

		_cameraR.projectionMatrix.makeFrustum(
			-_inner,
			_outer,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraR.position.copy( _position );
		_cameraR.quaternion.copy( _quaternion );
		_cameraR.translateX( this.separation * 0.5 );

        //this.UpdateLeftFrustum();
        //this.UpdateRightFrustum();

		//

		//renderer.setViewport( 0, 0, _width * 2, _height );
		//renderer.clear();

		renderer.setViewport( 0, 0, _width, _height );
		renderer.render( scene, _cameraL );

		renderer.setViewport( _width, 0, _width, _height );
		renderer.render( scene, _cameraR );

	};

};
