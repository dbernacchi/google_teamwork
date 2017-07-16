
var PX = {}; 

// Constants
//

var kCameraLens = 35.0;
var kGlobalScale = 1.0;

var XAxis = new THREE.Vector3(1, 0, 0);
var YAxis = new THREE.Vector3(0, 1, 0);
var ZAxis = new THREE.Vector3(0, 0, 1);
var XAxisNeg = new THREE.Vector3(-1, 0, 0);
var YAxisNeg = new THREE.Vector3(0, -1, 0);
var ZAxisNeg = new THREE.Vector3(0, 0, -1);


// Resources
//

var AssetsDatabase = [];
var AnimSceneArray = []; 
var currentAnimIndex = 0;
var currentAnimName = null;


function FindSceneByName( sceneName )
{
    for( var i=0; i<AnimSceneArray.length; i++ )
    {
        if( AnimSceneArray[i].name === sceneName )
            return AnimSceneArray[i];
    }    
    return null;
}

function FindSceneIndexByName( sceneName )
{
    for( var i=0; i<AnimSceneArray.length; i++ )
    {
        if( AnimSceneArray[i].name === sceneName )
            return i;
    }    
    return -1;
}

function FindSceneNameByIndex( index )
{
    return AnimSceneArray[ index ].name;
}


//
//

function ToDegrees( x )
{
    return x * (180.0 / Math.PI);
}

function ToRadians( x )
{
    return x * (Math.PI / 180.0);
}

function Lerp( a, b, t )
{
    //return b*t + (a - t*a);
    return (a + t*(b - a) );
}

function Saturate( x )
{
    if( x < 0.0 ) return 0.0;
    if( x > 1.0 ) return 1.0;
    return x;
}

function Clamp( x, a, b )
{
    return Math.max( a, Math.min( x, b ) );
    //if( x < a ) return a;
    //if( x > b ) return b;
    //return x;
}

function LerpVector3( a, b, t )
{
    var v = new THREE.Vector3();
    v.x = Lerp(a.x, b.x, t );
    v.y = Lerp(a.y, b.y, t );
    v.z = Lerp(a.z, b.z, t );
    return v;
}

function Smoothstep( edge0, edge1, x )
{
    // Scale, bias and saturate x to 0..1 range
    x = Saturate( (x - edge0) / (edge1 - edge0) );
    // Evaluate polynomial
    return x*x*(3 - 2*x);
}
