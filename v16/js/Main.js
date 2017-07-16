/* global THREE: true } */

var PX = PX || {}; 

var progressBarElement = $("#progressBar");
var progressBarTextElement = $("#progressBarText");
var startButtonElement = $("#startButton");


var IsReleaseMode = 1;
var animationFramedId = undefined;
var camera, scene, renderer;
var effect, controls;
var element, container;
var windowWidth, windowHeight;
var deviceContentScale = 1.0;
var canvas = null;
var context = null;
var fgCamera = null;
var fgScene = null;

var gradSphereCamera = null;
var gradSphereScene = null;

var currentSoundSample = null;

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

var headDir = new THREE.Vector3( 0, 0, 1 );
var headRight = new THREE.Vector3( 1, 0, 0 );
var headTrackTriggerTime = 1.0;
var headTrackCountTime = 0.0;
var headTrackPositionArray = [];  // Vector3 with XY as pos and Z as radius
var currentHeadPos = new THREE.Vector3();


$(window).unload(function(e) 
{
    if( currentSoundSample !== null )
        currentSoundSample.stop();
    //console.log( "unload", currentTime );
    Howler.mute();
});

$(window).blur(function(e) 
{
    //if( currentSoundSample !== null )
    //    currentSoundSample.pause();

    //console.log( "blur", currentTime );
    Howler.mute();
});

$(window).focus(function(e) 
{
    //if( currentSoundSample !== null )
    //    currentSoundSample.play();

    //console.log( "focus", currentTime );
    Howler.unmute();
});

