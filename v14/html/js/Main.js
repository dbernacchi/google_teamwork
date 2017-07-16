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

var gradSphereCamera;
var gradSphereScene;

var kStartButtonCount = 8;

var currentTime = 0.0;
var previousTime = 0.0;
var frameTime = 0.0;
var frameRate = 0;
var frameRateTimeCount = 0.0;
var frameCount = 0;
var clock = new THREE.Clock();

var gradSphereTexSize = 64;
var gradientShader = null;
var gradientViewShader = null;
var gradientRT = null;
var gradientState = 0;
var gradientStartTime = 0;

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
var headTrackTriggerTime = 1.0;
var headTrackCountTime = 0.0;
var headTrackSaveEnable = false;
var headTrackVertexIdx = 0;
var renderTrackingIn3D = false;
var headTrackGeometry = null;
var headTrackMaterial = null;
var headTrackMesh = null;
var headTrackPositionArray = [];  // Vector3 with XY as pos and Z as radius
var previousHeadPos = new THREE.Vector3();
var currentHeadPos = new THREE.Vector3();


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
    var lon = ((360.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0);
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



function DrawBadgeCanvas()
{
    if( headTrackPositionArray.length === 0 )
        return ;

    var canvas = document.getElementById( "BadgeCanvas" );
    var context = canvas.getContext( "2d" );
    //context.translate( 0.5, 0.5 );
    //context.mozImageSmoothingEnabled = true;
    //context.webkitImageSmoothingEnabled = true;
    //context.msImageSmoothingEnabled = true;
    //context.imageSmoothingEnabled = true;

    var vertices = new Array( headTrackPositionArray.length );
    for( var i=0; i<headTrackPositionArray.length; i++ )
    {
        p = headTrackPositionArray[i].clone();
        p.x = ( p.x * 0.5 + 0.5 ) * canvas.width;
        p.y = (1.0 - ( p.y * 0.5 + 0.5 )) * canvas.height;
        p.x = PX.Clamp( p.x, PX.kBadgeStartRadius, canvas.width-(PX.kBadgeStartRadius) );
        p.y = PX.Clamp( p.y, PX.kBadgeStartRadius, canvas.height-(PX.kBadgeStartRadius) );

        vertices[i] = [ p.x, p.y ];
    }
    var triangles = Delaunay.triangulate(vertices );


    // Draw background
    //
    context.fillStyle = '#ffffff';
    context.fillRect( 0, 0, canvas.width, canvas.height );


    for( i = triangles.length; i; ) 
    {
        context.beginPath();
        --i; 
        context.moveTo( vertices[ triangles[i] ][0], vertices[ triangles[i] ][1] );
        --i; 
        context.lineTo( vertices[ triangles[i] ][0], vertices[ triangles[i] ][1] );
        --i; 
        context.lineTo( vertices[ triangles[i] ][0], vertices[ triangles[i] ][1] );
        context.closePath();
        context.lineWidth = 1;
        context.fillStyle = "#75787B";
        context.stroke();
    }

/*
    // Draw connectors
    //
    //context.beginPath();
    var p = headTrackPositionArray[0].clone();
    p.x = ( p.x * 0.5 + 0.5 ) * canvas.width;
    p.y = (1.0 - ( p.y * 0.5 + 0.5 )) * canvas.height;
    context.moveTo( p.x, p.y );
    for( var i=1; i<headTrackPositionArray.length; i++ )
    {
        p = headTrackPositionArray[i].clone();
        p.x = ( p.x * 0.5 + 0.5 ) * canvas.width;
        p.y = (1.0 - ( p.y * 0.5 + 0.5 )) * canvas.height;
        context.lineTo( p.x, p.y );
    }
    context.fillStyle = "#75787B";
    context.stroke();
    //context.closePath();
*/

    // Draw circles
    //
    var rndIdx = 0;
    for( var i=0; i<headTrackPositionArray.length; i++ )
    {
        p = headTrackPositionArray[i].clone();
        p.x = ( p.x * 0.5 + 0.5 ) * canvas.width;
        p.y = (1.0 - ( p.y * 0.5 + 0.5 )) * canvas.height;

        p.x = PX.Clamp( p.x, PX.kBadgeStartRadius, canvas.width-(PX.kBadgeStartRadius) );
        p.y = PX.Clamp( p.y, PX.kBadgeStartRadius, canvas.height-(PX.kBadgeStartRadius) );

        context.beginPath();
        context.arc( p.x, p.y, p.z, 0, 2.0*Math.PI );
        //var rndIdx = THREE.Math.randInt( 0, PX.kColorArray.length-1 );
        context.fillStyle = PX.kColorArray[ rndIdx%4 ];
        context.fill();
        context.closePath();

        rndIdx++;
    }

    // Save canvas image as data url
    var dataURL = canvas.toDataURL( "image/png" );
    
    document.getElementById("canvasImg").src = dataURL;
    //console.log( dataURL );    
}


function CreateRenderer()
{
    renderer = new THREE.WebGLRenderer({ antialias: true, precision: "mediump", stencil: false, alpha: 1 });
    renderer.setClearColor( 0xffffff, 1 );
    //renderer.gammaOutput = true;
    element = renderer.domElement;
    container = document.getElementById( "glContainer" );
    container.appendChild( element );

    renderer.autoClear = false;
    renderer.autoClearStencil = false;
    renderer.sortObjects = false;
    //renderer.autoUpdateObjects = false;

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
    PX.AssetsDatabase["LoopA"] = new Howl(
    {
        urls: [ 'data/audio/LoopA.m4a' ]
        , autoplay: false
        , loop: true
        , volume: 1.0
        , onload: function() 
        {
            //console.log('onload!');
        }
        , onloaderror: function() 
        {
            console.log('onloaderror!');
        }
        , onend: function() 
        {
            //console.log('Finished!');
        }
    });

    PX.AssetsDatabase["LoopB"] = new Howl(
    {
        urls: [ 'data/audio/LoopB.m4a' ]
        , autoplay: false
        , loop: true
        , volume: 1.0
        , onload: function() 
        {
            //console.log('onload!');
        }
        , onloaderror: function() 
        {
            console.log('onloaderror!');
        }
        , onend: function() 
        {
            //console.log('Finished!');
        }
    });

    PX.AssetsDatabase["LoopC"] = new Howl(
    {
        urls: [ 'data/audio/LoopC.m4a' ]
        , autoplay: false
        , loop: true
        , volume: 1.0
        , onload: function() 
        {
            //console.log('onload!');
        }
        , onloaderror: function() 
        {
            console.log('onloaderror!');
        }
        , onend: function() 
        {
            //console.log('Finished!');
        }
    });

    PX.AssetsDatabase["LoopD"] = new Howl(
    {
        urls: [ 'data/audio/LoopD.m4a' ]
        , autoplay: false
        , loop: true
        , volume: 1.0
        , onload: function() 
        {
            //console.log('onload!');
        }
        , onloaderror: function() 
        {
            console.log('onloaderror!');
        }
        , onend: function() 
        {
            //console.log('Finished!');
        }
    });


    $.when(
        LoadTexture( "startButtonTexture", "data/textures/start.png" )
        //, LoadTexture( "welcomeTexture", "data/textures/welcome.png" )
        , LoadTexture( "worktogetherTexture", "data/textures/worktogether.png" )
        //, LoadShaderData( "GradSphereVertexShader", "data/shaders/GradSphere.vertex" )
        //, LoadShaderData( "GradSphereFragmentShader", "data/shaders/GradSphere.fragment" )
    ).done(function ()
    {
        LoadDataNext();
    } );
}

function LoadDataNext()
{
    $.when(
        //LoadSceneData( "SH010_RtoL", "data/animations/sh010_RtoL_sphere.js")
        //, LoadSceneData( "SH010_LtoR", "data/animations/sh010_LtoR_sphere_01.js")
        LoadSceneData( "SH020", "data/animations/sh020-60b.js")
        , LoadSceneData( "SH060B_070B", "data/animations/sh060b-070b.js")
        , LoadSceneData( "SH070B_080D", "data/animations/sh070b-080d.js")
        , LoadSceneData( "SH080D_PRE", "data/animations/sh080d_pre.js")
        //, LoadSceneData( "SH080D", "data/animations/sh080d.js")
        //, LoadSceneData( "SH090A_100I", "data/animations/sh090a-090b.js")
        , LoadSceneData( "SH090A_110B", "data/animations/sh090a-110b.js")
        //, LoadSceneData( "SH100I_110A", "data/animations/sh100i-110a.js")
        //, LoadJsonData( "SH010_RtoL_anim", "data/animations/sh010_RtoL_sphere.fbx.js" )
        //, LoadJsonData( "SH010_LtoR_anim", "data/animations/sh010_LtoR_sphere_01.fbx.js" )
        , LoadJsonData( "SH020_anim", "data/animations/sh020-60b.fbx.js" )
        , LoadJsonData( "SH060B_070B_anim", "data/animations/sh060b-070b.fbx.js" )
        , LoadJsonData( "SH070B_080D_anim", "data/animations/sh070b-080d.fbx.js" )
        , LoadJsonData( "SH080D_PRE_anim", "data/animations/sh080d_pre.fbx.js" )
        //, LoadJsonData( "SH080D_anim", "data/animations/sh080d.fbx.js" )
        //, LoadJsonData( "SH090A_100I_anim", "data/animations/sh090a-090b.fbx.js" )
        , LoadJsonData( "SH090A_110B_anim", "data/animations/sh090a-110b.fbx.js" )
        //, LoadJsonData( "SH100I_110A_anim", "data/animations/sh100i-110a.fbx.js" )
        //, LoadTexture( "startButtonTexture", "data/textures/start.png" )
        //, LoadTexture( "welcomeTexture", "data/textures/welcome.png" )
        //, LoadTexture( "worktogetherTexture", "data/textures/worktogether.png" )
    ).done(function ()
    {
        if( IsReleaseMode > 0 )
        {
            // fadeout preloader message and move on
            progressBarElement.fadeTo( 2000, 0).delay( 250, function()
            {
                //progressBarTextElement.empty();
                //$("#gif").empty();
                $("#gif").hide();
                progressBarElement.hide();
                progressBarTextElement.hide();
                startButtonElement.removeClass( 'hidden' );
                $("#startButton").css( "display", "block" ); // added by me - ADI

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

                        $("#teamwork_footer").hide(); // added by me - ADI
                        $("#main_container_id").hide(); // added by me - ADI

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
                $("#gif").addClass( 'hidden' ); //.hide();
                progressBarElement.addClass( 'hidden' ); //hide();
                progressBarTextElement.addClass( 'hidden' ); //hide();
                startButtonElement.removeClass( 'hidden' );
                $("#progress").addClass( 'hidden' ); //hide();
                startButtonElement.addClass( 'hidden' ); //hide();
                $("#teamwork_footer").addClass( "hidden" ); //hide(); // added by me - ADI
                $("#main_container_id").addClass( "hidden" ); //hide(); // added by me - ADI

            DoIt();
        }
    });
}

function DoIt()
{
    console.log( "DoIt" );

    //if( IsReleaseMode > 0 )
    //    element.addEventListener( "click", fullscreen, false );
    //else
    //{
    //    element.addEventListener( "click", function ()
    //    {
    //        controls.autoAlign = true;
    //    }, false );
    //}

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
    welcomeMesh.geometry.computeBoundingSphere();
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

    for( var i=0; i<kStartButtonCount; i++ )
    {
        var per = i / kStartButtonCount;
        var startMesh = new THREE.Mesh( startGeometry, startMaterial );
        startMesh.name = "start"+(i+1);
        startMesh.frustumCulled = false;
        startMesh.position.x = Math.sin( per * 2 * Math.PI ) * 350.0;
        startMesh.position.y = 50.0;
        startMesh.position.z = Math.cos( per * 2 * Math.PI ) * 350.0;
        startMesh.geometry.computeBoundingSphere();
        sh000Scene.add( startMesh );
    }

    //
    var userMaterial = new THREE.MeshBasicMaterial( {
        color: 0x75787B,
    });
    var userGeometry = new THREE.SphereGeometry( 15, 16, 16 );
    var userMesh = new THREE.Mesh( userGeometry, userMaterial );
    userMesh.name = "user";
    userMesh.position.z = 350.0;
    userMesh.geometry.computeBoundingSphere();
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
        PX.currentAnimName = "SH070B_080D";
        //PX.currentAnimName = "SH080D_PRE";
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



    // Create SH010_RtoL Scene
    //
    var sh010AnimScene = new PX.AnimScene();
    PX.AnimSceneArray.push( sh010AnimScene );
    var sh010scene = new THREE.Scene();
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
    worktogetherMesh.geometry.computeBoundingSphere();
    sh010scene.add( worktogetherMesh );
    sh010AnimScene.isInteractive = true;
    sh010AnimScene.Init( "SH010_RtoL", sh010scene );

/****
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
    worktogetherMesh.geometry.computeBoundingSphere();
    sceneRtoL.scene.add( worktogetherMesh );
    sceneRtoL.sceneObjectsArray.push( worktogetherMesh );
***/


    // Turn all circle shapes into grey to start with
    //
    var scene000 = FindSceneByName( "SH060B_070B" );
    for( var i=0; i<scene000.sceneObjectsArray.length; i++ )
    {
        var so = scene000.sceneObjectsArray[i];

        // Make a copy of material for every sphere
        // We'll need it for mat color switch
        if( so.name.substr(1, 3) === "Sph" )
        {
            // Assign every single circle with unique material
            var tmpMat = so.material.clone();
            var cr = so.material.color.r;
            var cg = so.material.color.g;
            var cb = so.material.color.b;
            so.material = new THREE.MeshBasicMaterial( { color: 0xff00ff } );

            so.material.color.r = cr; //tmpMat.color.r;
            so.material.color.g = cg; //tmpMat.color.g;
            so.material.color.b = cb; //tmpMat.color.b;
            // Dynamic create field in material that we'll use to re-color the circles in runtime
            so.material.destR = cr; //tmpMat.color.r;
            so.material.destG = cg; //tmpMat.color.g;
            so.material.destB = cb; //tmpMat.color.b; 
            //console.log( so.name );
        }

        // Color all circles expect gSph1 and rSph21 (the one that scales up in the end of the scene) with grey
        if( so.name !== "gSph1"
            && so.name.substr(0, 3) !== "txt"
            && so.name !== "geosphere01"
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
    scene000.scene.needsUpdate = true;
    for( var i=0; i<meshGeoSphereRef.geometry.faces.length; i++ )
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
    //console.log( "Edge count: ", scene000.meshEdgeList.length );


    // Remove duplicate edges
    //
    for( var j=0; j<scene000.meshEdgeList.length; j++ )
    {
        var edge = scene000.meshEdgeList[ j ];

        var isValid = true;

        if( edge.ai === edge.bi )
            isValid = false;

        for( var k=j+1; k<scene000.meshEdgeList.length; k++ )
        {
            var edge2 = scene000.meshEdgeList[ k ];

            if( edge.ai === edge2.ai && edge.bi === edge2.bi )
            {
                isValid = false;
                break;
            }
            if( edge.ai === edge2.bi && edge.bi === edge2.ai )
            {
                isValid = false;
                break;
            }
        }

        if( isValid )
        {
            scene000.uniqueMeshEdgeList.push( edge );
        }
    }
    console.log( "unique connections:", scene000.uniqueMeshEdgeList.length );


    // Create AnimEdges
    //
    scene000.AnimateWithRotation( 0.0, effect );


    var minDistance = 11;
    //var minDistanceSq = minDistance*minDistance;

    //for( var j=0; j<scene000.meshEdgeList.length; j++ )
    for( var j=0; j<scene000.uniqueMeshEdgeList.length; j++ )
    {
        //var edge = scene000.meshEdgeList[ j ];
        var edge = scene000.uniqueMeshEdgeList[ j ];

        var tempA = null;
        var tempB = null;
        var tempAi = -1;
        var tempBi = -1;

        for( var k=0; k<scene000.sceneObjectsArray.length; k++ )
        {
            var so = scene000.sceneObjectsArray[ k ];
            // In geosphere space
            var tempSoPos = so.position.clone().sub( meshGeoSphereRef.position );

            var count = 0;
            if( so.name.substr( 1, 3 ) === "Sph" )
            {
                //console.log( so.name );
                var dirA = tempSoPos.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.ai ] );
                var distA = dirA.length();
                //var distA = Math.sqrt( dirA.x*dirA.x + dirA.y*dirA.y );
                //console.log( distA );
                if( distA <= minDistance )
                {
                    tempA = so;
                    tempAi = edge.ai;
                    //hasfound = true;
                    //break;
                    count ++;
                }

                var dirB = tempSoPos.clone().sub( meshGeoSphereRef.geometry.vertices[ edge.bi ] );
                var distB = dirB.length();
                //var distB = Math.sqrt( dirB.x*dirB.x + dirB.y*dirB.y );
                if( distB <= minDistance )
                {
                    tempB = so;
                    tempBi = edge.bi;
                    //hasfound = true;
                    //break;
                    count ++;
                }
            }
            if( count >= 2 )
                break;
        }

        //if( tempA === null || tempB === null )
        //{
        //    console.log( "Failed to create connection" );
        //} else
        //{
        //    console.log( "Connection: ", tempAi, tempBi );
        //}
        //if( tempAi === tempBi )
        //    console.log( "CONNECTION TO SELF... BAAAAD" );

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
            var vA = animEdge.av.clone(); //meshGeoSphereRef.geometry.vertices[ animEdge.ai ];
		    var vB = animEdge.bv.clone(); //meshGeoSphereRef.geometry.vertices[ animEdge.bi ];

            // Feed our new line mesh
            // Update our vertex indices for new mesh
            scene000.meshGeometry.vertices.push( vA );
            animEdge.ai = scene000.meshGeometry.vertices.length - 1;
            scene000.meshGeometry.vertices.push( vB );
            animEdge.bi = scene000.meshGeometry.vertices.length - 1;
        }
    }

    scene000.meshLineMaterial = new THREE.LineBasicMaterial( { color: 0x75787B, opacity: 1.0, transparent: true } );
    //scene000.meshLineMaterial.depthTest = false;
    //scene000.meshLineMaterial.depthWrite = false;
    scene000.mesh = new THREE.Line( scene000.meshGeometry, scene000.meshLineMaterial, THREE.LinePieces );
    scene000.mesh.dynamic = true;
    scene000.mesh.name = "geosphere01";
    scene000.mesh.name.quaternion = meshGeoSphereRef.quaternion.clone();
    scene000.mesh.position = meshGeoSphereRef.position.clone();
    scene000.mesh.scale = meshGeoSphereRef.scale.clone();
    scene000.mesh.updateMatrix();
    scene000.mesh.geometry.computeBoundingSphere();
    scene000.sceneObjectsArray.push( scene000.mesh );
    scene000.scene.add( scene000.mesh );

    for( var i=0; i<scene000.animationInfoArray.length; i++ )
    {
        var animInfo = scene000.animationInfoArray[ i ];

        if( scene000.animationInfoArray[i].name === "geosphere01" )
        {
            //console.log( "switch geosphere01 mesh" );
            scene000.animationInfoArray[i].meshRef = scene000.mesh;
            break;
        }
    }





    // SH070B_080D
    //
    var sceneSH070B_080D = FindSceneByName( "SH070B_080D" );
    
    gradientRT = new THREE.WebGLRenderTarget( gradSphereTexSize, gradSphereTexSize,
    {
        wrapS: THREE.ClampToEdgeWrapping
        , wrapT: THREE.ClampToEdgeWrapping
        , minFilter: THREE.LinearFilter
        , magFilter: THREE.LinearFilter
        , format: THREE.RGBFormat
        , stencilBuffer: false
        , depthBuffer: false
    });




    // Turn all circle shapes into grey to start with
    //
    scene000 = FindSceneByName( "SH080D_PRE" );
    for( var i=0; i<scene000.sceneObjectsArray.length; i++ )
    {
        var so = scene000.sceneObjectsArray[i];

        var tmpMat = so.material.clone();

        // Color all circles expect 4 of them that comes from last scene
        if( so.name !== "rDsk1"
            && so.name !== "gDsk1"
            && so.name !== "bDsk1"
            && so.name !== "yDsk1"
            && so.name !== "txt_whenweWorktogether"
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

        scene000.physics[i].originalPos = scene000.sceneObjectsArray[i].position.clone();
    }

    scene000.rDsk1 = scene000.FindObject( "rDsk1" );
    scene000.gDsk1 = scene000.FindObject( "gDsk1" );
    scene000.bDsk1 = scene000.FindObject( "bDsk1" );
    scene000.yDsk1 = scene000.FindObject( "yDsk1" );

    scene000.rDsk1OriginalPos = scene000.rDsk1.position.clone();
    scene000.gDsk1OriginalPos = scene000.gDsk1.position.clone();
    scene000.bDsk1OriginalPos = scene000.bDsk1.position.clone();
    scene000.yDsk1OriginalPos = scene000.yDsk1.position.clone();

    scene000.rDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene000.rDsk1.position );
    scene000.gDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene000.gDsk1.position );
    scene000.bDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene000.bDsk1.position );
    scene000.yDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene000.yDsk1.position );



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

    //var typedExporter = new THREE.TypedGeometryExporter();
    //var exporter = new THREE.SceneExporter();
    //var exportScene = new THREE.Scene();
    //for( var k=0; k<uniqueSceneObjectsArray.length; k++ )
    //{
    //    var so = uniqueSceneObjectsArray[k];
    //    exportScene.add( so );
    //    var jsonSceneGeom = typedExporter.parse( so.geometry );
    //    console.log( jsonSceneGeom );
    //}
    //var jsonScene = exporter.parse( exportScene );
    //var jsonFile = JSON.stringify( jsonScene );
    ////log( jsonFile );

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

    camera = new THREE.PerspectiveCamera( PX.kCameraFovY, windowWidth/windowHeight, PX.kCameraNearPlane, PX.kCameraFarPlane );
    camera.updateProjectionMatrix();
    scene.add( camera );

    controls = new THREE.OrbitControls( camera, element );
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

        e.absolute = true;

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



    // Handle gradient sphere texture animation
    //

    gradientShader = new THREE.ShaderMaterial(
    {
        uniforms:
        {
            Time: { type: "f", value: 0.0 }
            , GradParams: { type: "v4", value: new THREE.Vector4( 10.0/gradSphereTexSize, 0.0, 0.0, 0.0 ) }
            , Color1: { type: "v3", value: new THREE.Vector3( 0.0, 0.0, 0.0 ) }
            , Color2: { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 1.0 ) }
        },

        vertexShader: document.getElementById( "GradSphereVertex" ).textContent // pathSimVertexShaderSource
        , fragmentShader: document.getElementById( "GradSphereFragment" ).textContent // pathSimFragmentBeginShaderSource
    });


    // Scene for the Gradient Render Target
    //
    gradSphereScene = new THREE.Scene();
	gradSphereCamera = new THREE.Camera(); //THREE.OrthographicCamera( -1, 1, -1, 1, -1, 1 );
    gradSphereScene.add( gradSphereCamera );

    var gradSphereMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    var gradSpherePlaneMesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2, 1 ), gradientShader ); //gradSphereMaterial );
    //gradSphereMaterial.depthTest = false;
    //gradSphereMaterial.depthWrite = false; 
    //gradSphereMaterial.side = THREE.DoubleSide;
    gradSphereScene.add( gradSpherePlaneMesh );


	gradientViewShader = new THREE.ShaderMaterial( 
    {
		uniforms: { tDiffuse: { type: "t", value: gradientRT } },
		vertexShader: document.getElementById( 'GradSphereVertex' ).textContent,
		fragmentShader: document.getElementById( 'fragment_shader_screen' ).textContent,
		//depthWrite: false
	} );
 
    var sceneSH070B_080D = FindSceneByName( "SH070B_080D" );
    var bgSphere = sceneSH070B_080D.FindObject( "grad_sphere" );
    bgSphere.material = gradientViewShader;
    bgSphere.material.needsUpdate = true;



    // Foreground scene
    //

    fgScene = new THREE.Scene();
    fgCamera = new THREE.Camera();
    //fgScene.add( fgCamera );
    //if( ! renderTrackingIn3D )
        //fgScene.add( headTrackMesh );

    // Add top-to-bottom line that splits the views
    //
    var splitLineGeom = new THREE.Geometry();
    splitLineGeom.vertices.push( new THREE.Vector3( 0, 1, 1 ) );
    splitLineGeom.vertices.push( new THREE.Vector3( 0, -1, 1 ) );
    var splitLineMaterial = new THREE.LineBasicMaterial( { color: 0x75787B } );
    splitLineMaterial.depthWrite = false;
    splitLineMaterial.depthTest = false;
    var splitLineMesh = new THREE.Line( splitLineGeom, splitLineMaterial );
    //fgScene.add( splitLineMesh );


    // First call of controls update
    controls.update( 0.016 );


    // Resize event
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
    //console.log( pos );

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

        var isValid = true;
        for( var i=0; i<headTrackPositionArray.length; i++ )
        {
            var p = headTrackPositionArray[i];
            var pDir = p.clone().sub( currentHeadPos );
            var pLenSq = ( pDir.x*pDir.x + pDir.y*pDir.y );
            if( pLenSq <= (PX.kBadgeMarkMinDistance*PX.kBadgeMarkMinDistance) )
            {
                isValid = false;
                //p.z += PX.kBadgeAddRadius;  // Radius increase
                break;
            }
        }

        if( isValid )
        {
            headTrackMesh.geometry.vertices[ headTrackVertexIdx ].x = currentHeadPos.x;
            headTrackMesh.geometry.vertices[ headTrackVertexIdx ].y = currentHeadPos.y;
            headTrackMesh.geometry.vertices[ headTrackVertexIdx ].z = currentHeadPos.z;
            if( headTrackVertexIdx < 4095 )
            {
                 headTrackVertexIdx ++;
            }
            //console.log( currentHeadPos.x + ", " + currentHeadPos.y + ", " + currentHeadPos.z );

            var newPos = new THREE.Vector3();
            newPos.set( currentHeadPos.x, currentHeadPos.y, PX.kBadgeStartRadius );
            headTrackPositionArray.push( newPos );
        } 
        //else
        //{
        //    console.log( "Increase radius of same point " );
        //}

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
}

