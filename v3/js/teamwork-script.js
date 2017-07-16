//var preloader = $('#preloader');

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



    //
    // Preloader message fade in
    //
    //preloader.fadeTo( 3000, 1 );


    //
    // Create WebGL renderer and load data
    //
	CreateRenderer();
	LoadData();
});