THREE.DefaultLoadingManager.onProgress = function (item, loaded, total)
{
    var str = parseInt( ( loaded / total ) * 100 ) + " %";
    progressBarTextElement.text(str);
    if( IsReleaseMode === 0 )
    {
        //console.log( item, loaded, total );
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
    //console.log( "+--+  Set fullscreen mode" );

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
}

function ReplayFunc()
{
    PX.GeneratedImageData = "";

    headTrackPositionArray
    headDir.set( 0, 0, 1 );
    headRight.set( 1, 0, 0 );
    headTrackCountTime = 0.0;
    currentHeadPos.set( 0, 0, 0 );
    while( headTrackPositionArray.length > 0 )
        headTrackPositionArray.pop();

    gradientState = 0;
    gradientStartTime = 0.0;

    // Reset BADGE scene
    //
    var badgeScene = FindSceneByName( "SHBADGE" );
    var offsetY = 100.0;
    var imageMesh = badgeScene.FindObject( "image" );
    imageMesh.position.x = 0;
    imageMesh.position.y = offsetY;
    imageMesh.position.z = 350.0;

    offsetY -= 100;
    var infoMesh = badgeScene.FindObject( "info" );
    infoMesh.position.x = 0;
    infoMesh.position.y = offsetY;
    infoMesh.position.z = 350.0;

    offsetY -= 75;
    var replayMesh = badgeScene.FindObject( "replay" );
    replayMesh.position.x = -75 + ( 35 * 0.5 );
    replayMesh.position.y = offsetY;
    replayMesh.position.z = 350.0;

    var shareMesh = badgeScene.FindObject( "share" );
    shareMesh.position.x = 75 - ( 35 * 0.5 );
    shareMesh.position.y = offsetY;
    shareMesh.position.z = 350.0;

    clock.start();
}

function Shutdown()
{
    PX.GeneratedImageData = "";

    cancelAnimationFrame(animationFramedId);
    animationFramedId = undefined;

    if (document.exitFullscreen)
    {
        document.exitFullscreen();
    }
    else if (document.msExitFullscreen)
    {
        document.msExitFullscreen();
    }
    else if (document.mozCancelFullScreen)
    {
        document.mozCancelFullScreen();
    }
    else if (document.webkitExitFullscreen)
    {
        document.webkitExitFullscreen();
    }

    $("#main_container_id").removeClass("hidden");

    UploadImage();
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

    // Draw connections
    //
    for( i=0; i<triangles.length; i+=3 ) 
    {
        context.beginPath();
        context.moveTo( vertices[ triangles[i+0] ][0], vertices[ triangles[i+0] ][1] );
        context.lineTo( vertices[ triangles[i+1] ][0], vertices[ triangles[i+1] ][1] );
        context.lineTo( vertices[ triangles[i+2] ][0], vertices[ triangles[i+2] ][1] );
        context.closePath();
        context.lineWidth = 2;
        context.fillStyle = "#75787B";
        context.stroke();
    }


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
    PX.GeneratedImageData = canvas.toDataURL( "image/png" );
    //console.log( PX.GeneratedImageData.length );
}


function BuildSH000Scene( scene )
{
    // Prepare Anim Scene
    //
    var sh000AnimScene = new PX.AnimScene();
    PX.AnimSceneArray.push( sh000AnimScene );

    // Create entrance scene manually
    //
    var sh000Scene = new THREE.Scene();

    //
    var startTexture = PX.AssetsDatabase.startButtonTexture;
    startTexture.wrapS = THREE.ClampToEdgeWrapping;
    startTexture.wrapT = THREE.ClampToEdgeWrapping;
    startTexture.magFilter = THREE.LinearFilter;
    startTexture.minFilter = THREE.LinearMipMapLinearFilter;
    startTexture.anisotropy = renderer.getMaxAnisotropy();
    //var startMaterial = new THREE.MeshBasicMaterial( { map: startTexture, color: 0xffffff, transparent: true, opacity: 1.0, side: THREE.DoubleSide } );
    var startMaterial = new THREE.ShaderMaterial( 
    {
		uniforms: { DiffuseMap: { type: "t", value: startTexture } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureUnPremultiplyFragment" ).textContent
        , transparent: true
        , opacity: 1.0
        , side: THREE.DoubleSide
	} );
    var startGeometry = new THREE.PlaneGeometry( -35, 35, 10, 10 );
    for( var i=0; i<kStartButtonCount; i++ )
    {
        var per = i / kStartButtonCount;
        var startMesh = new THREE.Mesh( startGeometry, startMaterial );
        startMesh.name = "start"+(i+1);
        startMesh.frustumCulled = false;
        startMesh.position.x = Math.sin( per * 2 * Math.PI ) * PX.kUserCursorDistance;
        startMesh.position.y = 50.0;
        startMesh.position.z = Math.cos( per * 2 * Math.PI ) * PX.kUserCursorDistance;
        startMesh.geometry.computeBoundingSphere();
        sh000Scene.add( startMesh );
    }


    //
    var userMaterial = new THREE.MeshBasicMaterial( {
        color: 0x75787B,
    });
    var userGeometry = new THREE.SphereGeometry( 15, 18, 18 );
    var userMesh = new THREE.Mesh( userGeometry, userMaterial );
    userMesh.name = "user";
    userMesh.position.z = PX.kUserCursorDistance;
    userMesh.geometry.computeBoundingSphere();
    sh000Scene.add( userMesh );

    // Add scene to AnimScene array and set as interactive
    sh000AnimScene.isInteractive = true;
    // Initialize it
    sh000AnimScene.Init( "SH000", sh000Scene );    
}

function BuildBadgeScene( scene )
{
    var shBadgeAnimScene = new PX.AnimScene();
    PX.AnimSceneArray.push( shBadgeAnimScene );
    var shBadgescene = new THREE.Scene();

    //
    var replayTexture = PX.AssetsDatabase.replayButtonTexture;
    replayTexture.wrapS = THREE.ClampToEdgeWrapping;
    replayTexture.wrapT = THREE.ClampToEdgeWrapping;
    replayTexture.magFilter = THREE.LinearFilter;
    replayTexture.minFilter = THREE.LinearMipMapLinearFilter;
    replayTexture.anisotropy = renderer.getMaxAnisotropy();
    //
    var shareTexture = PX.AssetsDatabase.shareButtonTexture;
    shareTexture.wrapS = THREE.ClampToEdgeWrapping;
    shareTexture.wrapT = THREE.ClampToEdgeWrapping;
    shareTexture.magFilter = THREE.LinearFilter;
    shareTexture.minFilter = THREE.LinearMipMapLinearFilter;
    shareTexture.anisotropy = renderer.getMaxAnisotropy();
    //
    var infoTexture = PX.AssetsDatabase.badgeInformationTexture;
    infoTexture.wrapS = THREE.ClampToEdgeWrapping;
    infoTexture.wrapT = THREE.ClampToEdgeWrapping;
    infoTexture.magFilter = THREE.LinearFilter;
    infoTexture.minFilter = THREE.LinearMipMapLinearFilter;
    infoTexture.anisotropy = renderer.getMaxAnisotropy();
    //
    var imageTexture = new THREE.Texture( canvas ); //PX.AssetsDatabase.BadgeInformationTexture;
    imageTexture.wrapS = THREE.ClampToEdgeWrapping;
    imageTexture.wrapT = THREE.ClampToEdgeWrapping;
    imageTexture.magFilter = THREE.LinearFilter;
    imageTexture.minFilter = THREE.LinearMipMapLinearFilter;
    imageTexture.anisotropy = renderer.getMaxAnisotropy();


    var replayMaterial = new THREE.ShaderMaterial( 
    {
		uniforms: { DiffuseMap: { type: "t", value: replayTexture } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureUnPremultiplyFragment" ).textContent
        , transparent: true
        , opacity: 1.0
        , side: THREE.DoubleSide
	} );
    var shareMaterial = new THREE.ShaderMaterial( 
    {
		uniforms: { DiffuseMap: { type: "t", value: shareTexture } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureUnPremultiplyFragment" ).textContent
        , transparent: true
        , opacity: 1.0
        , side: THREE.DoubleSide
	} );
    var infoMaterial = new THREE.ShaderMaterial( 
    {
		uniforms: { DiffuseMap: { type: "t", value: infoTexture } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureUnPremultiplyFragment" ).textContent
        , transparent: true
        , opacity: 1.0
        , side: THREE.DoubleSide
	} );
    var imageMaterial = new THREE.MeshBasicMaterial( { map: imageTexture, color: 0xffffff, side: THREE.DoubleSide } );
/*    var imageMaterial = new THREE.ShaderMaterial( 
    {
		uniforms: { DiffuseMap: { type: "t", value: shareTexture } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureUnPremultiplyFragment" ).textContent
        , transparent: true
        , opacity: 1.0
        , side: THREE.DoubleSide
	} );*/

    var imageHeight = 150*(canvas.height/canvas.width);
    var imageGeometry = new THREE.PlaneGeometry( -150, imageHeight, 10, 10 );
    var infoGeometry = new THREE.PlaneGeometry( -150, 75, 10, 10 );
    var replayGeometry = new THREE.PlaneGeometry( -35, 35, 10, 10 );
    var shareGeometry = new THREE.PlaneGeometry( -35, 35, 10, 10 );

    var offsetY = 100.0;
    var imageMesh = new THREE.Mesh( imageGeometry, imageMaterial );
    imageMesh.name = "image";
    imageMesh.frustumCulled = false;
    imageMesh.position.x = 0;
    imageMesh.position.y = offsetY;
    imageMesh.position.z = 350.0;
    shBadgescene.add( imageMesh );

    offsetY -= imageHeight+3;
    var infoMesh = new THREE.Mesh( infoGeometry, infoMaterial );
    infoMesh.name = "info";
    infoMesh.frustumCulled = false;
    infoMesh.position.x = 0;
    infoMesh.position.y = offsetY;
    infoMesh.position.z = 350.0;
    shBadgescene.add( infoMesh );

    offsetY -= 100;
    var replayMesh = new THREE.Mesh( replayGeometry, replayMaterial );
    replayMesh.name = "replay";
    replayMesh.frustumCulled = false;
    replayMesh.position.x = -75 + ( 35 * 0.5 );
    replayMesh.position.y = offsetY;
    replayMesh.position.z = 350.0;
    shBadgescene.add( replayMesh );

    var shareMesh = new THREE.Mesh( shareGeometry, shareMaterial );
    shareMesh.name = "share";
    shareMesh.frustumCulled = false;
    shareMesh.position.x = 75 - ( 35 * 0.5 );
    shareMesh.position.y = offsetY;
    shareMesh.position.z = 350.0;
    shBadgescene.add( shareMesh );

    //
    var userMaterial = new THREE.MeshBasicMaterial( {
        color: 0x75787B,
    });
    var userGeometry = new THREE.SphereGeometry( 2, 8, 8 );
    var userMesh = new THREE.Mesh( userGeometry, userMaterial );
    userMesh.name = "user";
    userMesh.position.z = 350.0;
    userMesh.geometry.computeBoundingSphere();
    shBadgescene.add( userMesh );

    // Add scene to AnimScene array and set as interactive
    shBadgeAnimScene.isInteractive = true;
    // Initialize it
    shBadgeAnimScene.Init( "SHBADGE", shBadgescene );    
}

function CreateRenderer()
{
    renderer = new THREE.WebGLRenderer( { antialias: true, precision: "mediump", stencil: false, alpha: true } );
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
    PX.AssetsDatabase["SoundMainLoop"] = new Howl(
    {
        urls: [ 'data/audio/mainLoop.m4a' ]
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

    PX.AssetsDatabase["SoundAnim1"] = new Howl(
    {
        urls: [ 'data/audio/animation1.m4a' ]
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

    PX.AssetsDatabase["SoundAnim2"] = new Howl(
    {
        urls: [ 'data/audio/animation2.m4a' ]
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

    PX.AssetsDatabase["SoundAnim3"] = new Howl(
    {
        urls: [ 'data/audio/animation3.m4a' ]
        , autoplay: false
        , loop: false
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
        , LoadTexture( "replayButtonTexture", "data/textures/replay.png" )
        , LoadTexture( "shareButtonTexture", "data/textures/share.png" )
        , LoadTexture( "badgeInformationTexture", "data/textures/Cardboard-Share_Replay.png" )
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
        LoadSceneData( "SH020_060B", "data/animations/sh020-60b.js")
        , LoadSceneData( "SH060B_070B", "data/animations/sh060b-070b.js")
        , LoadSceneData( "SH070B_080D", "data/animations/sh070b-080d.js")
        , LoadSceneData( "SH080D_PRE", "data/animations/sh080d_pre.js")
        , LoadSceneData( "SH090A_110B", "data/animations/sh090a-110b.js")
        , LoadSceneData( "BACKGROUND", "data/animations/outter_grid.js")
        , LoadJsonData( "SH020_060B_anim", "data/animations/sh020-60b.fbx.js" )
        , LoadJsonData( "SH060B_070B_anim", "data/animations/sh060b-070b.fbx.js" )
        , LoadJsonData( "SH070B_080D_anim", "data/animations/sh070b-080d.fbx.js" )
        , LoadJsonData( "SH080D_PRE_anim", "data/animations/sh080d_pre.fbx.js" )
        , LoadJsonData( "SH090A_110B_anim", "data/animations/sh090a-110b.fbx.js" )
    ).done(function ()
    {
        if( IsReleaseMode > 0 )
        {
            // fadeout preloader message and move on
            progressBarElement.fadeTo( 2000, 0).delay( 250, function()
            {
                //progressBarTextElement.empty();
                //$("#gif").empty();
                $("#gif").addClass( "hidden" );
                progressBarElement.addClass( "hidden" );
                progressBarTextElement.addClass( "hidden" );
                startButtonElement.removeClass( "hidden" );
                startButtonElement.css( "display", "block" );

                startButtonElement.delay( 500 ).fadeTo( 1000, 1 ).delay( 250, function ()
                {
                    startButtonElement.on( "click", function( e )
                    {
                        console.log( "+--+  Finished loading. DoIt()" );

                        startButtonElement.dequeue();
                        startButtonElement.fadeTo( 2000, 0 ).delay( 500, function ()
                        {
                            $("#progress").addClass( "hidden" );
                            startButtonElement.addClass( "hidden" );
                            DoIt();
                        } );

                        $("#teamwork_footer").addClass( "hidden" );
                        $("#main_container_id").addClass( "hidden" );

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
                        startButtonElement.off( "click" );
                    } );
                });
            } );            
        }
        else
        {
            $("#gif").addClass( "hidden" );
            progressBarElement.addClass( "hidden" );
            progressBarTextElement.addClass( "hidden" );
            $("#progress").addClass( "hidden" );
            startButtonElement.addClass( "hidden" );
            $("#teamwork_footer").addClass( "hidden" );
            $("#main_container_id").addClass( "hidden" );

            DoIt();
        }
    });
}

function DoIt()
{
    //console.log( "DoIt" );

    canvas = document.getElementById( "BadgeCanvas" );
    context = canvas.getContext( "2d" );

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


    BuildSH000Scene( scene );

    BuildBadgeScene( scene );

    var bgScene = FindSceneByName( "BACKGROUND" );
    bgScene.isInteractive = true;


    if( IsReleaseMode > 0 )
    {
        PX.currentAnimName = "SH000";
        //PX.currentAnimName = "SHBADGE";
    }
    else
    {
        //PX.currentAnimName = "SH000";
        //PX.currentAnimName = "SH020_060B";
        //PX.currentAnimName = "SH060B_070B";
        //PX.currentAnimName = "SH070B_080D";
        //PX.currentAnimName = "SH080D_PRE";
        PX.currentAnimName = "SH090A_110B";
        //PX.currentAnimName = "SHBADGE";
    }
    PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );




    // Set animations for all scenes. Only does the non-interactive ones
    //
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        var as = PX.AnimSceneArray[i];
        as.SetAnimation();
    }



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
    var meshEdgeList = [];
    var uniqueMeshEdgeList = [];
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
        meshEdgeList.push( edge0 );
        meshEdgeList.push( edge1 );
        meshEdgeList.push( edge2 );

        //console.log( meshGeoSphereRef.geometry.vertices[ face.a ] );
        //console.log( meshGeoSphereRef.geometry.vertices[ face.b ] );
        //console.log( meshGeoSphereRef.geometry.vertices[ face.c ] );
    }
    //console.log( "Edge count: ", meshEdgeList.length );


    // Remove duplicate edges
    //
    for( var j=0; j<meshEdgeList.length; j++ )
    {
        var edge = meshEdgeList[ j ];

        var isValid = true;

        if( edge.ai === edge.bi )
            isValid = false;

        for( var k=j+1; k<meshEdgeList.length; k++ )
        {
            var edge2 = meshEdgeList[ k ];

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
            uniqueMeshEdgeList.push( edge );
        }
    }
    //console.log( "unique connections:", uniqueMeshEdgeList.length );


    // Create AnimEdges
    //
    scene000.AnimateWithRotation( 0.0, effect );


    var minDistance = 11;
    //var minDistanceSq = minDistance*minDistance;

    for( var j=0; j<uniqueMeshEdgeList.length; j++ )
    {
        var edge = uniqueMeshEdgeList[ j ];

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
    //console.log( "AnimEdge count: ", scene000.animEdges.length );



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
    var scene080D = FindSceneByName( "SH080D_PRE" );

    for( var i=0; i<scene080D.sceneObjectsArray.length; i++ )
    {
        var so = scene080D.sceneObjectsArray[i];

        // We will need physics array for all the circles
        //
        var asp = new PX.AnimScenePhysics();
        asp.vel = new THREE.Vector3();
        asp.accel = new THREE.Vector3();
        asp.originalPos = new THREE.Vector3();
        scene080D.physics.push( asp );

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
            so.material.destR = tmpMat.color.r;
            so.material.destG = tmpMat.color.g;
            so.material.destB = tmpMat.color.b;
        } 
        else
        {
            so.material.side = THREE.DoubleSide;                    
        }

        scene080D.physics[i].originalPos = scene080D.sceneObjectsArray[i].position.clone();
    }

    scene080D.rDsk1 = scene080D.FindObject( "rDsk1" );
    scene080D.gDsk1 = scene080D.FindObject( "gDsk1" );
    scene080D.bDsk1 = scene080D.FindObject( "bDsk1" );
    scene080D.yDsk1 = scene080D.FindObject( "yDsk1" );

    scene080D.rDsk1OriginalPos = scene080D.rDsk1.position.clone();
    scene080D.gDsk1OriginalPos = scene080D.gDsk1.position.clone();
    scene080D.bDsk1OriginalPos = scene080D.bDsk1.position.clone();
    scene080D.yDsk1OriginalPos = scene080D.yDsk1.position.clone();

    scene080D.rDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene080D.rDsk1.position );
    scene080D.gDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene080D.gDsk1.position );
    scene080D.bDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene080D.bDsk1.position );
    scene080D.yDsk1PosDiff = new THREE.Vector3( 0, 0, 300 ).sub( scene080D.yDsk1.position );




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

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);


    // Add first running scene to main scene
    //
    for( var ii=0; ii<PX.AnimSceneArray.length; ii++ )
    {
        scene.add( PX.AnimSceneArray[ ii ].scene );
        PX.AnimSceneArray[ ii ].HideAll( scene );
    }
    PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );

    var bgscene = FindSceneByName( "BACKGROUND" );
    bgscene.sceneObjectsArray[0].material.side = THREE.DoubleSide;
    bgscene.sceneObjectsArray[0].position.set( 0, 0, 0 );
    bgscene.sceneObjectsArray[0].scale.set( 1, 1, 1 );
    bgscene.sceneObjectsArray[0].updateMatrix();
    bgscene.sceneObjectsArray[0].visible = true;
    scene.add( bgscene.sceneObjectsArray[0] );
    
    

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
		uniforms: { DiffuseMap: { type: "t", value: gradientRT } }
		, vertexShader: document.getElementById( "GradSphereVertex" ).textContent
		, fragmentShader: document.getElementById( "DefaultTextureFragment" ).textContent
	} );
 
    var sceneSH070B_080D = FindSceneByName( "SH070B_080D" );
    var bgSphere = sceneSH070B_080D.FindObject( "grad_sphere" );
    bgSphere.material = gradientViewShader;
    bgSphere.material.needsUpdate = true;



    // Foreground scene
    //

    fgScene = new THREE.Scene();
    fgCamera = new THREE.Camera();
    fgScene.add( fgCamera );

    // Add top-to-bottom line that splits the views
    //
    var splitLineGeom = new THREE.Geometry();
    splitLineGeom.vertices.push( new THREE.Vector3( 0, 1, 1 ) );
    splitLineGeom.vertices.push( new THREE.Vector3( 0, -1, 1 ) );
    var splitLineMaterial = new THREE.LineBasicMaterial( { color: 0x75787B } );
    splitLineMaterial.depthWrite = false;
    splitLineMaterial.depthTest = false;
    var splitLineMesh = new THREE.Line( splitLineGeom, splitLineMaterial );
    fgScene.add( splitLineMesh );

    // First call of controls update
    controls.update( 0.016 );

    //console.log( renderer.info );

    // Resize event
    window.addEventListener('resize', resize, false);
    setTimeout( resize, 1 );
    setTimeout( UpdateControls, 0 );

    currentTime = 0.0;
    clock.start();
}


function SaveHeadTrackedPositions( dt )
{
    headTrackCountTime += dt;
    
    var pos = ConvertPosToLatLon( headDir.x, headDir.y, headDir.z, 1 ); //headRadius );
    pos.x /= 180.0;  //
    pos.y /= 360.0;  // Normalize coordinates
    pos.x = 2 * pos.x - 1;
    pos.y = 2 * pos.y - 1;

    currentHeadPos.x = pos.y * -1;
    currentHeadPos.y = pos.x;
    currentHeadPos.z = 1;

    if( headTrackCountTime >= headTrackTriggerTime )
    {
        headTrackCountTime = 0.0;

        var isValid = true;
        for( var i=0; i<headTrackPositionArray.length; i++ )
        {
            var p = headTrackPositionArray[i];
            var pDir = p.clone().sub( currentHeadPos );
            var pLenSq = ( pDir.x*pDir.x + pDir.y*pDir.y );
            if( pLenSq <= (PX.kBadgeMarkMinDistance*PX.kBadgeMarkMinDistance) )
            {
                isValid = false;
                break;
            }
        }

        if( isValid )
        {
            var newPos = new THREE.Vector3();
            newPos.set( currentHeadPos.x, currentHeadPos.y, PX.kBadgeStartRadius );
            headTrackPositionArray.push( newPos );
        } 
     }
}


function UpdateControls()
{
    controls.update( frameTime );
}

function UpdateShotsSH000( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];

    var userObj = currentScene.FindObject( "user" );

    if( currentScene.state === 0 )
    {
        for( var i=0; i<kStartButtonCount; i++ )
        {
            var startObj = currentScene.FindObject( "start" + (i+1) );
            startObj.scale.set( 0.001, 0.001, 0.001 );
        }

        userObj.scale.set( 0.001, 0.001, 0.001 );
        currentScene.state = 1;

        console.log( "PX.AssetsDatabase.SoundMainLoop.play" );
        PX.AssetsDatabase.SoundMainLoop.fadeIn( 1.0, PX.kSoundFadeInTime );
        currentSoundSample = PX.AssetsDatabase.SoundMainLoop;
    }
    else if( currentScene.state === 1 )
    {
        userObj.position.x = camera.position.x - headDir.x * PX.kUserCursorDistance;
        userObj.position.y = camera.position.y - headDir.y * PX.kUserCursorDistance;
        userObj.position.z = camera.position.z - headDir.z * PX.kUserCursorDistance;
        userObj.scale.x += frameTime;
        userObj.scale.y += frameTime;
        userObj.scale.z += frameTime;
        userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
        userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
        userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

        for( var i=0; i<kStartButtonCount; i++ )
        {
            var startName = "start" + (i+1);
            var startObj = currentScene.FindObject( startName );

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
            currentScene.state = 2;
        }

    }
    else if( currentScene.state === 2 )
    {
        userObj.position.x = camera.position.x - headDir.x * PX.kUserCursorDistance;
        userObj.position.y = camera.position.y - headDir.y * PX.kUserCursorDistance;
        userObj.position.z = camera.position.z - headDir.z * PX.kUserCursorDistance;

        var enableUserScale = false;
        for( var i=0; i<kStartButtonCount; i++ )
        {
            var startObj = currentScene.FindObject( "start" + (i+1) );

            // Check Start and User meshes if they collide
            // If so, grow User slowly and change material color
            //
            var dir = userObj.position.clone();
            dir.subVectors( userObj.position, startObj.position );
            var dirLen = dir.length();
            var scaleSpeed = 0.33 * 4;
            //console.log( i, dirLen );
            if( dirLen < 35
                && currentScene.state === 2
                )
            {
                currentScene.startMeshIndex = i;
                currentScene.startMeshScaleStartTime = currentTime;
                currentScene.state++;
                enableUserScale = true;
                break;
            }
        }
    }
    else if( currentScene.state === 3 )
    {
        // Move circles to y=0 and then scale down before moving to next sceen
        //
        var startObj = currentScene.FindObject( "start" + (currentScene.startMeshIndex+1) );

        var currSceneTime = currentTime - currentScene.startMeshScaleStartTime;

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
            currentScene.state++;
        }
    }
    else if( currentScene.state === 4 )
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
            var startObj = currentScene.FindObject( startName );

            startObj.scale.x -= frameTime*4;
            startObj.scale.y -= frameTime*4;
            startObj.scale.z -= frameTime*4;

            startObj.scale.x = PX.Clamp( startObj.scale.x, 0.001, 1.0 );
            startObj.scale.y = PX.Clamp( startObj.scale.y, 0.001, 1.0 );
            startObj.scale.z = PX.Clamp( startObj.scale.z, 0.001, 1.0 );
        }

        if( userObj.scale.x <= 0.001 )
        {
            currentScene.state++;
        }
    }

    // Orient start buttons
    //
    for( var i=0; i<kStartButtonCount; i++ )
    {
        var startObj = currentScene.FindObject( "start"+(i+1) );
        startObj.lookAt( camera.position );
        startObj.updateMatrix();
    }
    userObj.updateMatrix();

    if( currentScene.state === 5 )
    {
        controls.autoAlign = true;
        currentScene.RemoveFrom( scene );
        PX.currentAnimName = "SH020_060B";
        // Get next scene
        PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        console.log( "PX.AssetsDatabase.SoundMainLoop.fadeOut" );
        PX.AssetsDatabase.SoundMainLoop.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
        {
            console.log( "PX.AssetsDatabase.SoundMainLoop.stop" );
            PX.AssetsDatabase.SoundMainLoop.stop();
        });
        console.log( "PX.AssetsDatabase.SoundAnim1.play" );
        //PX.AssetsDatabase.SoundAnim1.play();
        PX.AssetsDatabase.SoundAnim1.fadeIn( 1.0, PX.kSoundFadeInTime );
        currentSoundSample = PX.AssetsDatabase.SoundAnim1;
    }    
}