function update(dt)
{
    var currentTimeMillis = currentTime * 1000.0;

    //resize();
    //camera.updateProjectionMatrix();


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



    // SH000 Control 
    //
    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH000" )
    {
        //var welcomeObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "welcome" );
        var userObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "user" );
        var userObjDepthDistance = 350.0;

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            for( var i=0; i<kStartButtonCount; i++ )
            {
                var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "start" + (i+1) );
                startObj.scale.set( 0.001, 0.001, 0.001 );
                startObj.updateMatrix();
            }

            userObj.scale.set( 0.001, 0.001, 0.001 );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
            //console.log( "switch to 2 " );

            console.log( "PX.AssetsDatabase.LoopA.play" );
            PX.AssetsDatabase.LoopA.fadeIn( 1.0, 1000.0 );
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            userObj.position.x = camera.position.x - headDir.x * userObjDepthDistance;
            userObj.position.y = camera.position.y - headDir.y * userObjDepthDistance;
            userObj.position.z = camera.position.z - headDir.z * userObjDepthDistance;
            userObj.scale.x += frameTime;
            userObj.scale.y += frameTime;
            userObj.scale.z += frameTime;
            userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
            userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
            userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

            for( var i=0; i<kStartButtonCount; i++ )
            {
                var startName = "start" + (i+1);
                var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( startName );

                startObj.scale.x += frameTime*2;
                startObj.scale.y += frameTime*2;
                startObj.scale.z += frameTime*2;

                startObj.scale.x = PX.Clamp( startObj.scale.x, 0.001, 1.0 );
                startObj.scale.y = PX.Clamp( startObj.scale.y, 0.001, 1.0 );
                startObj.scale.z = PX.Clamp( startObj.scale.z, 0.001, 1.0 );
            }

            if( userObj.scale.x >= 1.0 
                && startObj.scale.x >= 1.0 
                )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
            }

        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
        {
            userObj.position.x = camera.position.x - headDir.x * userObjDepthDistance;
            userObj.position.y = camera.position.y - headDir.y * userObjDepthDistance;
            userObj.position.z = camera.position.z - headDir.z * userObjDepthDistance;

            var enableUserScale = false;
            for( var i=0; i<kStartButtonCount; i++ )
            {
                var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "start" + (i+1) );

                // Check Start and User meshes if they collide
                // If so, grow User slowly and change material color
                //
                var dir = userObj.position.clone();
                dir.subVectors( userObj.position, startObj.position );
                var dirLen = dir.length();
                var scaleSpeed = 0.33 * 4;
                //console.log( i, dirLen );
                if( dirLen < 35
                    && PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2
                    )
                {
                    PX.AnimSceneArray[ PX.currentAnimIndex ].startMeshIndex = i;
                    PX.AnimSceneArray[ PX.currentAnimIndex ].startMeshScaleStartTime = currentTime;
                    PX.AnimSceneArray[ PX.currentAnimIndex ].state++;
                    enableUserScale = true;
                    break;
                }
            }
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 3 )
        {
            // Move circles to y=0 and then scale down before moving to next sceen
            //
            var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "start" + (PX.AnimSceneArray[ PX.currentAnimIndex ].startMeshIndex+1) );

            var currSceneTime = currentTime - PX.AnimSceneArray[ PX.currentAnimIndex ].startMeshScaleStartTime;

            var ss = 0.25;
            var dir = userObj.position.clone().sub( startObj.position );
            var lenSq = dir.lengthSq();
            dir.normalize();

            userObj.position.x -= dir.x * ss;
            userObj.position.y *= 0.8;
            //userObj.position.y -= dir.y * ss;
            userObj.position.z -= dir.z * ss;
            startObj.position.x += dir.x * ss;
            startObj.position.y *= 0.8;
            //startObj.position.y += dir.y * ss;
            startObj.position.z += dir.z * ss;

            if( lenSq < 1 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state++;
            }
        }
        else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 4 )
        {
            userObj.scale.x -= frameTime*4;
            userObj.scale.y -= frameTime*4;
            userObj.scale.z -= frameTime*4;
            userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
            userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
            userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

            for( var i=0; i<kStartButtonCount; i++ )
            {
                var startName = "start" + (i+1);
                var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( startName );

                startObj.scale.x -= frameTime*4;
                startObj.scale.y -= frameTime*4;
                startObj.scale.z -= frameTime*4;

                startObj.scale.x = PX.Clamp( startObj.scale.x, 0.001, 1.0 );
                startObj.scale.y = PX.Clamp( startObj.scale.y, 0.001, 1.0 );
                startObj.scale.z = PX.Clamp( startObj.scale.z, 0.001, 1.0 );
            }

            if( userObj.scale.x <= 0.001 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state++;
            }
        }

        // Orient start buttons
        //
        for( var i=0; i<kStartButtonCount; i++ )
        {
            var startObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "start"+(i+1) );
            startObj.lookAt( camera.position );
            startObj.updateMatrix();
        }


        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 5 )
        {
            controls.autoAlign = true;
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH020"; //"SH010_RtoL";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
            //progressBarElement.text( "switch scene to: " + PX.AnimSceneArray[ PX.currentAnimIndex ].name );            
            console.log( "PX.AssetsDatabase.LoopA.fadeOut" );
            PX.AssetsDatabase.LoopA.fadeOut( 0.0, 1500.0, function ()
            {
                console.log( "PX.AssetsDatabase.LoopA.stop" );
                PX.AssetsDatabase.LoopA.stop();
            });
            console.log( "PX.AssetsDatabase.LoopC.play" );
            PX.AssetsDatabase.LoopC.fadeIn( 1.0, 1000.0 );
        }

    }


    // SH020: Explosion, etc.
    if( PX.currentAnimName === "SH020" )
    {

        // Orient all cubes to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];

            if( so.name.substr( 1, 4 ) === "Cube" 
                || so.name.substr( 1, 3 ) === "Dsk" 
                )
            {
                //console.log( so.name );
                so.lookAt( camera.position ); 
                so.updateMatrix();
            }
        }

        PX.AnimSceneArray[ PX.currentAnimIndex ].AnimateWithAccumRotation( currentTimeMillis, effect );


        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH060B_070B";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
            console.log( "PX.AssetsDatabase.LoopC.fadeOut" );
            PX.AssetsDatabase.LoopC.fadeOut( 0.0, 1500.0, function ()
            {
            console.log( "PX.AssetsDatabase.LoopC.stop" );
                PX.AssetsDatabase.LoopC.stop();
            });
            console.log( "PX.AssetsDatabase.LoopB.play" );
            PX.AssetsDatabase.LoopB.fadeIn( 1.0, 1000.0 );
        }
    }



    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH060B_070B" )
    {
        var sceneTime = currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime;

        if( ! PX.AnimSceneArray[ PX.currentAnimIndex ].isPaused )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].AnimateWithRotation( currentTimeMillis, effect );
        }


        //
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].mesh !== null )
        {
            var lastSphereToScale = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "gSph28" );
            var rSph1 = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "rSph1" );
            var rSph1Conn = null; 
            //var connsCount = 0;
            for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges.length; i++ )
            {
                var animEdge = PX.AnimSceneArray[ PX.currentAnimIndex ].animEdges[ i ];
                 
                //if( animEdge.ai !== -1 
                //    && animEdge.bi !== -1 
                //    )
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
                        && animEdge.active === false
                        )
                    {
                        animEdge.active = true;
                        //animEdge.t = THREE.Math.randFloat( -0.5, -0.1 );
                    }

                    if( animEdge.active === true )
                    {
                        animEdge.t += frameTime * 1; //4.0;
                        var newP = new THREE.Vector3();
                        PX.LerpVector3( newP, animEdge.av, animEdge.bv, PX.Saturate( animEdge.t ) );
                        //console.log( animEdge.t );
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.ai ] = animEdge.av;
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.bi ] = newP;


                        // Color the target circle
                        if( animEdge.t >= 1.0 
                            && animEdge.b.name !== "gSph1" 
                            )
                        {
                            //animEdge.a.material.color.r = animEdge.a.material.destR;
                            //animEdge.a.material.color.g = animEdge.a.material.destG;
                            //animEdge.a.material.color.b = animEdge.a.material.destB;
                            animEdge.b.material.color.r = animEdge.b.material.destR;
                            animEdge.b.material.color.g = animEdge.b.material.destG;
                            animEdge.b.material.color.b = animEdge.b.material.destB;
                            //console.log( "+--+", animEdge.a.material.color.r, animEdge.a.material.color.g, animEdge.a.material.color.b );
                            //console.log( animEdge.b.material.color.r, animEdge.b.material.color.g, animEdge.b.material.color.b );
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
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.ai ] = animEdge.bv;
                        PX.AnimSceneArray[ PX.currentAnimIndex ].mesh.geometry.vertices[ animEdge.bi ] = animEdge.bv;
                    }
                } 
                //else
                //{
                //    console.log( " animEdge has an invalid connection. bail out" );
                //}
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
            if( rSph1Conn !== null )
            {
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
            console.log( "PX.AssetsDatabase.LoopB.fadeOut" );
            PX.AssetsDatabase.LoopB.fadeOut( 0.0, 1500.0, function ()
            {
                console.log( "PX.AssetsDatabase.LoopB.stop" );
                PX.AssetsDatabase.LoopB.stop();
            });
            console.log( "PX.AssetsDatabase.LoopC.play" );
            PX.AssetsDatabase.LoopC.fadeIn( 1.0, 1000.0 );
        }
    }



    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH070B_080D" )
    {
        // Orient all texts to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
            if( so.name.substr( 1, 3 ) === "Dsk" )
            {
                so.lookAt( camera.position ); 
            }
        }

        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis, effect );

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            //console.log( "switch to SH080D" );
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH080D_PRE";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        }
    }



