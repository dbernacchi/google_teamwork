/* global THREE: true } */

var PX = PX || {};

var progressBarElement = $("#progressBar");
var progressBarTextElement = $("#progressBarText");

//var OnLoadProgress = function (progress, result)
//{
//    console.log( "onloadprogress" );
//}

/*
var callbackProgress = function (progress, result)
{
    //var total = progress.totalModels + progress.totalTextures;
    //var loaded = progress.loadedModels + progress.loadedTextures;
    //var str = "Loading data: " + loaded + " / " + total;
    //progressBarTextElement.text( str );
    //console.log(str);

//LOG( "callbackProgress" );

//        var bar = 250,
//            total = progress.totalModels + progress.totalTextures,
//            loaded = progress.loadedModels + progress.loadedTextures;
//
//        if ( total )
//            bar = Math.floor( bar * loaded / total );
//
//        $( "bar" ).style.width = bar + "px";
//
//        count = 0;
//        for ( var m in result.materials ) count++;
//
//        handle_update( result, Math.floor( count/total ) );
};

var callbackSync = function (result)
{
    //LOG( "callbackSync" );
    //handle_update( result, 1 );
};
*/

function FindSceneByName( sceneName )
{
    for( var i=0; i<PX.AnimSceneArray.length; i++ )
    {
        if( PX.AnimSceneArray[i].name === sceneName )
            return PX.AnimSceneArray[i];
    }    
    return null;
}

function LoadSceneData( name, url )
{
    var defer = $.Deferred();

    //var scene0 = FindSceneByName( name );
    //if( scene0 !== null )
    //{
    //    var animScene = new PX.AnimScene();
    //    animScene.Init( name, scene0 );
    //    PX.AnimSceneArray.push( animScene );
    //    console.log( "+--+  Found scene loaded: " + name );
    //    return defer;
    //}

    //console.log( "+++ Load Scene: " + name );
    var loader = new THREE.SceneLoader();
    //loader.callbackSync = callbackSync;
    //loader.callbackProgress = callbackProgress;
    loader.load(url, function (result)
    //loader.load(url + "?" + new Date().getTime(), function (result)
    {
        // Load textures from scene
        var scene = result.scene;
        scene.autoUpdate = false;
        scene.traverse(function (object)
        {
            if( object instanceof THREE.Mesh )
            {
                object.matrixAutoUpdate = false;
                //object.matrixWorldNeedsUpdate = false;
                object.rotationAutoUpdate = false;
                object.frustumCulled = true;
                //object.geometry.computeBoundingSphere();

                if( object.name.substr(0, 3) === "txt" )
                {
	                var textMat = new THREE.ShaderMaterial( 
                    {
		                uniforms:
		                {
                            DiffuseMap: { type: "t", value: object.material.map }
                            , Alpha: { type: "f", value: 1.0 }
		                }
		                , vertexShader: PX.Shaders.GradSphereVertex
		                , fragmentShader: PX.Shaders.DefaultTextureUnPremultiplyFragment
		                , depthWrite: false
                        , transparent: true
                        , opacity: 1.0
	                } );
                    object.material = textMat;
                }

                object.material.side = THREE.DoubleSide;
            }

            
        });

        // Add to assets database
        PX.AssetsDatabase[ name ] = result;

        var animScene = new PX.AnimScene();
        animScene.Init( name, scene );
        PX.AnimSceneArray.push( animScene );

        defer.resolve();
    });
    return defer; //.promise();
}


function LoadJsonData( name, url )
{
    var defer = $.Deferred();
    //console.log( "+++ Load JSON: " + name, url );
    $.ajax( { scriptCharset: "utf-8" , contentType: "application/json; charset=unicode"} );
    $.getJSON( url, function( json )
    //$.getJSON( url+"?"+new Date().getTime(), function( json )
    {
        PX.AssetsDatabase[ name ] = json;
        //console.log( "+++ Loaded Json: " + name );
        defer.resolve();
    } );

    return defer; //.promise();
}

function LoadShaderData( name, url )
{
    var defer = $.Deferred();
    //console.log( "+--+ Loading: " + name, url );
    $.get( url, function(data)
    {
        PX.AssetsDatabase[ name ] = data;
        //console.log( "+--+ Loaded: " + name );
        defer.resolve();
    });
    return defer;
} 


function LoadTexture( name, url )
{
    var defer = $.Deferred();
    var loader = new THREE.TextureLoader();

    //LOG( "+++ Loading: " + name );
    loader.load( url, function( tex )
    {
        //tex.minFilter = THREE.LinearFilter;
        //tex.magFilter = THREE.LinearFilter;
        //tex.premultiplyAlpha = true;
        //tex.needsUpdate = true;

        PX.AssetsDatabase[name] = tex;
        //LOG( "+++ Loaded Texture: " + name );
        defer.resolve();
    } );
    return defer; //.promise();
}