function UpdateShotsSH020_060B( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];

    // Orient all cubes to face the camera
    //
    for( var i=0; i<currentScene.sceneObjectsArray.length; i++ )
    {
        var so = currentScene.sceneObjectsArray[ i ];

        if( so.name.substr( 1, 4 ) === "Cube" 
            || so.name.substr( 1, 3 ) === "Dsk" 
            )
        {
            //console.log( so.name );
            so.lookAt( camera.position ); 
            so.updateMatrix();
        }
    }

    currentScene.AnimateWithAccumRotation( currentTimeMillis, effect );


    // When finished move on to next scene
    if( currentScene.IsFinished() )
    {
        currentScene.RemoveFrom( scene );
        PX.currentAnimName = "SH060B_070B";
        // Next scene
        PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        console.log( "PX.AssetsDatabase.SoundAnim1.fadeOut" );
        PX.AssetsDatabase.SoundAnim1.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
        {
        console.log( "PX.AssetsDatabase.SoundAnim1.stop" );
            PX.AssetsDatabase.SoundAnim1.stop();
        });
        console.log( "PX.AssetsDatabase.SoundMainLoop.play" );
        PX.AssetsDatabase.SoundMainLoop.fadeIn( 1.0, PX.kSoundFadeInTime );
        currentSoundSample = PX.AssetsDatabase.SoundMainLoop;
    }    
}

