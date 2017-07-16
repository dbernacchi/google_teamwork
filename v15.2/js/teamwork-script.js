
//var progressElement = $("#progress");
var progressBarElement = $("#progressBar");
//var startButtonElement = $("#startButton");

$( document ).ready( function()
{
	// check for safari

	//var ua = navigator.userAgent.toLowerCase();
	//if (ua.indexOf('safari') !== -1)
    //{
	//	if (ua.indexOf('chrome') > -1)
    //    {
	//		// Chrome
	//	} 
    //    //else
    //    //{
	//	//	// Safari
	//	//	//$('#text #bottomText #statsTwitter p #twitterText').css('bottom', '-1px');
	//	//}
	//}

    //// Center progress
    //var yoff = progressElement.height();
    //var xoff = progressElement.width();
    //progressElement.css( "left", ( window.innerWidth*0.5 - xoff*0.5 ) );
    //progressElement.css( "top", ( window.innerHeight*0.5 - yoff*0.5 ) );

    //// Center START button
    //yoff = startButtonElement.height();
    //xoff = startButtonElement.width();
    //rhw = window.innerWidth*0.5 - xoff*0.5;
    //rhh = window.innerHeight*0.5 - yoff*0.5;
    //startButtonElement.css( "left", ( window.innerWidth*0.5 - xoff*0.5 ) );
    //startButtonElement.css( "top", ( window.innerHeight*0.5 - yoff*0.5 ) );

    //
    // Create WebGL renderer and load data
    //
    //
    // Preloader message fade in
    //
    progressBarElement.fadeTo( 1500, 1, function ()
    {
    	CreateRenderer();
    	LoadData();
    });
});
