/* global THREE: true } */

var PX = PX || {}; 

var progressBarElement = $("#progressBar");
var progressBarTextElement = $("#progressBarText");
var startButtonElement = $("#startButton");


var IsReleaseMode = 1;
var camera, scene, renderer;
var effect, controls;
var element, container;
var windowWidth, windowHeight;
var deviceContentScale = 1.0;

var fgCamera;
var fgScene;

var currentTime = 0.0;
var previousTime = 0.0;
var frameTime = 0.0;
var frameRate = 0;
var frameRateTimeCount = 0.0;
var frameCount = 0;
var clock = new THREE.Clock();

var headTrackGeometry;
var headTrackMaterial;
var headTrackMesh;

var isFirstUpdate = true;


THREE.DefaultLoadingManager.onProgress = function (item, loaded, total)
{
    var str = parseInt( ( loaded / total ) * 100 ) + " %";
    progressBarTextElement.text(str);
    if( IsReleaseMode === 0 )
    {
        console.log( item, loaded, total );
        $("#topbar").text( item );        
    }
};


var uniqueSceneObjectsArray = [];
function HasUniqueSceneObjectByName( objName )
{
    for( var i=0; i<uniqueSceneObjectsArray.length; i++ )
    {
        if( uniqueSceneObjectsArray[i].name === objName )
            return true;
    }    
    return false;
}

function GetUniqueSceneObjectByName( objName )
{
    for( var i=0; i<uniqueSceneObjectsArray.length; i++ )
    {
        if( uniqueSceneObjectsArray[i].name === objName )
            return uniqueSceneObjectsArray[i];
    }    
    return null;
}


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


//// KEEP PHONE AWAKE: IOS Safari
//iosSleepPreventInterval = setInterval(function () 
//{
//    if( IsReleaseMode > 0 )
//    {
//        window.location.href = "/new/page";
//        window.setTimeout(function () 
//        {
//                window.stop();
//        }, 0 );        
//    }
//}, 20000 );


