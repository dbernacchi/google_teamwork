

function ParseAnimationFromMemory( json, tracks )
{
    for( var j=0; j<json.length; j++ )
    {
        var track = new AnimationTrack();

        track.name = json[j].name; //["name"];
        track.lengthInFrames = json[j].frames; //["frames"];
        track.lengthInMillis = 0.0;
        //console.log( track.name );
        //console.log( track.lengthInFrames );

        //// FBX cameras for some reason point on the X direction, so we need to rotate
        //var rotQuat = new THREE.Quaternion();
        //rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ToRadians(90));

        for( var i=0; i<track.lengthInFrames; i++ )
        {
            var time = json[j].animation[i].time;
            var pos = json[j].animation[i].T;
            var scal = json[j].animation[i].S;
            //var quat = filename["animation"][i].Q;
            //var mat = filename[ "animation"][i].M;
            //LOG( time );
             
            var kf = new KeyFrame();
            kf.time = time;
            kf.position = new THREE.Vector3( pos[0], pos[1], pos[2] );
            kf.scale = new THREE.Vector3( scal[0], scal[1], scal[2] );
            //kf.orientation = new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3]);
            //kf.orientation.multiply(rotQuat);
            //kf.transform = new THREE.Matrix4( mat[0], )
            track.keyframes.push( kf );

            track.lengthInMillis = time;
        }
        //console.log( track.lengthInMillis );

        tracks.push( track );

        //LOG( "length in frames: " + track.lengthInFrames );
        //LOG( "length in millis: " + track.lengthInMillis );
    }
}



PX.AnimScenePhysics = function ()
{
    this.vel = null;
    this.accel = null;
    this.damp = 0.985;
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
        for( i=0; i<64; i++ )
        {
            var asp = new PX.AnimScenePhysics();
            asp.vel = new THREE.Vector3();
            asp.accel = new THREE.Vector3();

            this.physics.push( asp );
        }
    }

    // Sets animation files and prepares AnimScene 
    //
    , SetAnimation: function()
    {
        if( this.isInteractive )
            return ;

        ParseAnimationFromMemory( AssetsDatabase[ this.name+"_anim" ], this.animationTracks );
        for( var i=0; i<this.animationTracks.length; i++ )
        {
            var ai = new AnimatedInfo();
            this.animationInfoArray.push( ai );
        }
        this.Animate( 0.0 );
    }

    // Animate this scene
    //
    , Animate: function( timeInMillis )
    {
        for( var j=0; j<this.sceneObjectsArray.length; j++ )
        {
            var mesh = this.sceneObjectsArray[j];

            for( var i=0; i<this.animationTracks.length; i++ )
            {
                var ai = this.animationInfoArray[ i ];
                var aTime = timeInMillis-this.startTime;
                if( aTime < 0.0 ) aTime = 0.0;
                this.animationTracks[i].Animate( aTime, ai, this.loop );
                if( mesh.name === ai.name )
                {
                    mesh.position.x = ai.position.x;
                    mesh.position.y = ai.position.y;
                    mesh.position.z = ai.position.z;

                    mesh.scale.x = ai.scale.x;
                    mesh.scale.y = ai.scale.y;
                    mesh.scale.z = ai.scale.z;

                    break;
                }
            }                
        }
    }

    , SetStartTime: function ( t )
    {
        this.startTime = t;
    }

    , FindObject: function( name_ )
    {
        for( var i=0; i<this.sceneObjectsArray.length; i++ )
        {
            if( this.sceneObjectsArray[i].name === name_ )
                return this.sceneObjectsArray[i];
        }     
        return null;
    }

    , IsFinished: function()
    {
        return this.animationInfoArray[0].isFinished;
    }

    , AddTo: function ( scene )
    {
        scene.add( this.scene );
    }

    , RemoveFrom: function ( scene )
    {
        scene.remove( this.scene );
    }

};
