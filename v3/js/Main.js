var progressBarElement = $("#progressBar");
//var progressBarTextElement = $("#progressBar #progressBarText");

function ConvertPosToLatLon(x, y, z, radius)
{
//    var lat = 90.0 - (Math.acos(y / radius)) * 180.0 / Math.PI;
//    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0) - 180.0;
    var lat = (Math.acos(y / radius)) * 180.0 / Math.PI;
    var lon = ((270.0 + (Math.atan2(x , z)) * 180.0 / Math.PI) % 360.0);
    return new THREE.Vector2( lat, lon );
}

var camera, scene, renderer;
var effect, controls;
var element, container;
var windowWidth, windowHeight;
var deviceContentScale = 1.0;

var fgCamera;
var fgScene;

var currentTime = 0.0;
//var lastClockTime = 0.0;
var frameTime = 0.0;
var clock = new THREE.Clock();

var headTrackGeometry;
var headTrackMaterial;
var headTrackMesh;

var isFirstUpdate = true;

var headRadius = 1.0;
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

function CreateRenderer()
{
    renderer = new THREE.WebGLRenderer({ antialias: true, precision: "mediump", stencil: false, alpha: 1 });
    renderer.setClearColor( 0xffffff, 1 );
    //renderer.gammaOutput = true;
    element = renderer.domElement;
    container = document.getElementById( "glContainer" );
    container.appendChild(element);
    container.width = window.innerWidth;// * window.devicePixelRatio;
    container.height = window.innerHeight;// * window.devicePixelRatio;
    container.style.width = window.innerWidth;
    container.style.height = window.innerHeight;
    renderer.setSize( container.width, container.height);
    
    windowWidth = container.width;
    windowHeight = container.height;
    deviceContentScale = renderer.devicePixelRatio;
}

function LoadData()
{
    // Prepare Anim Scene
    var sh000AnimScene = new PX.AnimScene();
    AnimSceneArray.push( sh000AnimScene );

    currentAnimName = FindSceneNameByIndex( currentAnimIndex );

    $.when(
        LoadSceneData( "SH010_LtoR", "animations/sh010_LtoR_sphere_01.js")
        , LoadSceneData( "SH010_RtoL", "animations/sh010_LtoR_sphere_01.js")
        , LoadSceneData( "SH020", "animations/sh020-50a_02.js")
        , LoadJsonData( "SH020_anim", "animations/sh020-50a_02.fbx.js" )
        , LoadJsonData( "SH010_LtoR_anim", "animations/sh010_LtoR_sphere_01.fbx.js" )
        , LoadJsonData( "SH010_RtoL_anim", "animations/sh010_RtoL_sphere_01.fbx.js" )
        , LoadTexture( "startButtonTexture", "textures/start.png" )
    ).done(function ()
    {

        // Create entrance scene manually
        //
        var sh000Scene = new THREE.Scene();

        var startTexture = AssetsDatabase.startButtonTexture;
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
        startMesh.position.y = 0.0;
        startMesh.position.z = 350.0;
        sh000Scene.add( startMesh );

        var userMaterial = new THREE.MeshBasicMaterial( {
            color: 0x75787B,
        });
        var userGeometry = new THREE.SphereGeometry( 7, 16, 16 );
        var userMesh = new THREE.Mesh( userGeometry, userMaterial );
        userMesh.name = "user";
        userMesh.position.z = 350.0;
        sh000Scene.add( userMesh );

        // Add scene to AnimScene array
        sh000AnimScene.isInteractive = true;
        sh000AnimScene.Init( "SH000", sh000Scene );


        // Set animations for all scenes. Only does the non-interactive ones
        //
        for( var i=0; i<AnimSceneArray.length; i++ )
        {
            var as = AnimSceneArray[i];
            as.SetAnimation();
            //console.log( "Scene name: " + as.name );
        }

        init();
        resize();
        animate();
    });
}