/*  if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH080D_PRE" )
    {
        // Orient all texts to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
            if( so.name.substr( 1, 3 ) === "Dsk" )
            {
                so.lookAt( camera.position ); 
                //so.updateMatrix();
            }
        }

        PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis, effect );

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
            PX.currentAnimName = "SH080D";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        }
    }*/



    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH080D_PRE"
        //|| PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH080D" 
        )
    {
        var currSceneTimeMillis = currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime;

        var rDsk1 = PX.AnimSceneArray[ PX.currentAnimIndex ].rDsk1;
        var gDsk1 = PX.AnimSceneArray[ PX.currentAnimIndex ].gDsk1;
        var bDsk1 = PX.AnimSceneArray[ PX.currentAnimIndex ].bDsk1;
        var yDsk1 = PX.AnimSceneArray[ PX.currentAnimIndex ].yDsk1;

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis, effect );

            if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() )
            {
                var txtObj = PX.AnimSceneArray[ PX.currentAnimIndex ].FindObject( "txt_whenweWorktogether" );
                txtObj.position.x = 10000;
                txtObj.updateMatrix();
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
                console.log( "PX.AssetsDatabase.LoopC.fadeOut" );
                PX.AssetsDatabase.LoopC.fadeOut( 0.0, 1500.0, function()
                {
                    console.log( "PX.AssetsDatabase.LoopC.stop" );
                    PX.AssetsDatabase.LoopC.stop();
                });
                console.log( "PX.AssetsDatabase.LoopD.play" );
                PX.AssetsDatabase.LoopD.play();
            }
        }
        else
        {
            if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
            {
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
            }
            else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 )
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
                //var dotAAA = repulsionPos.clone().normalize().dot( PX.ZAxis );
                //var aaaPlus = PX.Saturate( dotAAA * 8 ) + 0.01;
                var minRadius2 = minRadius * 0.15; // * repLen; // * aaaPlus;


                if( ! PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorFlag )
                    PX.AnimSceneArray[ PX.currentAnimIndex ].autoColorRadius += (repLen*1.0);

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

                    if( so.name === "rDsk1"
                        || so.name === "gDsk1"
                        || so.name === "bDsk1"
                        || so.name === "yDsk1"
                        || so.name === "txt_whenweWorktogether"
                        )
                    {
                        continue;
                    }

                    var phy = PX.AnimSceneArray[ PX.currentAnimIndex ].physics[ i ];

                    var dx = soPos.x - repulsionPos.x;
                    var dy = soPos.y - repulsionPos.y;
                    var dz = 0;//soPos.z - repulsionPos.z; // Assume a infinite cylindrical force field

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

                        phy.accel.x += dx * 14.2;
                        phy.accel.y += dy * 14.2;
                        phy.accel.z += dz * 14.2;
                        PX.ClampVector3( phy.accel, -1, 1 );
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
                    //soPos = soPos.normalize();
                    //soPos.x *= minRadius;
                    //soPos.y *= minRadius;
                    //soPos.z *= minRadius;

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
                        //so.position.z -= 60;
                        phy.accel.z -= 2.0;
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
                        phy.accel.z -= 2.0;
                        //so.position.z -= 60;
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
                        //so.position.z += frameTime*9;
                        //so.position.z = PX.Clamp( so.position.z, 0, phy.originalPos.z );
                    }

                    // Orient to camera
                    so.lookAt( camera.position );

                    so.updateMatrix();
                }

                if( PX.AnimSceneArray[ PX.currentAnimIndex ].activeCircleCount >= (PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length-8) )
                {
                    PX.AnimSceneArray[ PX.currentAnimIndex ].state = 3;
                    //console.log( "switch to state 2" );
                }


                // CURSOR EFFECT
                //
                var rotSpeed = ( currSceneTimeMillis * 0.001 ) * 2;
                var rotOffset = 0.0;
                var rotRadius = 6.0;
                var pullForceStrength = frameTime * 5.25;
                if( currSceneTimeMillis < 3000.0 )
                {
                    pullForceStrength *= 0.25;
                    rotRadius *= 2.0;
                }

                var rpR = new THREE.Vector3();
                var rpG = new THREE.Vector3();
                var rpB = new THREE.Vector3();
                var rpY = new THREE.Vector3();

                // Left to right order
                rpY.add( repulsionPos );
                rpG.add( repulsionPos );
                rpR.add( repulsionPos );
                rpB.add( repulsionPos );


                rotOffset = THREE.Math.degToRad( 180.0 );
                rpY.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
                rpY.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
                //rpY.z += PX.AnimSceneArray[ PX.currentAnimIndex ].yDsk1OriginalPos.z * 0.93;
                rotOffset = THREE.Math.degToRad( 90.0 );
                rpG.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
                rpG.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
                //rpG.z = PX.AnimSceneArray[ PX.currentAnimIndex ].gDsk1OriginalPos.z * 0.91;
                rotOffset = THREE.Math.degToRad( 270.0 );
                rpR.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
                rpR.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
                //rpR.z = PX.AnimSceneArray[ PX.currentAnimIndex ].rDsk1OriginalPos.z * 0.90;
                rotOffset = THREE.Math.degToRad( 0.0 );
                rpB.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
                rpB.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
                //rpB.z = PX.AnimSceneArray[ PX.currentAnimIndex ].bDsk1OriginalPos.z * 0.92;

                rDsk1.position.x += (rpR.x - rDsk1.position.x ) * pullForceStrength;
                rDsk1.position.y += (rpR.y - rDsk1.position.y ) * pullForceStrength;
                rDsk1.position.z += (rpR.z - rDsk1.position.z ) * pullForceStrength;
                //
                gDsk1.position.x += (rpG.x - gDsk1.position.x ) * pullForceStrength;
                gDsk1.position.y += (rpG.y - gDsk1.position.y ) * pullForceStrength;
                gDsk1.position.z += (rpG.z - gDsk1.position.z ) * pullForceStrength;
                //
                bDsk1.position.x += (rpB.x - bDsk1.position.x ) * pullForceStrength;
                bDsk1.position.y += (rpB.y - bDsk1.position.y ) * pullForceStrength;
                bDsk1.position.z += (rpB.z - bDsk1.position.z ) * pullForceStrength;
                //
                yDsk1.position.x += (rpY.x - yDsk1.position.x ) * pullForceStrength;
                yDsk1.position.y += (rpY.y - yDsk1.position.y ) * pullForceStrength;
                yDsk1.position.z += (rpY.z - yDsk1.position.z ) * pullForceStrength;

                // Orient to camera
                PX.AnimSceneArray[ PX.currentAnimIndex ].rDsk1.lookAt( camera.position );
                PX.AnimSceneArray[ PX.currentAnimIndex ].gDsk1.lookAt( camera.position );
                PX.AnimSceneArray[ PX.currentAnimIndex ].bDsk1.lookAt( camera.position );
                PX.AnimSceneArray[ PX.currentAnimIndex ].yDsk1.lookAt( camera.position );

                rDsk1.updateMatrix();
                gDsk1.updateMatrix();
                bDsk1.updateMatrix();
                yDsk1.updateMatrix();
            }
            else if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 3 )
            {
                // Apply physics
                var avgVel = 999.0;
                var minRadius = 300.0;
                for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
                {
                    var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[i];
                    var soPos = so.position;

                    if( so.name === "txt_whenweWorktogether" )
                    {
                        continue;
                    }

                    var phy = PX.AnimSceneArray[ PX.currentAnimIndex ].physics[ i ];

                    //var ddddir = phy.originalPos.clone().sub( soPos );
                    //var llllen = PX.Saturate( ddddir.length() * 0.1 );
                    //if( so.name === "rDsk1" )
                    //    phy.damp = 1 - llllen;
                    //else if( so.name === "gDsk1" )
                    //    phy.damp = 1 - llllen;
                    //else if( so.name === "bDsk1" )
                    //    phy.damp = 1 - llllen;
                    //else if( so.name === "yDsk1" )
                    //    phy.damp = 1 - llllen;
                    //else
                        phy.damp = 0.925;

                    phy.accel.x += ( phy.originalPos.x - soPos.x ) * 0.015;
                    phy.accel.y += ( phy.originalPos.y - soPos.y ) * 0.015;
                    phy.accel.z += ( phy.originalPos.z - soPos.z ) * 0.015;

                    phy.vel.x += phy.accel.x;
                    phy.vel.y += phy.accel.y;
                    phy.vel.z += phy.accel.z;
                    //phy.vel.x = PX.Clamp( phy.vel.x, -0.35, 035 );
                    //phy.vel.y = PX.Clamp( phy.vel.y, -0.35, 035 );
                    //phy.vel.z = PX.Clamp( phy.vel.z, -0.35, 035 );

                    soPos.x += phy.vel.x;
                    soPos.y += phy.vel.y;
                    soPos.z += phy.vel.z;
                    //soPos = soPos.normalize();
                    //soPos.x *= minRadius;
                    //soPos.y *= minRadius;
                    //soPos.z *= minRadius;

                    phy.vel.multiplyScalar( phy.damp );
                    phy.accel.set( 0, 0, 0 );

                    // Popup effect on connection
                    if( phy.changed )
                    {
                        so.scale.x -= frameTime*0.7;
                        so.scale.y -= frameTime*0.7;
                        so.scale.z -= frameTime*0.7;
                        PX.ClampVector3( so.scale, 1.0, 1.5 );
                        so.position.z += frameTime*2;
                        so.position.z = PX.Clamp( so.position.z, phy.originalPos.z, so.position.z );
                    }

                    // Orient to camera
                    so.lookAt( camera.position );

                    so.updateMatrix();

                    avgVel += phy.vel.lengthSq();
                }   

                avgVel = avgVel / (PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length);
                //console.log( avgVel );
                if( avgVel <= 2.5235+frameTime*0.333 ) //2.29 )
                {
                    //console.log( "switch scene again" );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].RemoveFrom( scene );
                    PX.currentAnimName = "SH090A_110B";
                    PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
                    PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
                    console.log( "PX.AssetsDatabase.LoopD.fadeOut" );
                    PX.AssetsDatabase.LoopD.fadeOut( 0.0, 1500.0, function()
                    {
                        console.log( "PX.AssetsDatabase.LoopD.stop" );
                        PX.AssetsDatabase.LoopD.stop();
                    });
                }
            }
        }
    }


    if( PX.AnimSceneArray[ PX.currentAnimIndex ].name === "SH090A_110B" )
    {
        // Orient all disks to face the camera
        //
        for( var i=0; i<PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray.length; i++ )
        {
            var so = PX.AnimSceneArray[ PX.currentAnimIndex ].sceneObjectsArray[ i ];
            if( so.name.substr( 1, 3 ) === "Dsk" )
            {
                so.lookAt( camera.position );
            }
        }

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 0 )
        {
            console.log( "PX.AssetsDatabase.LoopC.play" );
            PX.AssetsDatabase.LoopC.fadeIn( 1.0, 1500.0 );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 1;
            console.log( "to 1" );
        } 

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
            PX.AnimSceneArray[ PX.currentAnimIndex ].Animate( currentTimeMillis, effect );

        // When finished move on to next scene
        if( PX.AnimSceneArray[ PX.currentAnimIndex ].IsFinished() 
            && PX.AnimSceneArray[ PX.currentAnimIndex ].state === 1 )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].startTime = currentTimeMillis;
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 2;
        }

        if( PX.AnimSceneArray[ PX.currentAnimIndex ].state === 2 
            && ( (currentTimeMillis - PX.AnimSceneArray[ PX.currentAnimIndex ].startTime ) > 6000.0 ) 
            )
        {
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 3;
            DrawBadgeCanvas();
            $("#glContainer").addClass( "hidden" );
            PX.currentAnimName = "THE_END";
            PX.currentAnimIndex = 0;
        }
    }
}