function UpdateShotsSH060B_070B( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];
    var sceneTime = currentTimeMillis - currentScene.startTime;

    if( ! currentScene.isPaused )
    {
        currentScene.AnimateWithRotation( currentTimeMillis, effect );
    } 
    else
    {
        currentScene.AnimateWithRotation( currentScene.pauseStartTime, effect );
    }


    //
    if( currentScene.mesh !== null )
    {
        var lastSphereToScale = currentScene.FindObject( "gSph28" );
        var rSph1 = currentScene.FindObject( "rSph1" );
        var rSph1Conn = null; 
        //var connsCount = 0;
        for( var i=0; i<currentScene.animEdges.length; i++ )
        {
            var animEdge = currentScene.animEdges[ i ];
                 
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
                    && animEdge.activeId === 0
                    )
                {
                    animEdge.activeId = 1;
                    //animEdge.t = THREE.Math.randFloat( -0.5, -0.1 );
                }


                if( animEdge.activeId === 0 )
                {
                    currentScene.mesh.geometry.vertices[ animEdge.ai ] = animEdge.bv;
                    currentScene.mesh.geometry.vertices[ animEdge.bi ] = animEdge.bv;                        
                }
                else if( animEdge.activeId === 1 )
                {
                    animEdge.t += frameTime * 4.0;
                    var newP = new THREE.Vector3();
                    PX.LerpVector3( newP, animEdge.av, animEdge.bv, PX.Saturate( animEdge.t ) );
                    currentScene.mesh.geometry.vertices[ animEdge.ai ] = animEdge.av;
                    currentScene.mesh.geometry.vertices[ animEdge.bi ] = newP;

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
                        animEdge.bs = 0.5;
                        animEdge.activeId = 2;

                        //console.log( "+--+", animEdge.a.material.color.r, animEdge.a.material.color.g, animEdge.a.material.color.b );
                        //console.log( animEdge.b.material.color.r, animEdge.b.material.color.g, animEdge.b.material.color.b );
                    }
                }
                else
                {
                        animEdge.bs -= frameTime * 2.0;
                        animEdge.bs = PX.Clamp( animEdge.bs, 0.0, 10.0 );
                }
            } 
            //else
            //{
            //    console.log( " animEdge has an invalid connection. bail out" );
            //}

            animEdge.b.scale.x += animEdge.bs;
            animEdge.b.scale.y += animEdge.bs;
            animEdge.b.scale.z += animEdge.bs;
            animEdge.b.updateMatrix();                
        }
        currentScene.mesh.geometry.verticesNeedUpdate = true;


        // when it reaches a certain point in anim, pause it and move to next state
        // HARDCODED: scale threshold
        if( lastSphereToScale.scale.x >= 1.268
            && currentScene.state === 0
            )
        {
            currentScene.isPaused = true;
            currentScene.pauseStartTime = currentTimeMillis;
            currentScene.state = 1;
            //console.log( "state 1", currentTimeMillis );
        }

        // Only when last red sphere is connected that it moves on with animation
        if( rSph1Conn !== null )
        {
            if( rSph1Conn.activeId > 0
                && currentScene.state === 1
                //&& connsCount === (currentScene.animEdges.length-3)
                )
            {
                currentScene.isPaused = false;
                currentScene.startTime += ( currentTimeMillis - currentScene.pauseStartTime );
                currentScene.state = 2;

                console.log( "PX.AssetsDatabase.SoundMainLoop.fadeOut" );
                PX.AssetsDatabase.SoundMainLoop.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
                {
                    console.log( "PX.AssetsDatabase.SoundMainLoop.stop" );
                    PX.AssetsDatabase.SoundMainLoop.stop();
                });
                console.log( "PX.AssetsDatabase.SoundAnim2.play" );
                PX.AssetsDatabase.SoundAnim2.fadeIn( 1.0, PX.kSoundFadeInTime );
                currentSoundSample = PX.AssetsDatabase.SoundAnim2;
            }
        }
            
        if( currentScene.state === 2 )
        {
            currentScene.mesh.material.opacity -= frameTime * 1.0;
            currentScene.mesh.material.opacity = PX.Saturate( currentScene.mesh.material.opacity );
        }
    }


    // When finished move on to next scene
    if( currentScene.IsFinished() )
    {
        currentScene.RemoveFrom( scene );
        // Next scene
        PX.currentAnimName = "SH070B_080D";
        PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
    }    
}

