'user strict';

$(document).ready(function () {
    if(!skipCheck){
        $("#main_container_top_id").removeClass("hide");
        $("#main_container_bottom_id").removeClass("hide");
    }
    
    $("#playagain").click(function () {
        window.location.href = "index.html";
    });

    var hidden = true;

    $("#assemble").on("click", function (elem) {
        var me = $(this);
        if (hidden) {
            $("html").css("height", "auto");
            me.removeClass("state-ready-to-expand");
            me.addClass("state-ready-to-collapse");
        }
        else {
            $("html").css("height", "100%");
            me.removeClass("state-ready-to-collapse");
            me.addClass("state-ready-to-expand");
        }

        hidden = !hidden;
    });

    $("#carousel").owlCarousel({
        //navigation : true, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true
    });

});