function ConvertPosToLatLon(x, y, z, radius)
{
//    var lat = 90.0 - (Math.acos(y / radius)) * 180.0 / Math.PI;
//    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0) - 180.0;
    var lat = (Math.acos(y / radius)) * 180.0 / Math.PI;
    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0);
    return new THREE.Vector2( lat, lon );
}


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
        LoadSceneData( "SH010_RtoL", "animations/sh010_RtoL_sphere.js")
        //, LoadSceneData( "SH010_LtoR", "animations/sh010_LtoR_sphere_01.js")
        , LoadSceneData( "SH020", "animations/sh020-60b.js")
        , LoadSceneData( "SH060B_070B", "animations/sh060b-070b.js")
        , LoadSceneData( "SH070B_080D", "animations/sh070b-080d.js")
        , LoadSceneData( "SH080D", "animations/sh080d.js")
        //, LoadSceneData( "SH090A_100I", "animations/sh090a-090b.js")
        , LoadSceneData( "SH090A_110B", "animations/sh090a-110b.js")
        //, LoadSceneData( "SH100I_110A", "animations/sh100i-110a.js")
        , LoadJsonData( "SH010_RtoL_anim", "animations/sh010_RtoL_sphere.fbx.js" )
        //, LoadJsonData( "SH010_LtoR_anim", "animations/sh010_LtoR_sphere_01.fbx.js" )
        , LoadJsonData( "SH020_anim", "animations/sh020-60b.fbx.js" )
        , LoadJsonData( "SH060B_070B_anim", "animations/sh060b-070b.fbx.js" )
        , LoadJsonData( "SH070B_080D_anim", "animations/sh070b-080d.fbx.js" )
        , LoadJsonData( "SH080D_anim", "animations/sh080d.fbx.js" )
        //, LoadJsonData( "SH090A_100I_anim", "animations/sh090a-090b.fbx.js" )
        , LoadJsonData( "SH090A_110B_anim", "animations/sh090a-110b.fbx.js" )
        //, LoadJsonData( "SH100I_110A_anim", "animations/sh100i-110a.fbx.js" )
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
                $("#gif").hide();
                progressBarElement.hide();
                progressBarTextElement.hide();
                
                $("#startButton").css("display","block"); //added by me - ADI
                
                
                startButtonElement.delay( 500 ).fadeTo( 1000, 1 ).delay( 250, function ()
                {
                    startButtonElement.on( "click", function( e )
                    {
                        console.log( "+--+  Finished loading. DoIt()" );

                        startButtonElement.dequeue();
                        startButtonElement.fadeTo( 2000, 0 ).delay( 500, function ()
                        {
                            $("#progress").hide();
                            startButtonElement.hide();
                            progressBarElement.empty();
                            progressBarTextElement.empty();
                            DoIt();
                        } );
                        
                        $("#teamwork_footer").hide(); //added by me - ADI
                        $("#main_container_id").hide();

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
        //PX.currentAnimName = "SH010_RtoL";
        //PX.currentAnimName = "SH020";
        //PX.currentAnimName = "SH060B_070B";
        //PX.currentAnimName = "SH070B_080D";
        PX.currentAnimName = "SH080D";
        //PX.currentAnimName = "SH090A_110B";
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
    worktogetherMesh.position.z = 350.0;
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
    console.log( "Edge count: ", scene000.meshEdgeList.length );

    //for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
    //{
    //    var so = scene000.sceneObjectsArray[ k ];
    //    console.log( "obj ", so.name, so.position );
    //}


/***
    // Remove duplicate edges
    //
    var duplicatesArray = [];
    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    {
        var edge = scene000.meshEdgeList[ j ];

        for( var k=j+1; k<scene000.meshEdgeList.length; k++ )
        {
            var edge2 = scene000.meshEdgeList[ k ];

            //// It can be reverse order too
            if( edge.ai === edge2.bi && edge.bi === edge2.ai )
            //if( edge.bi === edge2.bi )
            {
                duplicatesArray.push( j );
                //console.log( "duplicate: ", k );
                break;
            }
        }
    }

    console.log( "scene000.meshEdgeList.length before : ", scene000.meshEdgeList.length, duplicatesArray.length );
    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    {
        if( duplicatesArray[i] !== j )
            scene000.uniqueMeshEdgeList.push( scene000.meshEdgeList[j] );
    }
    console.log( "scene000.meshEdgeList.length after : ", scene000.meshEdgeList.length );
    console.log( "scene000.uniqueMeshEdgeList.length after : ", scene000.uniqueMeshEdgeList.length );
***/    

    // Create AnimEdges
    //
    var minDistanceSq = 10*10;

    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    //for( var j=0; j<scene000.uniqueMeshEdgeList.length; j++ )
    {
        var edge = scene000.meshEdgeList[ j ];
        //var edge = scene000.uniqueMeshEdgeList[ j ];

        var tempA = null;
        var tempB = null;
        var tempAi = -1;
        var tempBi = -1;

        // Find circle A
        //var hasfound = false;
        for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
        {
            var so = scene000.sceneObjectsArray[ k ];
            if( so.name.substr( 1, 3 ) === "Sph" )
            {
                //console.log( so.name );
                var distA = so.position.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.ai ] ).lengthSq();
                //console.log( distA );
                if( distA <= minDistanceSq )
                {
                    tempA = so;
                    tempAi = edge.ai;
                    //hasfound = true;
                    //break;
                }

                var distB = so.position.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.bi ] ).lengthSq();
                if( distB <= minDistanceSq )
                {
                    tempB = so;
                    tempBi = edge.bi;
                    //hasfound = true;
                    //break;
                }
            }
        }
        //if( tempA !== null )
        //    console.log( "1- ", tempA.name );
        //else
        //    console.log( "1- not found" );
        //if( tempB !== null )
        //    console.log( "2- ", tempB.name );
        //else
        //    console.log( "2- not found" );

        if( tempAi !== -1 && tempBi !== -1 )
        {
            var animEdge = new PX.AnimEdge();
            animEdge.a = tempA;
            animEdge.b = tempB;
            animEdge.ai = tempAi;
            animEdge.bi = tempBi;
            animEdge.av = meshGeoSphereRef.geometry.vertices[ tempAi ].clone();
            animEdge.bv = meshGeoSphereRef.geometry.vertices[ tempBi ].clone();
            scene000.animEdges.push( animEdge );
        }
    }
    console.log( "AnimEdge count: ", scene000.animEdges.length );


    // Create new geosphere mesh with animated edges
    //
    scene000.meshGeometry = new THREE.Geometry();
    scene000.meshGeometry.dynamic = true;
    //i = 0;
    for( i=0; i<scene000.animEdges.length; i++ )
    {
        var animEdge = scene000.animEdges[i];
        if( animEdge.ai !== -1 && animEdge.bi !== -1 )
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


    //// SH090A_110B
    //// change material for spheres numbered 1 to double sided
    ////
    //var sceneSH090A_110B = FindSceneByName( "SH090A_110B" );
    //for( var i=0; i<sceneSH090A_110B.sceneObjectsArray.length; i++ )
    //{
    //    var so = sceneSH090A_110B.sceneObjectsArray[i];

    //    if( so.name === "rSph1" 
    //        || so.name === "gSph1" 
    //        || so.name === "bSph1" 
    //        || so.name === "ySph1" 
    //        )
    //    {
    //        so.material.side = THREE.DoubleSide;
    //        //console.log( so.name, "changed material to double sided" );
    //    }
    //}

/**    var sceneSH100I_110A = FindSceneByName( "SH100I_110A" );
    for( var i=0; i<sceneSH100I_110A.sceneObjectsArray.length; i++ )
    {
        var so = sceneSH100I_110A.sceneObjectsArray[i];

        if( so.name === "rSph14" 
            )
        {
            so.material.side = THREE.DoubleSide;
            //console.log( so.name, "changed material to double sided" );
        }
    }**/


    // DEBUG: Show all objects per scene and total
    //
    var total = 0;
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        var as = PX.AnimSceneArray[i];
        total += as.sceneObjectsArray.length;
        console.log( "+--+ Total objects for scene ", as.name, as.sceneObjectsArray.length );
    }
    console.log( "+--+ Total objects for all scenes", total );

    total = 0;
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        var as = PX.AnimSceneArray[i];
        for( var k=0; k<as.sceneObjectsArray.length; k++ )
        {
            var so = as.sceneObjectsArray[k];
            if( ! HasUniqueSceneObjectByName( so.name ) )
            {
                uniqueSceneObjectsArray.push( so );
                total++;
            }
        }
    }

    //for( i=0; i<uniqueSceneObjectsArray.length; i++ )
    //{
    //    console.log( "+--+ ", uniqueSceneObjectsArray[i].name );        
    //}
    console.log( "+--+ Total unique objects for all scenes", total );


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

    PX.cameraFrustum = new THREE.Frustum();
    PX.cameraFrustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

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
    //PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
    for( var ii=0; ii<PX.AnimSceneArray.length; ii++ )
    {
        scene.add( PX.AnimSceneArray[ ii ].scene );
        PX.AnimSceneArray[ ii ].HideAll( scene );
    }
    PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
    
    

    /*
    // TESTBED: Attempt to get everything together in one scene and leave duplicated behind
    //

    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        scene.remove( PX.AnimSceneArray[i].scene );
    }

    for( var i=0; i<uniqueSceneObjectsArray.length; i++ )
    {
        scene.add( uniqueSceneObjectsArray[i] );
    }

    // Remove child scenes and attach main scene to every AnimScene
    // Also replace object array refs to the ones from the main scene
    var objcount = 0;
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        var as = PX.AnimSceneArray[i];
        as.scene = scene;

        for( var k=0; k<as.sceneObjectsArray.length; k++ )
        {
            var so2 = GetUniqueSceneObjectByName( as.sceneObjectsArray[k].name );
            if( so2 !== null )
            {
                as.sceneObjectsArray[k] = so2;
                objcount++;
            } else
            {
                console.log( "****  couldnt find", as.sceneObjectsArray[k].name );
            }
        }
    }
    console.log( "objcount: ", objcount );
*/


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


    //// DEBUG gyro info
    //if( IsReleaseMode === 0 )
    //{
    //    if( controls.isPhoneAvailable )
    //    {
    //        $("#topbar").text( "1) " + headRight.x + " -- " + headRight.y + " -- " + headRight.z + " // " + THREE.Math.radToDeg(controls.orient) );
    //    }
    //    else
    //    {
    //        $("#topbar").text( "2) " + headDir.x );
    //    }        
    //}

    //var frustumMat = new THREE.Matrix4();
    //frustumMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    ////console.log( frustumMat );
    //PX.cameraFrustum.setFromMatrix( frustumMat );
    //var counter = 0;
    //for( var ii=0; ii<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; ii++ )
    //{
    //    if( PX.cameraFrustum.containsPoint( PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ii].position ) )
    //    {
    //        //PX.AnimSceneArray[ PX.currentAnimIndex ].animationTracks[ii].dirty = true;
    //        //console.log( "visible", ii );
    //        counter++;
    //    } 
    //    else
    //    {
    //        //PX.AnimSceneArray[ PX.currentAnimIndex ].animationTracks[ii].dirty = true;
    //        //console.log( "not visible", ii );
    //    }
    //}
    //console.log( "visible", counter, PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length );


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
            //userObj.scale.y += userObj.scale.y;

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
                if( userObj.scale.x < 0.001 ) userObj.scale.x = 0.001;
                if( userObj.scale.y < 0.001 ) userObj.scale.y = 0.001;
                if( userObj.scale.z < 0.001 ) userObj.scale.z = 0.001;
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


    if( PX.currentAnimName === "SH010_RtoL" 
        //|| PX.currentAnimName === "SH010_LtoR"
        )
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
            lSphere.scale.set( 0.001, 0.001, 0.001 );
            rSphere.scale.set( 0.001, 0.001, 0.001 );

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

        lSphere.updateMatrix();
        rSphere.updateMatrix();
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
        //// Orient all texts to face the camera
        ////
        //for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        //{
        //    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
        //    if( so.name.substr( 0, 4 ) === "txt_" )
        //    {
        //        so.lookAt( camera.position ); 
        //        so.updateMatrix();
        //    }
        //}

        var sceneTime = currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime;

        if( ! PX.AnimSceneArray[ PX.currentAnimIndex ].isPaused )
            PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );


        //
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].mesh !== null )
        {
            //var lastSphereToScale = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "rSph1" );
            var lastSphereToScale = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "gSph28" );
            var rSph1 = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "rSph1" );
            var rSph1Conn = null; 
            //var connsCount = 0;
            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges.length; i++ )
            {
                var animEdge = PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges[ i ];

                if( animEdge.ai !== -1 
                    && animEdge.bi !== -1 
                    )
                {
                    if( rSph1.name === animEdge.b.name )
                    {
                        rSph1Conn = animEdge;
                        //console.log( "rSph1 conn found" );
                    }

                    var pointToCamA = animEdge.a.position.clone().normalize();
                    var pointToCamB = animEdge.b.position.clone().normalize();

                    var dotA = headDir.clone().dot( pointToCamA );
                    var dotB = headDir.clone().dot( pointToCamB );
                    //console.log( dotA, dotB );
                    if( dotA < -0.96
                        && dotB < -0.96
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
                            //connsCount++;
                        }

                        //// Popup effect on connection
                        //if( phy.changed )
                        //{
                        //    so.scale.x -= frameTime*0.7;
                        //    so.scale.y -= frameTime*0.7;
                        //    so.scale.z -= frameTime*0.7;
                        //    PX.ClampVector3( so.scale, 1.0, 1.5 );
                        //}

                    } 
                    else
                    {
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.ai ] = animEdge.av;
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.bi ] = animEdge.av;
                    }
                } 
                else
                {
                    console.log( " animEdge has an invalid connection. bail out" );
                }
            }
            PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.verticesNeedUpdate = true;


            // when it reaches a certain point in anim, pause it and move to next state
            // HARDCODED: scale threshold
            if( lastSphereToScale.scale.x >= 1.268
                && PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0
                )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].isPaused = true;
                PX.AnimSceneArray[ PX.currentAnimIndex ].pauseStartTime = currentTimeMillis;
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
                //console.log( "state 1", currentTimeMillis );
            }

            // Only when last red sphere is connected that it moves on with animation
            //console.log( connsCount, PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges.length );
            if( rSph1Conn.active
                && PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1
                //&& connsCount === (PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges.length-3)
                )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].isPaused = false;
                PX.AnimSceneArray[ PX.currentAnimIndex ].startTime += ( currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].pauseStartTime );
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
                //console.log( "state 2" );
            }

            if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
            {
                //var rSph1Mesh = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "rSph21" );
                //rSph1Mesh.material.color.r = 219 / 255;
                //rSph1Mesh.material.color.g = 68 / 255;
                //rSph1Mesh.material.color.b = 55 / 255;

                PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity -= frameTime * 1.0;
                PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity = PX.Saturate( PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.material.opacity );
            }
        }

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH070B_080D";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        }
    }

    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH070B_080D" )
    {
        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            //console.log( "switch to SH080D" );
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH080D";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        }

        //// Orient all texts to face the camera
        ////
        //for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        //{
        //    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
        //    if( so.name.substr( 1, 3 ) === "Dsk" )
        //    {
        //        so.lookAt( camera.position ); 
        //        so.updateMatrix();
        //    }
        //}
    }

    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH080D" )
    {
        //PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
            {
                var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[i];

                var tmpMat = so.material.clone();

                // Color all circles expect 4 of them that comes from last scene
                if( so.name !== "rDsk1"
                    && so.name !== "gDsk1"
                    && so.name !== "bDsk1"
                    && so.name !== "yDsk1"
                    )
                {
                    // Grey 117/120/123
                    so.material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
                    so.material.side = THREE.DoubleSide;
                    so.material.color.r = 117 / 255;
                    so.material.color.g = 120 / 255;
                    so.material.color.b = 123 / 255;
                } else
                {
                    so.material.side = THREE.DoubleSide;                    
                }

                so.material.destR = tmpMat.color.r;
                so.material.destG = tmpMat.color.g;
                so.material.destB = tmpMat.color.b;

                PX.AnimSceneArray[ PX.currentAnimIndex ].physics[i].originalPos = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[i].position.clone();
            }

            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            // Apply physics
            var minRadius = 300.0;

            if( PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionFirstTime )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos = headDir.clone().multiplyScalar( -minRadius );
                PX.AnimSceneArray[ PX.currentAnimIndex ].prevRepulsionPos = PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos.clone();
                PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionFirstTime = false;
            } 
            else
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].prevRepulsionPos = PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos.clone();
                PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos = headDir.clone().multiplyScalar( -minRadius );
            }
            var repDir = PX.AnimSceneArray[ PX.currentAnimIndex ].prevRepulsionPos.sub( PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos );
            var repDirNorm = repDir.clone().normalize();
            var repLen = PX.Saturate( repDir.lengthSq() * 10 );

            var repulsionPos = PX.AnimSceneArray[ PX.currentAnimIndex ].repulsionPos;
            var dotAAA = repulsionPos.clone().normalize().dot( PX.ZAxis );
            var aaaPlus = PX.Saturate( dotAAA * 8 ) + 0.01;
            var minRadius2 = minRadius * 0.15 * repLen; // * aaaPlus;


            if( ! PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorFlag )
                PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius += (repLen*1.0);
            // // Some auto mode for increasing the colorize area. Increases area based on time 
            //PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius = ( currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime ) * 0.001;
            //PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius *= (5.0 + (1+repLen));
            if( repLen > 0.5
                && ! PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorFlag )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorFlag = true;
            }
            else if( PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorFlag )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius += frameTime*10;
            }

            var minmin = PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius*PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius;
            //console.log( minmin );

            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
            {
                var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[i];
                var soPos = so.position;
                var phy = PX.AnimSceneArray[ PX.currentAnimIndex ].physics[ i ];

                var dx = soPos.x - repulsionPos.x;
                var dy = soPos.y - repulsionPos.y;
                var dz = soPos.z - repulsionPos.z;

                var distanceSqr = ( dx*dx + dy*dy + dz*dz );
                var autoDistanceSqr = ( dx*dx + dy*dy );

                if( distanceSqr <= minRadius2*minRadius2 
                    || autoDistanceSqr <= minmin
                    && phy.changed === false
                    )
                {
                    var invd = ( 1.0 / distanceSqr );
                    dx *= invd;
                    dy *= invd;
                    dz *= invd;

                    phy.accel.x += dx * 1.2 * 3.5;
                    phy.accel.y += dy * 1.2 * 3.5;
                    phy.accel.z += dz * 1.2 * 3.5;
                } 
                else
                {
                    phy.accel.x += ( phy.originalPos.x - soPos.x ) * 0.0015;
                    phy.accel.y += ( phy.originalPos.y - soPos.y ) * 0.0015;
                    phy.accel.z += ( phy.originalPos.z - soPos.z ) * 0.0015;
                }

                phy.vel.x += phy.accel.x;
                phy.vel.y += phy.accel.y;
                phy.vel.z += phy.accel.z;
                //phy.vel.x = PX.Clamp( phy.vel.x, -0.5, 0.5 );
                //phy.vel.y = PX.Clamp( phy.vel.y, -0.5, 0.5 );
                //phy.vel.z = PX.Clamp( phy.vel.z, -0.5, 0.5 );

                soPos.x += phy.vel.x;
                soPos.y += phy.vel.y;
                soPos.z += phy.vel.z;
                soPos = soPos.normalize();
                soPos.x *= minRadius;
                soPos.y *= minRadius;
                soPos.z *= minRadius;

                phy.vel.multiplyScalar( phy.damp );
                phy.accel.set( 0, 0, 0 );

                // Color based on velocity
                var ddd = 0.3;
                if( phy.vel.lengthSq() > ddd*ddd
                    && phy.changed === false
                    )
                {
                    so.material.color.r = so.material.destR;
                    so.material.color.g = so.material.destG;
                    so.material.color.b = so.material.destB;
                    so.scale.set( 1.5, 1.5, 1.5 );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].activeCircleCount++;
                    phy.changed = true;
                    //console.log( so.material.destR, so.material.destG, so.material.destB );
                }

                // Auto color
                if( autoDistanceSqr <= minmin
                    && phy.changed === false
                    )
                {
                    so.material.color.r = so.material.destR;
                    so.material.color.g = so.material.destG;
                    so.material.color.b = so.material.destB;
                    so.scale.set( 1.5, 1.5, 1.5 );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].activeCircleCount++;
                    phy.changed = true;
                    //console.log( so.material.destR, so.material.destG, so.material.destB );
                }

                // Popup effect on connection
                if( phy.changed )
                {
                    so.scale.x -= frameTime*0.7;
                    so.scale.y -= frameTime*0.7;
                    so.scale.z -= frameTime*0.7;
                    PX.ClampVector3( so.scale, 1.0, 1.5 );
                }

                so.updateMatrix();
            }

            if( PX.AnimSceneArray[ PX.currentAnimIndex ].activeCircleCount >= (PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length-8) )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
                console.log( "switch to state 2" );
            }
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
        {
            // Apply physics
            var avgVel = 999.0;
            var minRadius = 300.0;
            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
            {
                var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[i];
                var soPos = so.position;
                var phy = PX.AnimSceneArray[ PX.currentAnimIndex ].physics[ i ];

                phy.accel.x += ( phy.originalPos.x - soPos.x ) * 0.0015;
                phy.accel.y += ( phy.originalPos.y - soPos.y ) * 0.0015;
                phy.accel.z += ( phy.originalPos.z - soPos.z ) * 0.0015;

                phy.vel.x += phy.accel.x;
                phy.vel.y += phy.accel.y;
                phy.vel.z += phy.accel.z;
                //phy.vel.x = PX.Clamp( phy.vel.x, -0.35, 035 );
                //phy.vel.y = PX.Clamp( phy.vel.y, -0.35, 035 );
                //phy.vel.z = PX.Clamp( phy.vel.z, -0.35, 035 );

                soPos.x += phy.vel.x;
                soPos.y += phy.vel.y;
                soPos.z += phy.vel.z;
                soPos = soPos.normalize();
                soPos.x *= minRadius;
                soPos.y *= minRadius;
                soPos.z *= minRadius;

                phy.vel.multiplyScalar( phy.damp );
                phy.accel.set( 0, 0, 0 );

                so.updateMatrix();

                avgVel += phy.vel.lengthSq();
            }   

            avgVel = avgVel / (PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length);
            //console.log( avgVel );
            if( avgVel <= 2.2861 )
            {
                console.log( "switch scene again" );
                PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
                PX.currentAnimName = "SH090A_110B";
                PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
                PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
                PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
            }
        }


        // Orient all disks to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
            //if( so.name.substr( 1, 3 ) === "Dsk" )
            {
                so.lookAt( camera.position );
            }
        }
    }


    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH090A_110B" )
    {
        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );

        //// Orient all disks to face the camera
        ////
        //for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        //{
        //    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
        //    if( so.name.substr( 1, 3 ) === "Dsk" )
        //    {
        //        so.lookAt( camera.position );
        //    }
        //}

        //// When finished move on to next scene
        //if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        //{
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
        //    PX.currentAnimName = "SH100I_110A";
        //    PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        //    PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        //}
    }

    //if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH100I_110A" )
    //{
    //    PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis );
    //}
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

    previousTime = currentTime;
    currentTime = clock.getElapsedTime() * PX.kGlobalTimeScale;

    update( frameTime );
    render();

    frameTime = ( currentTime - previousTime ) * PX.kGlobalTimeScale;
    frameRateTimeCount += frameTime;
    frameCount++;
    if( frameRateTimeCount >= 1.0 )
    {
        frameRateTimeCount = 0.0;
        frameRate = frameCount;
        frameCount = 0;
    }

    if( IsReleaseMode === 0 )
        $("#topbar").text( parseInt(currentTime) + " // " + frameRate + " // " + frameTime );
}

function resize()
{
    //var dpr = window.devicePixelRatio;
    var width = window.innerWidth; // * dpr;
    var height = window.innerHeight; // * dpr;

    windowWidth = width;
    windowHeight = height;

    //progressBarElement.text( width*deviceContentScale + " x " + height*deviceContentScale );
    //console.log( "resize: ", width, height );

    camera.aspect = width / height;
    //camera.setLens( kCameraLens );
    camera.updateProjectionMatrix();

    //renderer.setSize( width, height );
    //renderer.setViewport( 0, 0, width, height );
    effect.setSize( width, height );
}
