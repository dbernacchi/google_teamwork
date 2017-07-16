/* global THREE: true } */

var PX = PX || {}; 

var progressBarElement = $("#progressBar");
var progressBarTextElement = $("#progressBarText");
var startButtonElement = $("#startButton");

function ConvertPosToLatLon(x, y, z, radius)
{
//    var lat = 90.0 - (Math.acos(y / radius)) * 180.0 / Math.PI;
//    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0) - 180.0;
    var lat = (Math.acos(y / radius)) * 180.0 / Math.PI;
    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0);
    return new THREE.Vector2( lat, lon );
}

var IsReleaseMode = 1;
var camera, scene, renderer;
var effect, controls;
var element, container;
var windowWidth, windowHeight;
var deviceContentScale = 1.0;

var fgCamera;
var fgScene;

var currentTime = 0.0;
var frameTime = 0.0;
var clock = new THREE.Clock();

var headTrackGeometry;
var headTrackMaterial;
var headTrackMesh;

var isFirstUpdate = true;

//var headRadius = 1.0;
var headDir = new THREE.Vector3( 0, 0, 1 );
var headRight = new THREE.Vector3( 1, 0, 0 );
var headTrackTriggerTime = 2.0;
var headTrackCountTime = 0.0;
var headTrackSaveEnable = false;
var headTrackVertexIdx = 0;
var renderTrackingIn3D = false;
var previousHeadPos = new THREE.Vector3();
var currentHeadPos = new THREE.Vector3();
//var HeadTrackPositionArray = [];


function fullscreen() 
{
    console.log( "+--+  Set fullscreen mode" );

  if (container.requestFullscreen) 
  {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) 
  {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) 
  {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) 
  {
    container.webkitRequestFullscreen();
  }
}

function FindSceneIndexByName( sceneName )
{
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        if( PX.AnimSceneArray[i].name === sceneName )
            return i;
    }    
    return -1;
}

function FindSceneNameByIndex( index )
{
    return PX.AnimSceneArray[ index ].name;
}

function CreateRenderer()
{
    renderer = new THREE.WebGLRenderer({ antialias: true, precision: "mediump", stencil: false, alpha: 1 });
    renderer.setClearColor( 0xffffff, 1 );
    //renderer.gammaOutput = true;
    element = renderer.domElement;
    container = document.getElementById( "glContainer" );
    container.appendChild( element );

    container.width = 1;
    container.height = 1;
    container.style.width = 1;
    container.style.height = 1;
    renderer.setSize( 1, 1 );
    windowWidth = container.width;
    windowHeight = container.height;
    deviceContentScale = renderer.devicePixelRatio;

    //container.width = window.innerWidth;// * window.devicePixelRatio;
    //container.height = window.innerHeight;// * window.devicePixelRatio;
    //container.style.width = window.innerWidth;
    //container.style.height = window.innerHeight;
    //renderer.setSize( container.width, container.height);
    //windowWidth = container.width;
    //windowHeight = container.height;
    //deviceContentScale = renderer.devicePixelRatio;
}

function LoadData()
{
    $.when(
        LoadSceneData( "SH010_RtoL", "animations/sh010_LtoR_sphere_01.js")
        //, LoadSceneData( "SH010_LtoR", "animations/sh010_LtoR_sphere_01.js")
        , LoadSceneData( "SH020", "animations/sh020-60b.js")
        , LoadSceneData( "SH060B_070B", "animations/sh060b-070b.js")
        //, LoadSceneData( "CUBE", "animations/cube.js")
        , LoadJsonData( "SH010_RtoL_anim", "animations/sh010_RtoL_sphere_01.fbx.js" )
        //, LoadJsonData( "SH010_LtoR_anim", "animations/sh010_LtoR_sphere_01.fbx.js" )
        , LoadJsonData( "SH020_anim", "animations/sh020-60b.fbx.js" )
        , LoadJsonData( "SH060B_070B_anim", "animations/sh060b-070b.fbx.js" )
        //, LoadJsonData( "CUBE_anim", "animations/cube.fbx.js")
        , LoadTexture( "startButtonTexture", "textures/start.png" )
        //, LoadTexture( "welcomeTexture", "textures/welcome.png" )
        , LoadTexture( "worktogetherTexture", "textures/worktogether.png" )
    ).done(function ()
    {
        if( IsReleaseMode > 0 )
        {
            // fadeout preloader message and move on
            progressBarElement.fadeTo( 2000, 0).delay( 250, function()
            {
                progressBarElement.hide();
                progressBarTextElement.hide();
                startButtonElement.delay( 500 ).fadeTo( 1000, 1 ).delay( 250, function ()
                {
                    startButtonElement.on( "click", function( e )
                    {
                        console.log( "+--+  Finished loading. DoIt()" );

                        startButtonElement.dequeue();
                        startButtonElement.fadeTo( 2000, 0 ).delay( 500, function ()
                        {
                            startButtonElement.hide();
                            progressBarElement.empty();
                            DoIt();
                        } );

                        container.style.top = 0;
                        container.style.left = 0;
                        container.style.right = 0;
                        container.style.bottom = 0;

                        container.width = window.innerWidth;
                        container.height = window.innerHeight;
                        container.style.width = window.innerWidth;
                        container.style.height = window.innerHeight;
                        renderer.setSize( container.width, container.height );
                        windowWidth = container.width;
                        windowHeight = container.height;
                        deviceContentScale = renderer.devicePixelRatio;

                        if (container.requestFullscreen) 
                        {
                            container.requestFullscreen();
                        } 
                        else if (container.msRequestFullscreen) 
                        {
                            container.msRequestFullscreen();
                        } 
                        else if (container.mozRequestFullScreen) 
                        {
                            container.mozRequestFullScreen();
                        } 
                        else if (container.webkitRequestFullscreen) 
                        {
                            container.webkitRequestFullscreen();
                        }
                    } );
                });
            } );            
        }
        else
        {
            DoIt();
        }
    });
}

