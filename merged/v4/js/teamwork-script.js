
var progressBarElement = $("#progressBar");

$( document ).ready( function()
{
    // Preloader message fade in
    //
    progressBarElement.fadeTo( 1500, 1, function ()
    {
    	CreateRenderer();
    	LoadData();
    });
});
