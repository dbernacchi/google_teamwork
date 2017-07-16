/* global THREE: true } */

var PX = PX || {}; 

PX.ParseAnimationFromMemory = function( json, tracks )
{
    for( var j=0; j<json.length; j++ )
    {
        var track = new AnimationTrack();

        track.name = json[j].name; //["name"];
        track.lengthInFrames = json[j].frames; //["frames"];
        track.lengthInMillis = 0.0;
        track.hasRotation = json[j].hasRotation;
        //console.log( track.name );
        //console.log( track.lengthInFrames );

        //// FBX cameras for some reason point on the X direction, so we need to rotate
        var rotQuat = new THREE.Quaternion();
        rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), PX.ToRadians(90) );

        for( var i=0; i<track.lengthInFrames; i++ )
        {
            var quat = null;
            var time = json[j].anim[i].t;
            var pos  = json[j].anim[i].T;
            var scal = json[j].anim[i].S;
            if( track.hasRotation )
                quat = json[j].anim[i].Q;
            //var mat = filename[ "animation"][i].M;
            //LOG( time );
             
            var kf = new KeyFrame();
            kf.time = time;
            kf.position = new THREE.Vector3( pos[0], pos[1], pos[2] );
            kf.scale = new THREE.Vector3( scal, scal, scal );
            //kf.scale = new THREE.Vector3( scal[0], scal[1], scal[2] );
            if( track.hasRotation )
                kf.orientation = new THREE.Quaternion( quat[0], quat[1], quat[2], quat[3] );
            //kf.orientation = new THREE.Quaternion( quat[3], quat[2], quat[1], quat[0] );
            //kf.orientation = kf.orientation.multiply( rotQuat );
            //kf.transform = new THREE.Matrix4( mat[0], )
            track.keyframes.push( kf );

            track.lengthInMillis = time;
        }
        //console.log( track.lengthInMillis );

        tracks.push( track );

        //LOG( "length in frames: " + track.lengthInFrames );
        //LOG( "length in millis: " + track.lengthInMillis );
    }
};


PX.Edge = function ()
{
    this.ai = null;
    this.bi = null;      // objects connected by this edge
};

PX.AnimEdge = function ()
{
    this.a = null;
    this.b = null;      // objects connected by this edge
    this.ai = -1;
    this.bi = -1;       // vertex indices
    this.av = null;
    this.bv = null;     // vertex positions to lerp 
    this.t = 0.0;       // t for the animation
    this.active = false;
};

PX.AnimScenePhysics = function ()
{
    this.vel = null;
    this.accel = null;
    this.originalPos = null;
    this.damp = 0.985;
    this.changed = false;
};

PX.AnimScene = function()
{
    this.name = null;
    this.animationTracks = [];
    this.animationInfoArray = [];
    this.sceneObjectsArray = [];
    this.scene = null;
    this.isFinished = false;
    this.isInteractive = false;
    this.startTime = 0.0;
    this.loop = false;

    this.state = 0;

    this.autoCountTime = 0.0;
    this.autoTriggerTime = 5.0; // 5 seconds and it turns auto mode on

    this.physics = [];

    this.startMeshIndex = -1;
    this.startMeshScaleStartTime = 0.0;

    //this.meshGeoSphereRef = null;
    this.meshEdgeList = [];
    this.uniqueMeshEdgeList = [];
    this.meshLineMaterial = null;
    this.meshGeometry = null;
    this.mesh = null;
    this.animEdges = [];

    // 080D changed material circle count
    this.activeCircleCount = 0;
    this.repulsionPos = new THREE.Vector3();
    this.prevRepulsionPos = new THREE.Vector3();
    this.repulsionFirstTime = true;
    this.autoColorFlag = false;
    this.autoColorRadius = 0.0;

    this.greyMaterial = null;

    this.pauseStartTime = 0.0;
    this.isPaused = false;

    this.rDsk1 = null;
    this.gDsk1 = null;
    this.bDsk1 = null;
    this.yDsk1 = null;
    this.rDsk1PosDiff = null;
    this.gDsk1PosDiff = null;
    this.bDsk1PosDiff = null;
    this.yDsk1PosDiff = null;
};