function DoIt()
{
    console.log( "DoIt" );

    if( IsReleaseMode > 0 )
        element.addEventListener( "click", fullscreen, false );

    container.width = window.innerWidth;
    container.height = window.innerHeight;
    container.style.width = window.innerWidth;
    container.style.height = window.innerHeight;
    renderer.setSize( container.width, container.height );
    windowWidth = container.width;
    windowHeight = container.height;
    deviceContentScale = renderer.devicePixelRatio;

    // Prepare Anim Scene
    var sh000AnimScene = new PX.AnimScene();
    PX.AnimSceneArray.push( sh000AnimScene );

    // Create entrance scene manually
    //
    var sh000Scene = new THREE.Scene();

/***    //
    var welcomeTexture = PX.AssetsDatabase.welcomeTexture;
    welcomeTexture.wrapS = THREE.ClampToEdgeWrapping;
    welcomeTexture.wrapT = THREE.ClampToEdgeWrapping;
    welcomeTexture.magFilter = THREE.LinearFilter;
    welcomeTexture.minFilter = THREE.LinearMipMapLinearFilter;
    welcomeTexture.anisotropy = renderer.getMaxAnisotropy();
    var welcomeMaterial = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        map: welcomeTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
    });
    var texAspect = welcomeTexture.image.width / welcomeTexture.image.height;
    var welcomeGeometry = new THREE.PlaneGeometry( -35*texAspect, 35, 10, 10 );
    var welcomeMesh = new THREE.Mesh( welcomeGeometry, welcomeMaterial );
    welcomeMesh.name = "welcome";
    welcomeMesh.frustumCulled = false;
    welcomeMesh.position.y = 0.0;
    welcomeMesh.position.z = 300.0;
    sh000Scene.add( welcomeMesh );
***/
    //
    var startTexture = PX.AssetsDatabase.startButtonTexture;
    startTexture.wrapS = THREE.ClampToEdgeWrapping;
    startTexture.wrapT = THREE.ClampToEdgeWrapping;
    startTexture.magFilter = THREE.LinearFilter;
    startTexture.minFilter = THREE.LinearMipMapLinearFilter;
    startTexture.anisotropy = renderer.getMaxAnisotropy();
    var startMaterial = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        map: startTexture,
        side: THREE.DoubleSide,
        transparent: true
    });
    var startGeometry = new THREE.PlaneGeometry( -35, 35, 10, 10 );
    var startMesh = new THREE.Mesh( startGeometry, startMaterial );
    startMesh.name = "start";
    startMesh.frustumCulled = false;
    startMesh.position.y = 30.0;
    startMesh.position.z = 350.0;
    sh000Scene.add( startMesh );

    //
    var userMaterial = new THREE.MeshBasicMaterial( {
        color: 0x75787B,
    });
    var userGeometry = new THREE.SphereGeometry( 7, 16, 16 );
    var userMesh = new THREE.Mesh( userGeometry, userMaterial );
    userMesh.name = "user";
    userMesh.position.z = 350.0;
    sh000Scene.add( userMesh );

    // Add scene to AnimScene array and set as interactive
    sh000AnimScene.isInteractive = true;
    // Initialize it
    sh000AnimScene.Init( "SH000", sh000Scene );


    if( IsReleaseMode > 0 )
    {
        PX.currentAnimName = "SH000";
    } 
    else
    {
        //PX.currentAnimName = "SH000";
        PX.currentAnimName = "SH010_RtoL";
        //PX.currentAnimName = "SH020";
        //PX.currentAnimName = "SH060B_070B";
        //PX.currentAnimName = "CUBE";        
    }
    PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );

    // Set animations for all scenes. Only does the non-interactive ones
    //
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        var as = PX.AnimSceneArray[i];
        as.SetAnimation();
    }


    // Add text to scene RtoL
    //
    var sceneRtoL = FindSceneByName( "SH010_RtoL" );

    var worktogetherTexture = PX.AssetsDatabase.worktogetherTexture;
    worktogetherTexture.wrapS = THREE.ClampToEdgeWrapping;
    worktogetherTexture.wrapT = THREE.ClampToEdgeWrapping;
    worktogetherTexture.magFilter = THREE.LinearFilter;
    worktogetherTexture.minFilter = THREE.LinearMipMapLinearFilter;
    worktogetherTexture.anisotropy = renderer.getMaxAnisotropy();
    var worktogetherMaterial = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        map: worktogetherTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
    });
    var texAspect = worktogetherTexture.image.width / worktogetherTexture.image.height;
    var worktogetherGeometry = new THREE.PlaneGeometry( -35*texAspect, 35, 10, 10 );
    var worktogetherMesh = new THREE.Mesh( worktogetherGeometry, worktogetherMaterial );
    worktogetherMesh.name = "worktogether";
    worktogetherMesh.frustumCulled = false;
    worktogetherMesh.position.y = 0.0;
    worktogetherMesh.position.z = 300.0;
    sceneRtoL.scene.add( worktogetherMesh );
    sceneRtoL.sceneObjectsArray.push( worktogetherMesh );



    // Turn all circle shapes into grey to start with
    //
    var scene000 = FindSceneByName( "SH060B_070B" );
    for( var i=0; i<scene000.sceneObjectsArray.length; i++ )
    {
        var so = scene000.sceneObjectsArray[i];

        if( so.name.substr(1, 3) === "Sph" )
        {
            // Assign every single circle with unique material
            var tmpMat = so.material.clone();
            so.material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
            so.material.color.r = tmpMat.color.r;
            so.material.color.g = tmpMat.color.g;
            so.material.color.b = tmpMat.color.b;
            // Dynamic create field in material that we'll use to re-color the circles in runtime
            so.material.destR = tmpMat.color.r;
            so.material.destG = tmpMat.color.g;
            so.material.destB = tmpMat.color.b; 
        }

        // Color all circles expect gSph1 and rSph21 (the one that scales up in the end of the scene) with grey
        if( so.name !== "gSph1"
            && so.name.substr(0, 3) !== "txt"
            && so.name !== "rSph21"
            )
        {
            // Grey 117/120/123
            so.material.color.r = 117 / 255;
            so.material.color.g = 120 / 255;
            so.material.color.b = 123 / 255;
        }
    }


    // For scene with geosphere connections
    //

    /*/
    var scene000 = FindSceneByName( "SH060B_070B" );
    var meshGeoSphereRef = scene000.FindObject( "geosphere01" );
    meshGeoSphereRef.material = new THREE.MeshBasicMaterial( { color: 0x007f00, side: THREE.DoubleSide, opacity: 0.25, transparent: true } );
    //meshGeoSphereRef.frustumCulled = false;
    /*/
    var meshGeoSphereRef = scene000.FindObject( "geosphere01" );
    meshGeoSphereRef.name = "geosphere01_old";
    //meshGeoSphereRef.material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    scene000.scene.remove( meshGeoSphereRef );
    //scene000.scene.needsUpdate = true;
    for( i=0; i<meshGeoSphereRef.geometry.faces.length; i++ )
    {
        var face = meshGeoSphereRef.geometry.faces[i];

        var edge0 = new PX.Edge();
        var edge1 = new PX.Edge();
        var edge2 = new PX.Edge();
        edge0.ai = face.a;
        edge0.bi = face.b;
        edge1.ai = face.b;
        edge1.bi = face.c;
        edge2.ai = face.c;
        edge2.bi = face.a;
        scene000.meshEdgeList.push( edge0 );
        scene000.meshEdgeList.push( edge1 );
        scene000.meshEdgeList.push( edge2 );

        //console.log( meshGeoSphereRef.geometry.vertices[ face.a ] );
        //console.log( meshGeoSphereRef.geometry.vertices[ face.b ] );
        //console.log( meshGeoSphereRef.geometry.vertices[ face.c ] );
    }

    //for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
    //{
    //    var so = scene000.sceneObjectsArray[ k ];
    //    console.log( "obj ", so.name, so.position );
    //}

