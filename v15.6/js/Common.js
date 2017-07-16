/* global THREE: true } */

// Resources
//

//var AssetsDatabase = [];
//var AnimSceneArray = []; 
//var currentAnimIndex = 0;
//var currentAnimName = null;



// PX Commons stuff
//
var PX = PX ||
{
    // Resources
    //

    AssetsDatabase: []
    , AnimSceneArray: []
    , currentAnimIndex: 0
    , currentAnimName: null

    , GeneratedImageData: null

    // Constants
    //

    , kColorArray: [ "#4285F4", "#DB4437", "#F4B400", "#0F9D58" ]

    , kCameraFovY: 45.0
    , kCameraNearPlane: 1.0
    , kCameraFarPlane: 3000.0
    , kGlobalScale: 1.0
    , kGlobalTimeScale: 1.0
    , kBadgeStartRadius: 15.0
    //, kBadgeAddRadius: 10.0
    , kBadgeMarkMinDistance: 0.1
    , kUserCursorDistance: 350.0

    , kSoundFadeInTime: 500.0
    , kSoundFadeOutTime: 500.0

    , XAxis: new THREE.Vector3(1, 0, 0)
    , YAxis: new THREE.Vector3(0, 1, 0)
    , ZAxis: new THREE.Vector3(0, 0, 1)
    , XAxisNeg: new THREE.Vector3(-1, 0, 0)
    , YAxisNeg: new THREE.Vector3(0, -1, 0)
    , ZAxisNeg: new THREE.Vector3(0, 0, -1)    

    , RAD_TO_DEG: (180.0 / Math.PI)
    , DEG_TO_RAD: (Math.PI / 180.0)

    , ToDegrees: function( x )
    {
        return x * PX.RAD_TO_DEG;
    }

    , ToRadians: function( x )
    {
        return x * PX.DEG_TO_RAD;
    }

    , Lerp: function( a, b, t )
    {
        //return b*t + (a - t*a);
        return (a + t*(b - a) );
    }

    , Saturate: function( x )
    {
        if( x < 0.0 ) return 0.0;
        if( x > 1.0 ) return 1.0;
        return x;
    }

    , Clamp: function( x, a, b )
    {
        return Math.max( a, Math.min( x, b ) );
    }

    , ClampVector3: function( res, a, b )
    {
        res.x = PX.Clamp( res.x, a, b );
        res.y = PX.Clamp( res.y, a, b );
        res.z = PX.Clamp( res.z, a, b );
    }

    , LerpVector3: function( res, a, b, t )
    {
        res.x = PX.Lerp( a.x, b.x, t );
        res.y = PX.Lerp( a.y, b.y, t );
        res.z = PX.Lerp( a.z, b.z, t );
    }

    , TweenCubic: function( t )
    {
        return t*t*t;
    }

    , Smoothstep: function( edge0, edge1, x )
    {
        // Scale, bias and saturate x to 0..1 range
        x = PX.Saturate( (x - edge0) / (edge1 - edge0) );
        // Evaluate polynomial
        return x*x*(3 - 2*x);
    }
};