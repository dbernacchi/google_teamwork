'user strict';

$(document).ready(function () {
    /*
     * Browser Compatibility Check
     */
    var is_mobile = 'no';
    var is_compatible = 'no';
    var agent = navigator.userAgent;

    //find Chrome Android v33 or greater
    if (agent.indexOf('Android') > -1) {
        var chrome = agent.indexOf('Chrome/');
        if (chrome > -1) {
            var version = agent.charAt(chrome + 7) + agent.charAt(chrome + 8);
            var versionInt = parseInt(version);
            if (versionInt >= 33) {
                is_compatible = 'yes';
                browser = 'mobile chrome v33+';
            }
        }
    }

    //find Mobile Safari v8 or greater
    if (agent.indexOf('AppleWebKit') > -1) {
        var safari = agent.indexOf('Version/');
        if (safari > -1) {
            var version = agent.charAt(safari + 8);
            var versionInt = parseInt(version);
            if (versionInt >= 8) {
                is_compatible = 'yes';
                browser = 'mobile safari v8+';
            }
        }
    }

    $('#is_compatible').html(is_compatible);

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // tasks to do if it is a Mobile Device
        is_mobile = 'yes';
    }

    $('#is_mobile').html(is_mobile);
    /*
     * Browser Compatibility Check END
     */


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