/*****
    // Remove duplicate edges
    var duplicatesArray = [];
    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    {
        var edge = scene000.meshEdgeList[ j ];

        for( var k=j+1; k<scene000.meshEdgeList.length; k++ )
        {
            var edge2 = scene000.meshEdgeList[ k ];

            //// It can be reverse order too
            if( edge.ai === edge2.bi && edge.bi === edge2.ai )
            {
                duplicatesArray.push( j );
                //console.log( "duplicate: ", k );
                //break;
            }
        }
    }

    console.log( "scene000.meshEdgeList.length before : ", scene000.meshEdgeList.length, duplicatesArray.length );
    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    {
        for( var i=0; i<duplicatesArray.length; i++ )
        {
            if( duplicatesArray[i] === j )
                scene000.uniqueMeshEdgeList.push( scene000.meshEdgeList[j] );
            //console.log( "duplicatesArray ", duplicatesArray[i] );
        }        
    }
    console.log( "scene000.meshEdgeList.length after : ", scene000.meshEdgeList.length );
    console.log( "scene000.uniqueMeshEdgeList.length after : ", scene000.uniqueMeshEdgeList.length );
****/

    // Create AnimEdges
    //
    var minDistanceSq = 5.0 * 5.0;

    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    //for( var j=0; j<scene000.uniqueMeshEdgeList.length; j++ )
    {
        var edge = scene000.meshEdgeList[ j ];
        //var edge = scene000.uniqueMeshEdgeList[ j ];

        var animEdge = new PX.AnimEdge();

        // Find circle A
        //var hasfound = false;
        for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
        {
            var so = scene000.sceneObjectsArray[ k ];
            var distA = so.position.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.ai ] ).lengthSq();
            //console.log( distA );
            if( distA <= minDistanceSq )
            {
                animEdge.a = so;
                animEdge.av = meshGeoSphereRef.geometry.vertices[ edge.ai ].clone();
                animEdge.ai = edge.ai;
                //hasfound = true;
                //break;
            }

            var distB = so.position.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.bi ] ).lengthSq();
            if( distB <= minDistanceSq )
            {
                animEdge.b = so;
                animEdge.bv = meshGeoSphereRef.geometry.vertices[ edge.bi ].clone();
                animEdge.bi = edge.bi;
                //hasfound = true;
                //break;
            }

        }
        //if( hasfound )
        //    console.log( "1- ", so.name );
        //else
        //    console.log( "1- not found" );
