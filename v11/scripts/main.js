'user strict';

$(document).ready(function(){
	var hidden = true;

	$("#assemble").on("click", function(elem){
		var me = $(this);
		if(hidden){
			// $("html").css("height","auto");
			me.removeClass("state-ready-to-expand");
			me.addClass("state-ready-to-collapse");
		}
		else{
			// $("html").css("height","100%");
			me.removeClass("state-ready-to-collapse");
			me.addClass("state-ready-to-expand");
		}

		hidden = !hidden;
	});

	$("#carousel").owlCarousel({
 
      //navigation : true, // Show next and prev buttons
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true
 
      // "singleItem:true" is a shortcut for:
      // items : 1, 
      // itemsDesktop : false,
      // itemsDesktopSmall : false,
      // itemsTablet: false,
      // itemsMobile : false
 
  });
 
});