function init()
{
    effect = new THREE.StereoEffect( renderer );
    //effect.separation = 0.2;
    effect.focalLength = 45;
    effect.setSize( windowWidth, windowHeight );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 1000 );
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
    function setOrientationControls(e) {
        if (!e.alpha) {
            return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();
        controls.isPhoneAvailable = true;

        element.addEventListener('click', fullscreen, false );

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);


    //var light0 = new THREE.HemisphereLight( 0xffffff, 0x0, 0.6 );
    //var light1 = new THREE.DirectionalLight( 0x777777, 0.6 );
    //light1.position.set( 1, 1, 1 );
    //scene.add( light0 ); 
    //scene.add( light1 );


    //var texture = THREE.ImageUtils.loadTexture(
    //    'textures/pattern1blackdiffuse.jpg'
    //);
    //texture.wrapS = THREE.RepeatWrapping;
    //texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat = new THREE.Vector2(3, 3);
    //texture.anisotropy = renderer.getMaxAnisotropy();

    //var material = new THREE.MeshPhongMaterial({
    //    color: 0xffffff,
    //    specular: 0xffffff,
    //    shininess: 20,
    //    shading: THREE.FlatShading,
    //    map: texture
    //});
    //material.side = THREE.BackSide;
    //var geometry = new THREE.BoxGeometry( 900, 900, 900 );
    //var mesh = new THREE.Mesh(geometry, material);
    //mesh.rotation.x = -Math.PI / 2;
    //scene.add( mesh );

    AnimSceneArray[ currentAnimIndex ].AddTo( scene );


    //// Compute scene's BBox
    ////
    //var minX=99999, minY=99999, minZ=999999;
    //var maxX=-99999, maxY=-999999, maxZ=-9999999;
    //scene.traverse(function (object)
    //{
    //    if (object instanceof THREE.Object3D)
    //    {
    //        object.traverse(function (mesh)
    //        {
    //            if (mesh instanceof THREE.Mesh)
    //            {
    //                mesh.geometry.computeBoundingBox();
    //                var bBox = mesh.geometry.boundingBox;

    //                // compute overall bbox
    //                minX = Math.min(minX, bBox.min.x);
    //                minY = Math.min(minY, bBox.min.y);
    //                minZ = Math.min(minZ, bBox.min.z);
    //                maxX = Math.max(maxX, bBox.max.x);
    //                maxY = Math.max(maxY, bBox.max.y);
    //                maxZ = Math.max(maxZ, bBox.max.z);
    //            }
    //        });
    //    }
    //});
    ////console.log('+--+  Scene bounding box coordinates: ' +
    ////    '(' + minX + ', ' + minY + ', ' + minZ + '), ' +
    ////    '(' + maxX + ', ' + maxY + ', ' + maxZ + ')');


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
    var splitLineMaterial = new THREE.LineBasicMaterial( { color: 0xcacaca } );
    var splitLineMesh = new THREE.Line( splitLineGeom, splitLineMaterial );
    fgScene.add( splitLineMesh );


    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);

    fullscreen();
}