/**
        // Find circle B
        hasfound = false;
        for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
        {
            var so = scene000.sceneObjectsArray[ k ];
            var distB = so.position.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.bi ] ).length();
            if( distB <= 5.0 )
            {
                animEdge.b = so;
                animEdge.bv = meshGeoSphereRef.geometry.vertices[ edge.bi ].clone();
                animEdge.bi = edge.bi;
                hasfound = true;
                break;
            }
        }
        //if( hasfound )
        //    console.log( "2- ", so.name );
        //else
        //    console.log( "2- not found" );
***/
        scene000.animEdges.push( animEdge );
    }


    // Create new geosphere mesh with animated edges
    //
    scene000.meshGeometry = new THREE.Geometry();
    scene000.meshGeometry.dynamic = true;
    //i = 0;
    for( i=0; i<scene000.animEdges.length; i++ )
    {
        var animEdge = scene000.animEdges[i];
        if( animEdge.ai != -1 && animEdge.bi != -1 )
        {
            // Get from geosphere
            var vA = meshGeoSphereRef.geometry.vertices[ animEdge.ai ].clone();
		    var vB = meshGeoSphereRef.geometry.vertices[ animEdge.bi ].clone();
            // Feed our new line mesh
            // Update our vertex indices for new mesh
            scene000.meshGeometry.vertices.push( vA );
            animEdge.ai = scene000.meshGeometry.vertices.length - 1;
            scene000.meshGeometry.vertices.push( vB );
            animEdge.bi = scene000.meshGeometry.vertices.length - 1;
        }
    }

    scene000.meshLineMaterial = new THREE.LineBasicMaterial( { color: 0x75787B, opacity: 1.0, transparent: true } );
    scene000.mesh = new THREE.Line( scene000.meshGeometry, scene000.meshLineMaterial, THREE.LinePieces );
    scene000.mesh.dynamic = true;
    scene000.mesh.name = "geosphere01";
    scene000.mesh.name.quaternion = meshGeoSphereRef.quaternion.clone();
    scene000.mesh.position = meshGeoSphereRef.position.clone();
    scene000.mesh.scale = meshGeoSphereRef.scale.clone();
    scene000.mesh.updateMatrix();
    scene000.sceneObjectsArray.push( scene000.mesh );
    scene000.scene.add( scene000.mesh );

    for( var i=0; i<scene000.animationInfoArray.length; i++ )
    {
        var animInfo = scene000.animationInfoArray[ i ];

        if( scene000.animationInfoArray[i].name === "geosphere01" )
        {
            console.log( "switch geosphere01 mesh" );
            scene000.animationInfoArray[i].meshRef = scene000.mesh;
            break;
        }
    }
    /**/




    init();
    resize();
    animate();
}


function init()
{
    effect = new THREE.StereoEffect( renderer );
    effect.separation = 2.5; //0.2;
    effect.focalLength = 40; //45;
    effect.setSize( windowWidth, windowHeight );

    scene = new THREE.Scene();
    scene.autoUpdate = false;

    camera = new THREE.PerspectiveCamera( 45, windowWidth/windowHeight, 0.1, 3000 );
    //camera.setLens( kCameraLens );
    camera.updateProjectionMatrix();
    //camera.position.set( 0, 10, 0 );
    scene.add( camera );

    controls = new THREE.OrbitControls( camera, element );
  //controls.rotateUp(Math.PI / 4);
    controls.target.set(
        camera.position.x,
        camera.position.y,
        camera.position.z+1
    );
    controls.noZoom = true;
    controls.noPan = true;
    controls.isPhoneAvailable = false;
    function setOrientationControls(e) 
    {
        if (!e.alpha) 
        {
            return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update( 0.016 );
        controls.isPhoneAvailable = true;

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);


    // Add first running scene to main scene
    //
    PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );



    // Add path line geometry
    //
    headTrackGeometry = new THREE.Geometry();
    for( var i=0; i<4096; i++ )
    {
        //var per = i / 100.0;
        //var phi = THREE.Math.randFloat( 0, 2 * Math.PI );
        //var theta = THREE.Math.randFloat( 0, Math.PI );
        //var r = 400.0;
        //var x = r * Math.cos( phi ) * Math.sin( theta );
        //var y = r * Math.sin( phi ) * Math.sin( theta );
        //var z = r * Math.cos( theta );

//        console.log( phi + ", " + y + ", " + z );

        var pos = new THREE.Vector2( -2, -2 );
        //var pos = ConvertPosToLatLon( x, y, z, r );
        //pos.x /= 180.0;  //
        //pos.y /= 360.0;  // Normalize coordinates
        //pos.x = 2 * pos.x - 1;
        //pos.y = 2 * pos.y - 1;
        headTrackGeometry.vertices.push( new THREE.Vector3( pos.x, pos.y, 1 ) );
    }
    headTrackGeometry.dynamic = true;
    //headTrackMaterial = new THREE.LineBasicMaterial( { color: 0xff00ff } );
    //headTrackMesh = new THREE.Line( headTrackGeometry, headTrackMaterial );
    if( renderTrackingIn3D )
        headTrackMaterial = new THREE.PointCloudMaterial( { color: 0xff0000, size: 20.0 } );
    else
        headTrackMaterial = new THREE.PointCloudMaterial( { color: 0xff0000, size: 0.025 } );
    headTrackMaterial.depthTest = false;
    headTrackMaterial.depthWrite = false;
    headTrackMesh = new THREE.PointCloud( headTrackGeometry, headTrackMaterial );
    headTrackMesh.frustumCulled = false;
    if( renderTrackingIn3D )
        scene.add( headTrackMesh );


    fgScene = new THREE.Scene();
    fgCamera = new THREE.Camera();
    fgScene.add( fgCamera );
    //if( ! renderTrackingIn3D )
    //    fgScene.add( headTrackMesh );

    // Add top-to-bottom line that splits the views
    //
    //console.log( windowWidth );
    var splitLineGeom = new THREE.Geometry();
    splitLineGeom.vertices.push( new THREE.Vector3( 0, 1, 1 ) );
    splitLineGeom.vertices.push( new THREE.Vector3( 0, -1, 1 ) );
    var splitLineMaterial = new THREE.LineBasicMaterial( { color: 0x75787B } );
    var splitLineMesh = new THREE.Line( splitLineGeom, splitLineMaterial );
    fgScene.add( splitLineMesh );

    controls.update( 0.016 );

    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);
}


