/**
   Asynchronously fetches binary data

   url must have the same domain origin as the current page, or the
   server on which the url is hosted must include the string
   "Access-Control-Allow-Origin: *" in its response.

   successCallback: function(arrayBuffer) { ... }
   failureCallback: function(httpErrorCode) { ... }

   If you know the endianness of the data coming from the server
   matches the client CPU, or the data is 8-bit and so endianness
   does not matter, then successCallback can convert it to a typed
   JavaScript array directly:

   function success(arrayBuffer) {
      var data = new Uint8Array(arrayBuffer);
      ...
   }

   If you do not know that the endianness will be correct, then you
   must convert it, e.g.,

   function success(arrayBuffer) {
      var temp = new DataView(arrayBuffer);
      var data = new Float32Array(temp.byteLength / Float32Array.BYTES_PER_ELEMENT);
      for (var i = 0; i < data.length; ++i) {
         data[i] = data.getFloat32(i * Float32Array.BYTES_PER_ELEMENT, true);
      }   
   }

   Note that as of 2014, all mobile devices, new consoles, and new PCs
   happen to use little-endian processors, so in the short term one
   can assume little-endianness.

   For more information, see http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
 */
function RequestBinaryData( url, successCallback, failureCallback )
{
    var xhr = new XMLHttpRequest();
    xhr.open( 'GET', url, true );
    // Firefox requires this to be set after the open call
    xhr.responseType = "arraybuffer";

    xhr.onload = function( event )
    {
        if( xhr.status === 200 )
        {
            successCallback( xhr.response );
        } 
        else if( failureCallback ) 
        {
           	failureCallback( xhr.status );
        }
    };

    xhr.send();
}