PX.AnimScene.prototype =
{
    constructor: PX.AnimScene

    , Init: function( name, scene )
    {
        this.name = name;
        this.scene = scene;

        // Have to make a temp list here as "this" inside the traverse points to the scene or root so it seems
        //
        var objList = [];
        scene.traverse(function(object)
        {
            if( object instanceof THREE.Object3D )
            {
                if( object.name ) 
                    objList.push( object );
            }
        });

        // Copy temp list to our object list
        //
        for( var i=0; i<objList.length; i++ )
        {
            this.sceneObjectsArray.push( objList[i] );
        }


        // Array of physics structures for use in some scenes.
        // Allocate a few so we don't have to do it later
        for( i=0; i<this.sceneObjectsArray.length; i++ )
        {
            var asp = new PX.AnimScenePhysics();
            asp.vel = new THREE.Vector3();
            asp.accel = new THREE.Vector3();
            asp.originalPos = new THREE.Vector3();

            this.physics.push( asp );
        }
    }

    // Sets animation files and prepares AnimScene 
    //
    , SetAnimation: function()
    {
        if( this.isInteractive )
            return ;

        PX.ParseAnimationFromMemory( PX.AssetsDatabase[ this.name+"_anim" ], this.animationTracks );
        for( var i=0; i<this.animationTracks.length; i++ )
        {
            var animInfo = new AnimatedInfo();
            animInfo.position = new THREE.Vector3();
            animInfo.scale = new THREE.Vector3();
            animInfo.name = this.animationTracks[i].name;
            //console.log( animInfo.name );
            for( var j=0; j<this.sceneObjectsArray.length; j++ )
            {
                if( this.sceneObjectsArray[j].name === this.animationTracks[i].name )
                {
                    animInfo.meshRef = this.sceneObjectsArray[j];
                    break;
                }
            }
            this.animationInfoArray.push( animInfo );
        }
        this.Animate( 0.0, null );
    }

    // Animate this scene
    //
    , Animate: function( timeInMillis, stereoEffect )
    {
        var counter = 0;

        //for( var i=0; i<this.animationTracks.length; i++ )
        //{
        //    var animTrack = this.animationTracks[ i ];
        //    var animInfo = this.animationInfoArray[ i ];

        //    if( stereoEffect !== null )
        //    {
        //        var rad = animInfo.meshRef.geometry.boundingSphere.radius * animInfo.meshRef.scale.x;
        //        //console.log( rad );
        //        if( stereoEffect.ContainsPoint( animInfo.meshRef.position ) )
        //        //if( stereoEffect.ContainsSphere( animInfo.meshRef.position, rad ) )
        //        {
        //            animTrack.dirty = true;
        //            counter++;
        //        }
        //    }
        //}

        for( var i=0; i<this.animationTracks.length; i++ )
        {
            var animTrack = this.animationTracks[ i ];
            var animInfo = this.animationInfoArray[ i ];

            // Update associated mesh with keyframed animation 
            //if( animTrack.dirty === true )
            //if( animInfo.meshRef !== null )
            //{
                var aTime = timeInMillis - this.startTime;
                //if( aTime < 0.0 ) aTime = 0.0;
                animTrack.Animate( aTime, animInfo, this.loop );

                animInfo.meshRef.position.x = animInfo.position.x;
                animInfo.meshRef.position.y = animInfo.position.y;
                animInfo.meshRef.position.z = animInfo.position.z;

                animInfo.meshRef.scale.x = animInfo.scale.x;
                animInfo.meshRef.scale.y = animInfo.scale.y;
                animInfo.meshRef.scale.z = animInfo.scale.z;

                if( animTrack.hasRotation )
                {
                    animInfo.meshRef.setRotationFromQuaternion( animInfo.orientation );
                }
            
                /*/
                var rad = animInfo.meshRef.geometry.boundingSphere.radius * animInfo.scale.x * 10;
                if( stereoEffect !== null )
                {
                    //if( stereoEffect.ContainsPoint( animInfo.position ) )
                    if( stereoEffect.ContainsSphere( animInfo.position, rad ) )
                    {
                        animInfo.meshRef.updateMatrix();
                        counter ++;
                    }
                }
                /*/
                animInfo.meshRef.updateMatrix();
                /**/

                //animTrack.dirty = false;
            //}
        }

        //console.log( "visible anim tracks: ", counter, this.animationTracks.length );

    }

    , SetStartTime: function( t )
    {
        this.startTime = t;
    }

    , FindObject: function( name )
    {
        for( var i=0; i<this.sceneObjectsArray.length; i++ )
        {
            if( this.sceneObjectsArray[i].name === name )
                return this.sceneObjectsArray[i];
        }     
        return null;
    }

    , IsFinished: function()
    {
        // Check only first one. As all tracks have same size, only need to check one
        return this.animationInfoArray[0].isFinished;
    }

    , AddTo: function( scene )
    {
        for( var i=0; i<this.sceneObjectsArray.length; i++ )
            this.sceneObjectsArray[i].visible = true;
        scene.visible = true;
    }

    , HideAll: function( scene )
    {
        for( var i=0; i<this.sceneObjectsArray.length; i++ )
            this.sceneObjectsArray[i].visible = false;
        scene.visible = false;
    }

    , RemoveFrom: function( scene )
    {
        this.HideAll( scene );
        scene.remove( this.scene );
    }

};