function SaveHeadTrackedPositions( dt )
{
    headTrackCountTime += dt;

    headDir.set( 0, 0, 1 );
    headRight.set( 1, 0, 0 );
    headDir.applyQuaternion( camera.quaternion );
    //headDir.multiplyScalar( headRadius );
    headRight.applyQuaternion(camera.quaternion);
    headRight = headRight.normalize();
    
    var pos = ConvertPosToLatLon( headDir.x, headDir.y, headDir.z, 1 ); //headRadius );
    pos.x /= 180.0;  //
    pos.y /= 360.0;  // Normalize coordinates
    //console.log( pos.x + ", " + pos.y );
    pos.x = 2 * pos.x - 1;
    pos.y = 2 * pos.y - 1;

    if( ! isFirstUpdate )
    {
        previousHeadPos.copy( currentHeadPos );
    }
    if( renderTrackingIn3D )
        currentHeadPos.x = pos.y;
    else
        currentHeadPos.x = pos.y * -1;
    currentHeadPos.y = pos.x;
    currentHeadPos.z = 1;
    // If is first update make sure previous and current are the same before computing distances
    if( isFirstUpdate )
    {
        previousHeadPos.copy( currentHeadPos );
    }

    if( renderTrackingIn3D )
    {
        currentHeadPos.x *= 350.0;
        currentHeadPos.y *= 300.0;
        currentHeadPos.z *= 500.0;
    }

/*
    var diff = new THREE.Vector3();
    diff.subVectors( currentHeadPos, previousHeadPos );
    var len = diff.length();

    // If it goes too fast, cancel out the marking
    if( renderTrackingIn3D && len > 2.0 )
    {
        console.log( "len3D: " + len );
        headTrackCountTime = 0.0;
        headTrackSaveEnable = true;
    }

     if( !renderTrackingIn3D && len >= 0.025 )
     {
         console.log( "len2D: " + len );
         headTrackCountTime = 0.0;
         headTrackSaveEnable = true;
     }
*/

    if( headTrackCountTime >= headTrackTriggerTime )
    //if( headTrackSaveEnable && headTrackCountTime >= headTrackTriggerTime )
    {
        headTrackCountTime = 0.0;
        headTrackSaveEnable = false;

        headTrackMesh.geometry.vertices[ headTrackVertexIdx ].x = currentHeadPos.x;
        headTrackMesh.geometry.vertices[ headTrackVertexIdx ].y = currentHeadPos.y;
        headTrackMesh.geometry.vertices[ headTrackVertexIdx ].z = currentHeadPos.z;
        if (headTrackVertexIdx < 4095)
        {
             headTrackVertexIdx ++;
        }
        //console.log( currentHeadPos.x + ", " + currentHeadPos.y + ", " + currentHeadPos.z );
        headTrackGeometry.verticesNeedUpdate = true;
     }


    /***
     headTrackCountTime += dt;
     if( headTrackCountTime >= headTrackTriggerTime )
     {
         headTrackCountTime = 0.0;

         var headRadius = 400.0;
         var headDir = new THREE.Vector3( 0, 0, 1 );
         headDir.applyQuaternion( camera.quaternion );
         headDir.multiplyScalar( headRadius );

         var pos = ConvertPosToLatLon( headDir.x, headDir.y, headDir.z, headRadius );
         pos.x /= 180.0;  //
         pos.y /= 360.0;  // Normalize coordinates
         //console.log( pos.x + ", " + pos.y );
         pos.x = 2 * pos.x - 1;
         pos.y = 2 * pos.y - 1;

         previousHeadPos.copy( currentHeadPos );
         currentHeadPos.x = pos.y * 128;
         currentHeadPos.y = pos.x * 72;
         currentHeadPos.z = 50.0;
         var diff = new THREE.Vector3();
         diff.subVectors( currentHeadPos, previousHeadPos );
         var len = diff.lengthSq();

         if( len > 5.0 )
         {
             headTrackMesh.geometry.vertices[ headTrackVertexIdx ].x = currentHeadPos.x;
             headTrackMesh.geometry.vertices[ headTrackVertexIdx ].y = currentHeadPos.y;
             headTrackMesh.geometry.vertices[ headTrackVertexIdx ].z = currentHeadPos.z;
             if( headTrackVertexIdx < 511 )
                 headTrackVertexIdx ++;
             //console.log( pos.x + ", " + pos.y );
             headTrackGeometry.verticesNeedUpdate = true;
         }
     }
     **/

    isFirstUpdate = false;    
}

