

//THREE.DefaultLoadingManager.onProgress = function (item, loaded, total)
//{
//    //console.log(item, loaded, total);
//    //var str = "Loading Files: " + ( ( loaded / total ) * 100 ) + " %";
//    //progressBarElement.text(str);
//};

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

function LoadSceneData( name, url )
{
    var defer = $.Deferred();
    //console.log( "+++ Load Scene: " + name );
    var loader = new THREE.SceneLoader();
    //loader.callbackSync = callbackSync;
    //loader.callbackProgress = callbackProgress;
    loader.load(url, function (result)
    //loader.load(url + "?" + new Date().getTime(), function (result)
    {
        // Load textures from scene
        var scene_ = result.scene;
/***        scene_.autoUpdate = false;
        scene_.traverse(function (object)
        {
//                if( object instanceof THREE.Light )
//                {
//                    LOG( "******** Light at: " + url );
//                }

            if (object instanceof THREE.Mesh) 
            {
                //object.frustumCulled = false;
//                if (object.material) {
//                    object.material.shading = THREE.FlatShading;
////                        if( object.material.map )
////                        {
////                            object.material.map.minFilter = THREE.LinearFilter;
////                            object.material.map.magFilter = THREE.LinearFilter;
////                            object.material.map.needsUpdate = true;
////                        }
//                    object.material.needsUpdate = true;
//                }
//                        if( staticData[ object.material.map.sourceFile ] == null )
//                        {
//                            //LOG( "******* Loading material diffuse name : " + object.material.map.sourceFile );
//                            staticData[ object.material.map.sourceFile ] = THREE.ImageUtils.loadTexture( object.material.map.sourceFile+"?"+new Date().getTime() );
//                            object.material.map = staticData[ object.material.map.sourceFile ];
//                            object.material.needsUpdate = true;
//                        }
//                        else
//                        {
//                            //LOG( "******* Diffuse map was found in the library. Reference it: " + object.material.map.sourceFile );
//                            object.material.map = staticData[ object.material.map.sourceFile ];
//                        }
//                    }
//
//                    if( object.material.lightMap )
//                    {
//                        if( staticData[ object.material.lightMap.sourceFile ] == null )
//                        {
//                            //LOG( "******* Loading lightmap diffuse name : " + object.material.lightMap.sourceFile );
//                            staticData[ object.material.lightMap.sourceFile ] = THREE.ImageUtils.loadTexture( object.material.lightMap.sourceFile+"?"+new Date().getTime() );
//                            object.material.lightMap = THREE.ImageUtils.loadTexture( object.material.lightMap.sourceFile );
//                            object.material.needsUpdate = true;
//                        }
//                        else
//                        {
//                            //LOG( "******* Lightmap was found in the library. Reference it: " + object.material.lightMap.sourceFile );
//                            object.material.lightMap = staticData[ object.material.lightMap.sourceFile ];
//                        }
//                    }
            }
        });
****/
        scene_.scale.x = scene_.scale.y = scene_.scale.z = kGlobalScale;
        scene_.updateMatrix();

        // Add to assets database
        AssetsDatabase[ name ] = result;

        var animScene = new PX.AnimScene();
        animScene.Init( name, scene_ );
        AnimSceneArray.push( animScene );

        defer.resolve();
    });
    return defer;
}


function LoadJsonData( name, url )
{
    var defer = $.Deferred();
    //console.log( "+++ Load JSON: " + name );
    $.ajax( { scriptCharset: "utf-8" , contentType: "application/json; charset=unicode"} );
    //$.getJSON( url, function( json )
    $.getJSON( url+"?"+new Date().getTime(), function( json )
    {
        AssetsDatabase[ name ] = json;
        //console.log( "+++ Loaded Json: " + name );
        defer.resolve();
    } );

    return defer;
}

function LoadTexture( name, url )
{
    var defer = $.Deferred();
    var loader = new THREE.TextureLoader();

    // r67
    //LOG( "+++ Loading: " + name );
    loader.load( url, function( tex )
    {
        //tex.minFilter = THREE.LinearFilter;
        //tex.magFilter = THREE.LinearFilter;
        //tex.needsUpdate = true;

        AssetsDatabase[name] = tex;
        //LOG( "+++ Loaded Texture: " + name );
        defer.resolve();
    } );
    return defer;
}