function render()
{
    renderer.clear();

    if( PX.currentAnimName === "SH070B_080D" )
    {
        if( gradientState === 0 )
        {
            gradientStartTime = currentTime;
            gradientState = 1;
        }
        else if( gradientState === 1 )
        {
            var gradCurrTime = ( currentTime - gradientStartTime );
            gradCurrTime = PX.Clamp( gradCurrTime, 0.0, gradCurrTime );
            var t = PX.Lerp( 0.0, 1.0, gradCurrTime * (1.0 / 11.0) );
            gradientShader.uniforms.GradParams.value.y = PX.Saturate( t );
            gradientShader.uniforms.Time.value = gradCurrTime;

            if( gradCurrTime > 12 )
                gradientState ++;
        }
        else if( gradientState === 2 )
        {
            var gradCurrTime = ( currentTime - gradientStartTime );
            gradientShader.uniforms.GradParams.value.y = 0.0;
            gradientShader.uniforms.Time.value = gradCurrTime;
            gradientShader.uniforms.Color1.value.set( 1, 1, 1 );
            gradientShader.uniforms.Color2.value.set( 0, 0, 0 );
            gradientState++;
        }
        else if( gradientState === 3 )
        {
            var gradCurrTime = ( currentTime - gradientStartTime );
            gradientShader.uniforms.GradParams.value.y += frameTime * 0.5;
            gradientShader.uniforms.Time.value = gradCurrTime;
        }
    }

    if( isFirstUpdate
        || PX.currentAnimName === "SH070B_080D"
        )
    {
        //renderer.setClearColor( 0xffffff );
        renderer.setViewport( 0, 0, gradSphereTexSize, gradSphereTexSize );
	    renderer.render( gradSphereScene, gradSphereCamera, gradientRT, true );        
    }


    // fbScene also used to render the vertical line that splits the 2 eye views
    //if( ! renderTrackingIn3D )
    {
        //renderer.setClearColor( 0xffffff, 0 );
        renderer.setViewport( 0, 0, windowWidth, windowHeight );
        renderer.render( fgScene, fgCamera );
    }

    // Render scene on screen
    effect.render( scene, camera );

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

    isFirstUpdate = false;    
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