function update(dt)
{
    var currentTimeMillis = currentTime * 1000.0;

    //resize();
    //camera.setLens(kCameraLens);
    //camera.updateProjectionMatrix();

/*
    // Animate current active scene
    //
    PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );
    if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished()
        && ( ! PX.AnimSceneArray[ PX.currentAnimIndex ].isInteractive )
        )
    {
        //console.log( "+--+  Animation is complete" );        

        PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
        if( PX.currentAnimIndex < PX.AnimSceneArray.length-1 )
            PX.currentAnimIndex++;
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].startTime = currentTimeMillis;
    }
*/

    // Update controls
    //
    controls.update( dt );


    // Save head positions every nth time
    //
    SaveHeadTrackedPositions( dt );


    // DEBUG gyro info
    if( IsReleaseMode === 0 )
    {
        if( controls.isPhoneAvailable )
        {
            $("#topbar").text( "1) " + headRight.x + " -- " + headRight.y + " -- " + headRight.z + " // " + THREE.Math.radToDeg(controls.orient) );
        }
        else
        {
            $("#topbar").text( "2) " + headDir.x );
        }        
    }


    // SH000 Control 
    //
    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH000" )
    {
        //var welcomeObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "welcome" );
        var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "start" );
        var userObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "user" );
        var userObjDepthDistance = 350.0;

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            /*/
            welcomeObj.material.opacity = Math.sin( currentTime * 0.5 );
            startObj.scale.set( 0.001, 0.001, 0.001 );
            userObj.scale.set( 0.001, 0.001, 0.001 );
            if( welcomeObj.material.opacity < 0.0 )
            {
                welcomeObj.material.opacity = 0.0;
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
            }
            /*/
            startObj.scale.set( 0.001, 0.001, 0.001 );
            userObj.scale.set( 0.001, 0.001, 0.001 );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
            /**/
        } 
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            userObj.position.x = camera.position.x - headDir.x * userObjDepthDistance;
            userObj.position.y = camera.position.y - headDir.y * userObjDepthDistance;
            userObj.position.z = camera.position.z - headDir.z * userObjDepthDistance;

            startObj.scale.x += frameTime*2;
            startObj.scale.y += frameTime*2;
            startObj.scale.z += frameTime*2;
            userObj.scale.x += frameTime;
            userObj.scale.y += frameTime;
            userObj.scale.z += frameTime;
            // Small trick for weird scale effect
            //userObj.scale.x += userObj.scale.x;
            userObj.scale.y += userObj.scale.y;

            startObj.scale.x = PX.Clamp( startObj.scale.x, 0.001, 1.0 );
            startObj.scale.y = PX.Clamp( startObj.scale.y, 0.001, 1.0 );
            startObj.scale.z = PX.Clamp( startObj.scale.z, 0.001, 1.0 );
            userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
            userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
            userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

            if( startObj.scale.x >= 1.0 
                && userObj.scale.x >= 1.0 
                )
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
        }
        else
        {
            userObj.position.x = camera.position.x - headDir.x * userObjDepthDistance;
            userObj.position.y = camera.position.y - headDir.y * userObjDepthDistance;
            userObj.position.z = camera.position.z - headDir.z * userObjDepthDistance;

            // Check Start and User meshes if they collide
            // If so, grow User slowly and change material color
            //
            var dir = userObj.position.clone();
            dir.subVectors( userObj.position, startObj.position );
            var dirLen = dir.length();
            var scaleSpeed = 0.33 * 4;
            if( dirLen < 5*3.5 
                && PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2
                )
            {
                if( userObj.scale.x < 2.5 )
                {
                    userObj.scale.x += frameTime * scaleSpeed;
                    userObj.scale.y += frameTime * scaleSpeed;
                    userObj.scale.z += frameTime * scaleSpeed;                
                }
            } 
            else
            {
                userObj.scale.x -= frameTime * scaleSpeed * 3;
                userObj.scale.y -= frameTime * scaleSpeed * 3;
                userObj.scale.z -= frameTime * scaleSpeed * 3;
            }


            if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
            {
                userObj.scale.x = PX.Clamp( userObj.scale.x, 1.0, userObj.scale.x );
                userObj.scale.y = PX.Clamp( userObj.scale.y, 1.0, userObj.scale.y );
                userObj.scale.z = PX.Clamp( userObj.scale.z, 1.0, userObj.scale.z );            
            } 
            else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 3 )
            {
                userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, userObj.scale.x );
                userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, userObj.scale.y );
                userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, userObj.scale.z );

                startObj.scale.x -= frameTime * scaleSpeed * 3;
                startObj.scale.y -= frameTime * scaleSpeed * 3;
                startObj.scale.z -= frameTime * scaleSpeed * 3;
                startObj.scale.x = PX.Clamp( startObj.scale.x, 0.001, startObj.scale.x );
                startObj.scale.y = PX.Clamp( startObj.scale.y, 0.001, startObj.scale.y );
                startObj.scale.z = PX.Clamp( startObj.scale.z, 0.001, startObj.scale.z );
                if( userObj.scale.x <= 0.001 )
                {
                    // Change scene state
                    PX.AnimSceneArray[ PX.currentAnimIndex ].state = 4;
                }
            }
        
            // Change material color
            //
            var scaleStep = 0.3;
            if( userObj.scale.x >= 1+scaleStep*0 && userObj.scale.x < 1+scaleStep*1 )
            {
                // Grey 117/120/123
                userObj.material.color.r = 117 / 255;
                userObj.material.color.g = 120 / 255;
                userObj.material.color.b = 123 / 255;
            }
            else if( userObj.scale.x >= 1+scaleStep*1 && userObj.scale.x < 1+scaleStep*2 )
            {
                // Blue 66/133/244
                userObj.material.color.r = 66 / 255;
                userObj.material.color.g = 133 / 255;
                userObj.material.color.b = 244 / 255;
            }
            else if( userObj.scale.x >= 1+scaleStep*2 && userObj.scale.x < 1+scaleStep*3 )
            {
                // Yellow 244/180/0
                userObj.material.color.r = 244 / 255;
                userObj.material.color.g = 180 / 255;
                userObj.material.color.b = 0;
            }
            else if( userObj.scale.x >= 1+scaleStep*3 && userObj.scale.x < 1+scaleStep*4 )
            {
                // Red 219/68/55
                userObj.material.color.r = 219 / 255;
                userObj.material.color.g = 68 / 255;
                userObj.material.color.b = 55 / 255;
            }
            else if( userObj.scale.x >= 1+scaleStep*4 && userObj.scale.x < 1+scaleStep*5 )
            {
                // Green 15/157/88
                userObj.material.color.r = 15 / 255;
                userObj.material.color.g = 157 / 255;
                userObj.material.color.b = 88 / 255;
            }
            else if( userObj.scale.x >= 1+scaleStep*5 )
            {
                // Set state for end animation
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 3;
            }


            if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 4 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
                
                PX.currentAnimName = "SH010_RtoL";
                PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );

                PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
                PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
                //progressBarElement.text( "switch scene to: " + PX.AnimSceneArray[ PX.currentAnimIndex ].name );            
            }
        }
    }


    if( PX.currentAnimName === "SH010_LtoR"
        || PX.currentAnimName === "SH010_RtoL" )
    {
        var as = PX.AnimSceneArray[ PX.currentAnimIndex ];
        var lSphere = null;
        var rSphere = null;
        //PX.AnimSceneArray[ PX.currentAnimIndex ].autoCountTime += dt;
        ////console.log( PX.AnimSceneArray[ PX.currentAnimIndex ].autoCountTime );
        //if( PX.AnimSceneArray[ PX.currentAnimIndex ].autoCountTime >= PX.AnimSceneArray[ PX.currentAnimIndex ].autoTriggerTime 
        //    && PX.AnimSceneArray[ PX.currentAnimIndex ].state == 0 )
        //{
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
        //}


        // First setup the scene for entrance animation
        //
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            lSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "b1_Rsphere" );            
            lSphere.scale.set( 0, 0, 0 );
            rSphere.scale.set( 0, 0, 0 );

            var tTime = ( currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime ) * 0.001;
            var textMesh = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "worktogether" );
            textMesh.material.opacity = Math.sin( tTime * 0.7 );
            if( textMesh.material.opacity < 0.0 )
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
        }

        // Do entrance animation. Simply scale up circles to 1
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            lSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "b1_Rsphere" );            

            var sh010ScaleSpeed = 2.0;
            lSphere.scale.x += frameTime * sh010ScaleSpeed;
            lSphere.scale.y += frameTime * sh010ScaleSpeed;
            lSphere.scale.z += frameTime * sh010ScaleSpeed;
            rSphere.scale.x += frameTime * sh010ScaleSpeed;
            rSphere.scale.y += frameTime * sh010ScaleSpeed;
            rSphere.scale.z += frameTime * sh010ScaleSpeed;

            // Clamp values
            lSphere.scale.x = PX.Saturate( lSphere.scale.x );
            lSphere.scale.y = PX.Saturate( lSphere.scale.y );
            lSphere.scale.z = PX.Saturate( lSphere.scale.z );
            rSphere.scale.x = PX.Saturate( rSphere.scale.x );
            rSphere.scale.y = PX.Saturate( rSphere.scale.y );
            rSphere.scale.z = PX.Saturate( rSphere.scale.z );

            // When it hits maximum scale, switch state
            if( lSphere.scale.x >= 1.0 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
            }
        }

        // This state is interactive. Tilt your head to make circles overlap
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
        {
            var angle = 0.0;
            if( controls.isPhoneAvailable )
            {
                angle = headRight.y;
                //angle = controls.beta;
            }
            else
            {
                angle = headDir.x;
            }

            // 0 is left, 1 is right
            for( var i=0; i<2; i++ )
            {
                as.physics[i].accel.set( angle * dt * 10.0, 0, 0 );

                as.physics[i].vel.x += as.physics[i].accel.x;
                as.physics[i].vel.y += as.physics[i].accel.y;
                as.physics[i].vel.z += as.physics[i].accel.z;

                as.physics[i].vel.multiplyScalar( as.physics[i].damp );
                as.physics[i].accel.set( 0, 0, 0 );
            }

            lSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "b1_Rsphere" );

            //if( lSphere && rSphere )
            {
                if( controls.isPhoneAvailable )
                {
                    lSphere.position.x -= as.physics[0].vel.x;
                    rSphere.position.x -= as.physics[1].vel.x;                    
                } 
                else
                {
                    lSphere.position.x -= as.physics[0].vel.x;
                    rSphere.position.x -= as.physics[1].vel.x;
                }

                if( lSphere.position.x < -40 
                    || lSphere.position.x > 40 )
                {
                    as.physics[0].vel.x *= -1 * 0.85;
                }
                if( rSphere.position.x < -40 
                    || rSphere.position.x > 40 )
                {
                    as.physics[1].vel.x *= -1 * 0.85;
                }
            }

            // Switch state to change scene
            if( Math.abs( lSphere.position.x - rSphere.position.x ) <= 5 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 4;
            }
        }