function UpdateShotsSH070B_080D( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];

    // Orient all texts to face the camera
    //
    for( var i=0; i<currentScene.sceneObjectsArray.length; i++ )
    {
        var so = currentScene.sceneObjectsArray[ i ];
        if( so.name.substr( 1, 3 ) === "Dsk" )
        {
            so.lookAt( camera.position ); 
        }
    }

    currentScene.Animate( currentTimeMillis, effect );

    // When finished move on to next scene
    if( currentScene.IsFinished() )
    {
        //console.log( "switch to SH080D" );
        currentScene.RemoveFrom( scene );
        // Next scene
        PX.currentAnimName = "SH080D_PRE";
        PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
    }    
}

function UpdateShotsSH080D( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];
    var currSceneTimeMillis = currentTimeMillis - currentScene.startTime;

    var rDsk1 = currentScene.rDsk1;
    var gDsk1 = currentScene.gDsk1;
    var bDsk1 = currentScene.bDsk1;
    var yDsk1 = currentScene.yDsk1;

    if( currentScene.state === 0 )
    {
        currentScene.Animate( currentTimeMillis, effect );

        if( currentScene.IsFinished() )
        {
            console.log( "PX.AssetsDatabase.SoundAnim2.fadeOut" );
            PX.AssetsDatabase.SoundAnim2.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
            {
                console.log( "PX.AssetsDatabase.SoundAnim2.stop" );
                PX.AssetsDatabase.SoundAnim2.stop();
            });
            console.log( "PX.AssetsDatabase.SoundMainLoop.play" );
            PX.AssetsDatabase.SoundMainLoop.fadeIn( 1.0, PX.kSoundFadeInTime );
            currentSoundSample = PX.AssetsDatabase.SoundMainLoop;
            currentScene.state = 1;
        }
    }
    else
    {
        if( currentScene.state === 1 )
        {
            currentScene.state = 2;
        }
        else if( currentScene.state === 2 )
        {
            // Apply physics
            var minRadius = 300.0;

            if( currentScene.repulsionFirstTime )
            {
                currentScene.repulsionPos = headDir.clone().multiplyScalar( -minRadius );
                currentScene.prevRepulsionPos = currentScene.repulsionPos.clone();
                currentScene.repulsionFirstTime = false;
            } 
            else
            {
                currentScene.prevRepulsionPos = currentScene.repulsionPos.clone();
                currentScene.repulsionPos = headDir.clone().multiplyScalar( -minRadius );
            }
            var repDir = currentScene.prevRepulsionPos.sub( currentScene.repulsionPos );
            var repDirNorm = repDir.clone().normalize();
            var repLen = PX.Saturate( repDir.lengthSq() * 10 );

            var repulsionPos = currentScene.repulsionPos;
            //var dotAAA = repulsionPos.clone().normalize().dot( PX.ZAxis );
            //var aaaPlus = PX.Saturate( dotAAA * 8 ) + 0.01;
            var minRadius2 = minRadius * 0.15 * 0.3; // * repLen; // * aaaPlus;
            var minRadius2Sq = minRadius2 * minRadius2;

            if( ! currentScene.autoColorFlag )
                currentScene.autoColorRadius += (repLen*1.0);

            if( repLen > 0.5
                && ! currentScene.autoColorFlag )
            {
                currentScene.autoColorFlag = true;
            }
            else if( currentScene.autoColorFlag )
            {
                currentScene.autoColorRadius += frameTime * 5;
            }

            var minmin = currentScene.autoColorRadius * currentScene.autoColorRadius;
            //console.log( minmin );


            for( var i=0; i<currentScene.sceneObjectsArray.length; i++ )
            {
                var so = currentScene.sceneObjectsArray[i];
                var soPos = so.position;

                if( so.name === "rDsk1"
                    || so.name === "gDsk1"
                    || so.name === "bDsk1"
                    || so.name === "yDsk1"
                    )
                {
                    continue;
                }

                var phy = currentScene.physics[ i ];

                var dx = soPos.x - repulsionPos.x;
                var dy = soPos.y - repulsionPos.y;
                var dz = 0;//soPos.z - repulsionPos.z; // Assume a infinite cylindrical force field

                var distanceSqr = ( dx*dx + dy*dy + dz*dz );
                var autoDistanceSqr = ( dx*dx + dy*dy );

                if( autoDistanceSqr <= minmin
                    && phy.changed === false
                    )
                {
                    var invd = ( 1.0 / autoDistanceSqr );
                    dx *= invd;
                    dy *= invd;
                    dz *= invd;

                    phy.accel.x += dx * .02;
                    phy.accel.y += dy * .02;
                    phy.accel.z += dz * .02;
                    //PX.ClampVector3( phy.accel, -1, 1 );
                }
                if( distanceSqr <= minRadius2Sq 
                    //|| autoDistanceSqr <= minmin
                    //&& phy.changed === false
                    )
                {
                    var invd = ( 1.0 / (distanceSqr) );
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
                    currentScene.activeCircleCount++;
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
                    phy.accel.z -= 0.5;
                    //so.position.z -= 60;
                    currentScene.activeCircleCount++;
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

            if( currentScene.activeCircleCount >= (currentScene.sceneObjectsArray.length-8) )
            {
                currentScene.state = 3;
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
            //rpY.z += currentScene.yDsk1OriginalPos.z * 0.93;
            rotOffset = THREE.Math.degToRad( 90.0 );
            rpG.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
            rpG.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
            //rpG.z = currentScene.gDsk1OriginalPos.z * 0.91;
            rotOffset = THREE.Math.degToRad( 270.0 );
            rpR.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
            rpR.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
            //rpR.z = currentScene.rDsk1OriginalPos.z * 0.90;
            rotOffset = THREE.Math.degToRad( 0.0 );
            rpB.x += Math.cos( rotSpeed + rotOffset ) * rotRadius;
            rpB.y += Math.sin( rotSpeed + rotOffset ) * rotRadius;
            //rpB.z = currentScene.bDsk1OriginalPos.z * 0.92;

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
            currentScene.rDsk1.lookAt( camera.position );
            currentScene.gDsk1.lookAt( camera.position );
            currentScene.bDsk1.lookAt( camera.position );
            currentScene.yDsk1.lookAt( camera.position );

            rDsk1.updateMatrix();
            gDsk1.updateMatrix();
            bDsk1.updateMatrix();
            yDsk1.updateMatrix();
        }
        else if( currentScene.state === 3 )
        {
            // Apply physics
            var avgVel = 0.0;
            var minRadius = 300.0;
            for( var i=0; i<currentScene.sceneObjectsArray.length; i++ )
            {
                var so = currentScene.sceneObjectsArray[i];
                var soPos = so.position;

                var phy = currentScene.physics[ i ];

                var strength = 0.15;
                if( so.name === "rDsk1"
                    || so.name === "gDsk1"
                    || so.name === "bDsk1"
                    || so.name === "yDsk1"
                    )
                {
                    var ddddir = phy.originalPos.clone().sub( soPos );
                    var llllen = PX.Saturate( ddddir.length() * 0.1 );
                    phy.damp = 1 - llllen;
                    strength = 0.075 * 0.5;

                    avgVel += ddddir.length();
                    //console.log( "----", ddddir.length() );
                }
                else
                {
                    phy.damp = 0.7;
                }

                phy.accel.x += ( phy.originalPos.x - soPos.x ) * strength;
                phy.accel.y += ( phy.originalPos.y - soPos.y ) * strength;
                phy.accel.z += ( phy.originalPos.z - soPos.z ) * strength;

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

            avgVel = avgVel / (currentScene.sceneObjectsArray.length);
            //console.log( avgVel );
            if( avgVel <= frameTime*0.333 )
            //if( avgVel < 0.0 )
            {
                //console.log( "switch scene again" );
                currentScene.RemoveFrom( scene );
                // Next scene
                PX.currentAnimName = "SH090A_110B";
                PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
                PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
                PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
                PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
                console.log( "PX.AssetsDatabase.SoundMainLoop.fadeOut" );
                PX.AssetsDatabase.SoundMainLoop.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
                {
                    console.log( "PX.AssetsDatabase.SoundMainLoop.stop" );
                    PX.AssetsDatabase.SoundMainLoop.stop();
                });
                console.log( "PX.AssetsDatabase.SoundAnim3.play" );
                PX.AssetsDatabase.SoundAnim3.fadeIn( 1.0, PX.kSoundFadeInTime );
                currentSoundSample = PX.AssetsDatabase.SoundAnim3;
            }
        }
    }
}

function UpdateShotsSH090A_110B( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];

    // Orient all disks to face the camera
    //
    for( var i=0; i<currentScene.sceneObjectsArray.length; i++ )
    {
        var so = currentScene.sceneObjectsArray[ i ];
        if( so.name.substr( 1, 3 ) === "Dsk" )
        {
            so.lookAt( camera.position );
        }
    }

    if( currentScene.state === 0 )
    {
        currentScene.state = 1;
    } 

    if( currentScene.state === 1 )
        currentScene.Animate( currentTimeMillis, effect );

    // When finished move on to next scene
    if( currentScene.IsFinished() 
        && currentScene.state === 1 )
    {
        currentScene.startTime = currentTimeMillis;
        currentScene.state = 2;
    }

    var sceneTimeMillis = ( currentTimeMillis - currentScene.startTime );
    if( currentScene.state === 2 
        && ( sceneTimeMillis > 6000.0 ) 
        )
    {
        DrawBadgeCanvas();

        currentScene.RemoveFrom( scene );
        // Next scene
        PX.currentAnimName = "SHBADGE";
        PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );
        PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
        PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
        PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;
        console.log( "PX.AssetsDatabase.SoundAnim3.fadeOut" );
        PX.AssetsDatabase.SoundAnim3.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
        {
            console.log( "PX.AssetsDatabase.SoundAnim3.stop" );
            PX.AssetsDatabase.SoundAnim3.stop();
        });
        console.log( "PX.AssetsDatabase.SoundMainLoop.play" );
        PX.AssetsDatabase.SoundMainLoop.fadeIn( 1.0, PX.kSoundFadeInTime );
        currentSoundSample = PX.AssetsDatabase.SoundMainLoop;
    }    
}