function SaveHeadTrackedPositions( dt )
{
    headTrackCountTime += dt;

    headDir.set( 0, 0, 1 );
    headRight.set( 1, 0, 0 );
    headDir.applyQuaternion( camera.quaternion );
    headDir.multiplyScalar( headRadius );
    headRight.applyQuaternion(camera.quaternion);
    headRight = headRight.normalize();
    
    var pos = ConvertPosToLatLon( headDir.x, headDir.y, headDir.z, headRadius );
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
    AnimSceneArray[ currentAnimIndex ].Animate( currentTimeMillis );
    if( AnimSceneArray[ currentAnimIndex ].IsFinished()
        && ( ! AnimSceneArray[ currentAnimIndex ].isInteractive )
        )
    {
        //console.log( "+--+  Animation is complete" );        

        AnimSceneArray[ currentAnimIndex ].RemoveFrom( scene );
        if( currentAnimIndex < AnimSceneArray.length-1 )
            currentAnimIndex++;
        AnimSceneArray[ currentAnimIndex ].AddTo( scene );
        AnimSceneArray[ currentAnimIndex ].startTime = currentTimeMillis;
    }
*/

    // Update controls
    //
    controls.update( dt );


    // Save head positions every nth time
    //
    SaveHeadTrackedPositions( dt );


    // SH000 Control 
    //
    if( currentAnimIndex === 0 ) //AnimSceneArray[ currentAnimIndex ].name === "SH000" )
    {
        var startObj = AnimSceneArray[ currentAnimIndex ].FindObject( "start" );
        var userObj = AnimSceneArray[ currentAnimIndex ].FindObject( "user" );
        if( userObj !== null )
        {
            var depthDistance = 350.0;
            userObj.position.x = camera.position.x - headDir.x * depthDistance;
            userObj.position.y = camera.position.y - headDir.y * depthDistance;
            userObj.position.z = camera.position.z - headDir.z * depthDistance;
        }

        // Check Start and User meshes if they collide
        // If so, grow User slowly and change material color
        //
        var dir = userObj.position.clone();
        dir.subVectors( userObj.position, startObj.position );
        var dirLen = dir.length();
        var scaleSpeed = 0.33 * 4;
        if( dirLen < 5*3.5 
            && AnimSceneArray[ currentAnimIndex ].state === 0 
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


        if( AnimSceneArray[ currentAnimIndex ].state === 0 )
        {
            userObj.scale.x = Clamp( userObj.scale.x, 1.0, userObj.scale.x );
            userObj.scale.y = Clamp( userObj.scale.y, 1.0, userObj.scale.y );
            userObj.scale.z = Clamp( userObj.scale.z, 1.0, userObj.scale.z );            
        } 
        else if( AnimSceneArray[ currentAnimIndex ].state === 1 )
        {
            userObj.scale.x = Clamp( userObj.scale.x, 0.001, userObj.scale.x );
            userObj.scale.y = Clamp( userObj.scale.y, 0.001, userObj.scale.y );
            userObj.scale.z = Clamp( userObj.scale.z, 0.001, userObj.scale.z );

            startObj.scale.x -= frameTime * scaleSpeed * 3;
            startObj.scale.y -= frameTime * scaleSpeed * 3;
            startObj.scale.z -= frameTime * scaleSpeed * 3;
            startObj.scale.x = Clamp( startObj.scale.x, 0.001, startObj.scale.x );
            startObj.scale.y = Clamp( startObj.scale.y, 0.001, startObj.scale.y );
            startObj.scale.z = Clamp( startObj.scale.z, 0.001, startObj.scale.z );
            if( userObj.scale.x <= 0.001 )
            {
                // Change scene state
                AnimSceneArray[ currentAnimIndex ].state = 2;
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
            AnimSceneArray[ currentAnimIndex ].state = 1;
        }

        if( AnimSceneArray[ currentAnimIndex ].state === 2 )
        {
            AnimSceneArray[ currentAnimIndex ].RemoveFrom( scene );
                
            currentAnimName = "SH010_RtoL";
            currentAnimIndex = FindSceneIndexByName( currentAnimName );

            AnimSceneArray[ currentAnimIndex ].AddTo( scene );
            AnimSceneArray[ currentAnimIndex ].SetStartTime( currentTimeMillis );
            AnimSceneArray[ currentAnimIndex ].state = 0;
            //progressBarElement.text( "switch scene to: " + AnimSceneArray[ currentAnimIndex ].name );            
        }
    }


    if( currentAnimName === "SH010_LtoR"
        || currentAnimName === "SH010_RtoL" )
    {
        var as = AnimSceneArray[ currentAnimIndex ];
        var lSphere = null;
        var rSphere = null;
        //AnimSceneArray[ currentAnimIndex ].autoCountTime += dt;
        ////console.log( AnimSceneArray[ currentAnimIndex ].autoCountTime );
        //if( AnimSceneArray[ currentAnimIndex ].autoCountTime >= AnimSceneArray[ currentAnimIndex ].autoTriggerTime 
        //    && AnimSceneArray[ currentAnimIndex ].state == 0 )
        //{
        //    AnimSceneArray[ currentAnimIndex ].SetStartTime( currentTimeMillis );
        //    AnimSceneArray[ currentAnimIndex ].state = 1;
        //}


        // First setup the scene for entrance animation
        //
        if( AnimSceneArray[ currentAnimIndex ].state === 0 )
        {
            lSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "b1_Rsphere" );            
            lSphere.scale.set( 0, 0, 0 );
            rSphere.scale.set( 0, 0, 0 );

            AnimSceneArray[ currentAnimIndex ].state = 1;
        }

        // Do entrance animation. Simply scale up circles to 1
        if( AnimSceneArray[ currentAnimIndex ].state === 1 )
        {
            lSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "b1_Rsphere" );            

            var sh010ScaleSpeed = 2.0;
            lSphere.scale.x += frameTime * sh010ScaleSpeed;
            lSphere.scale.y += frameTime * sh010ScaleSpeed;
            lSphere.scale.z += frameTime * sh010ScaleSpeed;
            rSphere.scale.x += frameTime * sh010ScaleSpeed;
            rSphere.scale.y += frameTime * sh010ScaleSpeed;
            rSphere.scale.z += frameTime * sh010ScaleSpeed;

            // Clamp values
            lSphere.scale.x = Saturate( lSphere.scale.x );
            lSphere.scale.y = Saturate( lSphere.scale.y );
            lSphere.scale.z = Saturate( lSphere.scale.z );
            rSphere.scale.x = Saturate( rSphere.scale.x );
            rSphere.scale.y = Saturate( rSphere.scale.y );
            rSphere.scale.z = Saturate( rSphere.scale.z );

            // When it hits maximum scale, switch state
            if( lSphere.scale.x >= 1.0 )
            {
                AnimSceneArray[ currentAnimIndex ].state = 2;
            }
        }

        // This state is interactive. Tilt your head to make circles overlap
        if( AnimSceneArray[ currentAnimIndex ].state === 2 )
        {
            var angle = 0.0;
            if( controls.isPhoneAvailable )
            {
                angle = controls.beta;
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

            lSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "g1_Lsphere" );
            rSphere = AnimSceneArray[ currentAnimIndex ].FindObject( "b1_Rsphere" );

            //if( lSphere && rSphere )
            {
                if( controls.isPhoneAvailable )
                {
                    lSphere.position.x += as.physics[0].vel.x;
                    rSphere.position.x += as.physics[1].vel.x;                    
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
            if( Math.abs( lSphere.position.x - rSphere.position.x ) < 10 )
            {
                AnimSceneArray[ currentAnimIndex ].state = 4;
            }
        }

/***
        var tiltTriggerAngle = 0.25;
        var angle = controls.beta;
        if( AnimSceneArray[ currentAnimIndex ].state === 0 && angle <= -tiltTriggerAngle )
        {
            //progressBarElement.text("left inclined  " + AnimSceneArray[ currentAnimIndex ].name );

            AnimSceneArray[ currentAnimIndex ].RemoveFrom( scene );
            currentAnimName = "SH010_RtoL";
            currentAnimIndex = FindSceneIndexByName( currentAnimName );
            AnimSceneArray[ currentAnimIndex ].AddTo( scene );
            AnimSceneArray[ currentAnimIndex ].SetStartTime( currentTimeMillis );
            AnimSceneArray[ currentAnimIndex ].state = 1;
        }
        else if( AnimSceneArray[ currentAnimIndex ].state === 0 && angle >= tiltTriggerAngle )
        {
            //progressBarElement.text("right inclined  " + AnimSceneArray[ currentAnimIndex ].name );
            AnimSceneArray[ currentAnimIndex ].RemoveFrom( scene );
            currentAnimName = "SH010_LtoR";
            currentAnimIndex = FindSceneIndexByName( currentAnimName );
            AnimSceneArray[ currentAnimIndex ].AddTo( scene );
            AnimSceneArray[ currentAnimIndex ].SetStartTime( currentTimeMillis );
            AnimSceneArray[ currentAnimIndex ].state = 1;
        }

        if( AnimSceneArray[ currentAnimIndex ].state === 1 )
        {
            AnimSceneArray[ currentAnimIndex ].Animate( currentTimeMillis );                        
            //console.log( AnimSceneArray[ currentAnimIndex ].animationInfoArray[0].position + " -- " + (currentTimeMillis-AnimSceneArray[ currentAnimIndex ].startTime) );
        }

        if( AnimSceneArray[ currentAnimIndex ].IsFinished()
            && ( AnimSceneArray[ currentAnimIndex ].state === 1 ) 
            )
        {
            AnimSceneArray[ currentAnimIndex ].state = 4;
        }
***/
    
        // Switch scenes now
        if( AnimSceneArray[ currentAnimIndex ].state === 4 )
        {
            AnimSceneArray[ currentAnimIndex ].RemoveFrom( scene );
            currentAnimName = "SH020";
            currentAnimIndex = FindSceneIndexByName( currentAnimName );
            AnimSceneArray[ currentAnimIndex ].AddTo( scene );
            AnimSceneArray[ currentAnimIndex ].SetStartTime( currentTimeMillis );
            AnimSceneArray[ currentAnimIndex ].state = 0;
            //console.log( AnimSceneArray[ currentAnimIndex ].scene.position );
        }
    }

    // SH020: Explosion, etc.
    if( currentAnimName === "SH020" )
    {
        AnimSceneArray[ currentAnimIndex ].Animate( currentTimeMillis );        
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

    frameTime = clock.getDelta();
    update( frameTime );
    render(); // frameTime );

    currentTime += frameTime;
}

function resize()
{
    //var dpr = window.devicePixelRatio;
    var width = window.innerWidth; // * dpr;
    var height = window.innerHeight; // * dpr;

    windowWidth = width;
    windowHeight = height;

    progressBarElement.text( width*deviceContentScale + " x " + height*deviceContentScale );

    camera.aspect = width / height;
    //camera.setLens( kCameraLens );
    camera.updateProjectionMatrix();

    //renderer.setSize( width, height );
    //renderer.setViewport( 0, 0, width, height );
    effect.setSize( width, height );
}