/***
        var tiltTriggerAngle = 0.25;
        var angle = controls.beta;
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 && angle <= -tiltTriggerAngle )
        {
            //progressBarElement.text("left inclined  " + PX.AnimSceneArray[ PX.currentAnimIndex ].name );

            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH010_RtoL";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 && angle >= tiltTriggerAngle )
        {
            //progressBarElement.text("right inclined  " + PX.AnimSceneArray[ PX.currentAnimIndex ].name );
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH010_LtoR";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
        }

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );                        
            //console.log( PX.AnimSceneArray[ PX.currentAnimIndex ].animationInfoArray[0].position + " -- " + (currentTimeMillis-PX.AnimSceneArray[ PX.currentAnimIndex ].startTime) );
        }

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished()
            && ( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 ) 
            )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 4;
        }
***/
    
        // Switch scenes now
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 4 )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH020";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
            //console.log( PX.AnimSceneArray[ PX.currentAnimIndex ].scene.position );
        }
    }

    // SH020: Explosion, etc.
    if( PX.currentAnimName === "SH020" )
    {
        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );


        // Orient all cubes to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
            if( so.name.substr( 1, 4 ) === "Cube" )
            {
                so.lookAt( camera.position ); 
            }
        }
        //// Orient all texts to face the camera
        ////
        //for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        //{
        //    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
        //    if( so.name.substr( 0, 4 ) === "txt_" )
        //    {
        //        console.log( so.name );
        //        so.lookAt( camera.position ); 
        //    }
        //}

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH060B_070B";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        }
    }

    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH060B_070B" )
    {
        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );

        //// Orient all texts to face the camera
        ////
        //for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        //{
        //    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
        //    if( so.name.substr( 0, 4 ) === "txt_" )
        //    {
        //        so.lookAt( camera.position ); 
        //    }
        //}

        //
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].mesh != null )
        {
            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges.length; i++ )
            {
                var animEdge = PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges[ i ];

                if( animEdge.ai != -1 && animEdge.bi != -1 )
                {
                    var pointToCamA = animEdge.a.position.clone().normalize();
                    var pointToCamB = animEdge.b.position.clone().normalize();

                    var dotA = headDir.clone().dot( pointToCamA );
                    var dotB = headDir.clone().dot( pointToCamB );
                    //console.log( dotA, dotB );
                    if( dotA < -0.97
                        && dotB < -0.97
                        && animEdge.a.scale.x > 0.991 
                        && animEdge.b.scale.x > 0.991 
                        && (!animEdge.active)
                        )
                    {
                        animEdge.active = true;
                        animEdge.t = THREE.Math.randFloat( -0.5, -0.1 );
                    }

                    if( animEdge.active === true )
                    {
                        animEdge.t += frameTime * 4.0;
                        var newP = new THREE.Vector3();
                        PX.LerpVector3( newP, animEdge.av, animEdge.bv, PX.Saturate( animEdge.t ) );
                        //console.log( animEdge.t );
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.ai ] = animEdge.av;
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.bi ] = newP;

                        // Color the target circle
                        if( animEdge.t >= 1.0 
                            && animEdge.b.name !== "gSph1" )
                        {
                            animEdge.b.material.color.r = animEdge.b.material.destR;
                            animEdge.b.material.color.g = animEdge.b.material.destG;
                            animEdge.b.material.color.b = animEdge.b.material.destB;
                        }
                    } 
                    else
                    {
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.ai ] = animEdge.av;
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.bi ] = animEdge.av;
                    }

                }
            }
            PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.verticesNeedUpdate = true;

            var ttt = currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime;
            var triggerTime = 15000; //( ( ( 330.0 * 24.0 ) * frameTime ) * 1000 );
            //console.log( triggerTime, frameTime );
            if( ttt > triggerTime )
            {
                /*var rSph1Mesh = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "rSph21" );
                rSph1Mesh.material.color.r = 219 / 255;
                rSph1Mesh.material.color.g = 68 / 255;
                rSph1Mesh.material.color.b = 55 / 255;*/

                PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity -= frameTime * 2.0;
                PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity = PX.Saturate( PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity );
            }
        }
    }
}


function render()
{
    renderer.autoClear = false;
    effect.render( scene, camera );

    // fbScene also used to render the vertical line that splits the 2 eye views
    //if( ! renderTrackingIn3D )
    {
        renderer.setViewport( 0, 0, windowWidth, windowHeight );
        renderer.render( fgScene, fgCamera );
    }
}

function animate()
{
    requestAnimationFrame(animate);

    frameTime = clock.getDelta() * PX.kGlobalTimeScale;
    update( frameTime );
    render();

    currentTime = clock.getElapsedTime() * PX.kGlobalTimeScale;
    //currentTime += frameTime;
}

function resize()
{
    //var dpr = window.devicePixelRatio;
    var width = window.innerWidth; // * dpr;
    var height = window.innerHeight; // * dpr;

    windowWidth = width;
    windowHeight = height;

    //progressBarElement.text( width*deviceContentScale + " x " + height*deviceContentScale );
    console.log( "resize: ", width, height );

    camera.aspect = width / height;
    //camera.setLens( kCameraLens );
    camera.updateProjectionMatrix();

    //renderer.setSize( width, height );
    //renderer.setViewport( 0, 0, width, height );
    effect.setSize( width, height );
}