function UpdateShotsSHBADGE( currentTimeMillis )
{
    var currentScene = PX.AnimSceneArray[ PX.currentAnimIndex ];
    var sceneTimeSecs = ( currentTimeMillis - currentScene.startTime ) * 0.001;

    var imageObj = currentScene.FindObject( "image" );
    var infoObj = currentScene.FindObject( "info" );
    var userObj = currentScene.FindObject( "user" );
    var replayObj = currentScene.FindObject( "replay" );
    var shareObj = currentScene.FindObject( "share" );

    if( currentScene.state === 0 )
    {
        imageObj.material.map.generateMipmaps = true;
        imageObj.material.map.needsUpdate = true;
        imageObj.scale.set( 0.001, 0.001, 0.001 );
        infoObj.scale.set( 0.001, 0.001, 0.001 );
        replayObj.scale.set( 0.001, 0.001, 0.001 );
        shareObj.scale.set( 0.001, 0.001, 0.001 );
        userObj.scale.set( 0.001, 0.001, 0.001 );
        currentScene.state = 1;
    }
    else if( currentScene.state === 1 )
    {
        userObj.position.x = camera.position.x - headDir.x * PX.kUserCursorDistance;
        userObj.position.y = camera.position.y - headDir.y * PX.kUserCursorDistance;
        userObj.position.z = camera.position.z - headDir.z * PX.kUserCursorDistance;
        userObj.scale.x += frameTime;
        userObj.scale.y += frameTime;
        userObj.scale.z += frameTime;
        userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
        userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
        userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

        imageObj.scale.x = PX.Clamp( 3.0*(sceneTimeSecs-1.0), 0.001, 1.0 );
        imageObj.scale.y = PX.Clamp( 3.0*(sceneTimeSecs-1.0), 0.001, 1.0 );
        imageObj.scale.z = PX.Clamp( 3.0*(sceneTimeSecs-1.0), 0.001, 1.0 );

        infoObj.scale.x = PX.Clamp( 3*(sceneTimeSecs-0.5), 0.001, 1.0 );
        infoObj.scale.y = PX.Clamp( 3*(sceneTimeSecs-0.5), 0.001, 1.0 );
        infoObj.scale.z = PX.Clamp( 3*(sceneTimeSecs-0.5), 0.001, 1.0 );

        shareObj.scale.x += frameTime*2;
        shareObj.scale.y += frameTime*2;
        shareObj.scale.z += frameTime*2;
        shareObj.scale.x = PX.Clamp( shareObj.scale.x, 0.001, 1.0 );
        shareObj.scale.y = PX.Clamp( shareObj.scale.y, 0.001, 1.0 );
        shareObj.scale.z = PX.Clamp( shareObj.scale.z, 0.001, 1.0 );

        replayObj.scale.x += frameTime*2;
        replayObj.scale.y += frameTime*2;
        replayObj.scale.z += frameTime*2;
        replayObj.scale.x = PX.Clamp( replayObj.scale.x, 0.001, 1.0 );
        replayObj.scale.y = PX.Clamp( replayObj.scale.y, 0.001, 1.0 );
        replayObj.scale.z = PX.Clamp( replayObj.scale.z, 0.001, 1.0 );

        if( userObj.scale.x >= 1.0 
            && imageObj.scale.x >= 1.0
            && infoObj.scale.x >= 1.0
            && shareObj.scale.x >= 1.0 
            && replayObj.scale.x >= 1.0 
            )
        {
            currentScene.state = 2;
        }

    }
    else if( currentScene.state === 2 )
    {
        userObj.position.x = camera.position.x - headDir.x * PX.kUserCursorDistance;
        userObj.position.y = camera.position.y - headDir.y * PX.kUserCursorDistance;
        userObj.position.z = camera.position.z - headDir.z * PX.kUserCursorDistance;

        // Check Replay/Share and User meshes if they collide
        // If so, grow User slowly and change material color
        //
        var dir = userObj.position.clone();
        dir.subVectors( userObj.position, replayObj.position );
        var dirLenSq = dir.lengthSq();
        var scaleSpeed = 0.33 * 4;
        if( dirLenSq < 30*30 )
        {
            replayObj.scale.x += frameTime*0.33;
            replayObj.scale.y += frameTime*0.33;
            replayObj.scale.z += frameTime*0.33;

            if( replayObj.scale.x > 1.5 )
            {
                currentScene.startMeshIndex = 0; // ( replay )
                currentScene.state++;
            }
        } 
        else
        {
            replayObj.scale.x -= frameTime*4;
            replayObj.scale.y -= frameTime*4;
            replayObj.scale.z -= frameTime*4;
            replayObj.scale.x = PX.Clamp( replayObj.scale.x, 1.0, 1.5 );
            replayObj.scale.y = PX.Clamp( replayObj.scale.y, 1.0, 1.5 );
            replayObj.scale.z = PX.Clamp( replayObj.scale.z, 1.0, 1.5 );

            currentScene.startMeshScaleStartTime = 0;
        }

        // SHARE
        dir.subVectors( userObj.position, shareObj.position );
        dirLenSq = dir.lengthSq();
        scaleSpeed = 0.33 * 4;
        if( dirLenSq < 30*30 )
        {
            shareObj.scale.x += frameTime*0.33;
            shareObj.scale.y += frameTime*0.33;
            shareObj.scale.z += frameTime*0.33;

            if( shareObj.scale.x > 1.5 )
            {
                currentScene.startMeshIndex = 1; // ( share )
                currentScene.state++;
            }
        }
        else
        {
            shareObj.scale.x -= frameTime*4;
            shareObj.scale.y -= frameTime*4;
            shareObj.scale.z -= frameTime*4;
            shareObj.scale.x = PX.Clamp( shareObj.scale.x, 1.0, 1.5 );
            shareObj.scale.y = PX.Clamp( shareObj.scale.y, 1.0, 1.5 );
            shareObj.scale.z = PX.Clamp( shareObj.scale.z, 1.0, 1.5 );
        }
    }
    else if( currentScene.state === 3 )
    {
        // Replay
        var ss = 0.5;
        var lenSq = 999;
        if( currentScene.startMeshIndex === 0 )
        {
            var dir = userObj.position.clone().sub( replayObj.position );
            lenSq = dir.lengthSq();
            //dir.normalize();
            //userObj.position.x -= dir.x * ss;
            //userObj.position.y *= 0.8;
            //userObj.position.z -= dir.z * ss;
            replayObj.position.x += ( userObj.position.x - replayObj.position.x ) * 0.09; //dir.x * ss;
            replayObj.position.y += ( userObj.position.y - replayObj.position.y ) * 0.09;
            replayObj.position.z += ( userObj.position.z - replayObj.position.z ) * 0.09; //dir.z * ss;

            userObj.scale.x *= 1.03;
            userObj.scale.y *= 1.03;
            userObj.scale.z *= 1.03;
        }
        // Share
        else
        {
            var dir = userObj.position.clone().sub( shareObj.position );
            lenSq = dir.lengthSq();
            //dir.normalize();                
            //userObj.position.x -= dir.x * ss;
            //userObj.position.y *= 0.8;
            //userObj.position.z -= dir.z * ss;
            shareObj.position.x += ( userObj.position.x - shareObj.position.x ) * 0.09; //dir.x * ss;
            shareObj.position.y += ( userObj.position.y - shareObj.position.y ) * 0.09;
            shareObj.position.z += ( userObj.position.z - shareObj.position.z ) * 0.09; //dir.z * ss;

            userObj.scale.x *= 1.03;
            userObj.scale.y *= 1.03;
            userObj.scale.z *= 1.03;
        }

        if( lenSq < 1 )
        {
            currentScene.state++;
        }
    }
    else if( currentScene.state === 4 )
    {
        userObj.scale.x -= frameTime*4;
        userObj.scale.y -= frameTime*4;
        userObj.scale.z -= frameTime*4;
        userObj.scale.x = PX.Clamp( userObj.scale.x, 0.001, 1.0 );
        userObj.scale.y = PX.Clamp( userObj.scale.y, 0.001, 1.0 );
        userObj.scale.z = PX.Clamp( userObj.scale.z, 0.001, 1.0 );

        replayObj.scale.x -= frameTime*4;
        replayObj.scale.y -= frameTime*4;
        replayObj.scale.z -= frameTime*4;
        replayObj.scale.x = PX.Clamp( replayObj.scale.x, 0.001, 1.0 );
        replayObj.scale.y = PX.Clamp( replayObj.scale.y, 0.001, 1.0 );
        replayObj.scale.z = PX.Clamp( replayObj.scale.z, 0.001, 1.0 );

        shareObj.scale.x -= frameTime*4;
        shareObj.scale.y -= frameTime*4;
        shareObj.scale.z -= frameTime*4;
        shareObj.scale.x = PX.Clamp( shareObj.scale.x, 0.001, 1.0 );
        shareObj.scale.y = PX.Clamp( shareObj.scale.y, 0.001, 1.0 );
        shareObj.scale.z = PX.Clamp( shareObj.scale.z, 0.001, 1.0 );

        imageObj.scale.x -= frameTime*4;
        imageObj.scale.y -= frameTime*4;
        imageObj.scale.z -= frameTime*4;
        imageObj.scale.x = PX.Clamp( imageObj.scale.x, 0.001, 1.0 );
        imageObj.scale.y = PX.Clamp( imageObj.scale.y, 0.001, 1.0 );
        imageObj.scale.z = PX.Clamp( imageObj.scale.z, 0.001, 1.0 );

        infoObj.scale.x -= frameTime*4;
        infoObj.scale.y -= frameTime*4;
        infoObj.scale.z -= frameTime*4;
        infoObj.scale.x = PX.Clamp( infoObj.scale.x, 0.001, 1.0 );
        infoObj.scale.y = PX.Clamp( infoObj.scale.y, 0.001, 1.0 );
        infoObj.scale.z = PX.Clamp( infoObj.scale.z, 0.001, 1.0 );

        if( userObj.scale.x <= 0.001 )
        {
            currentScene.state++;
        }
    }
    else if( currentScene.state === 5 )
    {
        // REPLAY
        if( currentScene.startMeshIndex === 0 )
        {
            ReplayFunc();

            currentScene.RemoveFrom( scene );
            // Next scene
            PX.currentAnimName = "SH000";
            PX.currentAnimIndex = FindSceneIndexByName( PX.currentAnimName );

            // PrepareSceneToBegin
            for( var ii=0; ii<PX.AnimSceneArray.length; ii++ )
            {
                scene.add( PX.AnimSceneArray[ ii ].scene );
                PX.AnimSceneArray[ ii ].HideAll( scene );
            }
            PX.AnimSceneArray[ PX.currentAnimIndex ].AddTo( scene );
            PX.AnimSceneArray[ PX.currentAnimIndex ].SetStartTime( currentTimeMillis );
            PX.AnimSceneArray[ PX.currentAnimIndex ].state = 0;

            var bgscene = FindSceneByName( "BACKGROUND" );
            bgscene.sceneObjectsArray[0].position.set( 0, 0, 0 );
            bgscene.sceneObjectsArray[0].scale.set( 1, 1, 1 );
            bgscene.sceneObjectsArray[0].updateMatrix();
            bgscene.sceneObjectsArray[0].visible = true;

            console.log( "PX.AssetsDatabase.SoundMainLoop.fadeOut" );
            PX.AssetsDatabase.SoundMainLoop.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
            {
                console.log( "PX.AssetsDatabase.SoundMainLoop.stop" );
                PX.AssetsDatabase.SoundMainLoop.stop();
            });
        }
        // SHARE
        else
        {
            currentScene.RemoveFrom( scene );
            console.log( "PX.AssetsDatabase.SoundMainLoop.fadeOut" );
            PX.AssetsDatabase.SoundMainLoop.fadeOut( 0.0, PX.kSoundFadeOutTime, function ()
            {
                console.log( "PX.AssetsDatabase.SoundMainLoop.stop" );
                PX.AssetsDatabase.SoundMainLoop.stop();
            });
            Shutdown();
        }
    }


    // Orient buttons
    //
    imageObj.updateMatrix();
    infoObj.updateMatrix();
    //replayObj.lookAt( camera.position );
    replayObj.updateMatrix();
    //shareObj.lookAt( camera.position );
    shareObj.updateMatrix();
    userObj.updateMatrix();    
}


function update(dt)
{
    var currentTimeMillis = currentTime * 1000.0;

    //resize();
    //camera.updateProjectionMatrix();


    // Update controls
    //
    UpdateControls();
    //controls.update( frameTime );


    headDir.set( 0, 0, 1 );
    headRight.set( 1, 0, 0 );
    headDir.applyQuaternion( camera.quaternion );
    //headDir.multiplyScalar( headRadius );
    headRight.applyQuaternion(camera.quaternion);
    headRight = headRight.normalize();


    // Save head positions every nth time
    //
    if( PX.currentAnimName.name !== "SHBADGE" )
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




    // Update scenes
    //
    if( PX.currentAnimName === "SH000" )
    {
        UpdateShotsSH000( currentTimeMillis );
    }
    if( PX.currentAnimName === "SH020_060B" )
    {
        UpdateShotsSH020_060B( currentTimeMillis );
    }
    if( PX.currentAnimName === "SH060B_070B" )
    {
        UpdateShotsSH060B_070B( currentTimeMillis );
    }
    if( PX.currentAnimName === "SH070B_080D" )
    {
        UpdateShotsSH070B_080D( currentTimeMillis );

        // Update gradient sphere's texture
        if( gradientState === 0 )
        {
            //, GradParams: { type: "v4", value: new THREE.Vector4( 10.0/gradSphereTexSize, 0.0, 0.0, 0.0 ) }
            //, Color1: { type: "v3", value: new THREE.Vector3( 0.0, 0.0, 0.0 ) }
            //, Color2: { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 1.0 ) }
            gradientShader.uniforms.GradParams.value.set( 10.0/gradSphereTexSize, 0.0, 0.0, 0.0 );
            gradientShader.uniforms.Time.value = 0.0;
            gradientShader.uniforms.Color1.value.set( 0.0, 0.0, 0.0 );
            gradientShader.uniforms.Color2.value.set( 1.0, 1.0, 1.0 );
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
    if( PX.currentAnimName === "SH080D_PRE" )
    {
        UpdateShotsSH080D( currentTimeMillis );
    }
    if( PX.currentAnimName === "SH090A_110B" )
    {
        UpdateShotsSH090A_110B( currentTimeMillis );
    }
    if( PX.currentAnimName === "SHBADGE" )
    {
        UpdateShotsSHBADGE( currentTimeMillis );
    }
}


function render()
{
    //renderer.clear();

    if( isFirstUpdate
        || PX.currentAnimName === "SH070B_080D"
        )
    {
        renderer.setViewport( 0, 0, gradSphereTexSize, gradSphereTexSize );
	    renderer.render( gradSphereScene, gradSphereCamera, gradientRT, true );        
    }

    // Render scene on screen
    effect.render( scene, camera );

    // fbScene also used to render the vertical line that splits the 2 eye views
    renderer.setViewport( 0, 0, windowWidth, windowHeight );
    renderer.render( fgScene, fgCamera );
}

function animate()
{
    animationFramedId = requestAnimationFrame( animate );

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
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    camera.aspect = windowWidth / windowHeight;
    camera.updateProjectionMatrix();
    effect.setSize( windowWidth, windowHeight );
}
