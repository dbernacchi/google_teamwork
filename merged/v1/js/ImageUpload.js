var FbGMessage = "Check out my virtual journey at Teamwork, created using my head movements using Google Cardboard. #teamwork2015 http://teamwork2015.com/";
var TwitterMessage = "Check out this amazing virtual experience at Teamwork, using Google Cardboard";
var uploadedImageUrl = "";
var fbShareLink = "";
var tShareLink = "";
var socialShareUrl = "http://petgorilla.com/";

function UploadImage()
{
    $("#main_container_id").hide();
    $("#glContainer").hide();
    $("#remove_phone").removeClass("hide");
    
    var base64img = PX.GeneratedImageData;

    $.ajax({
        type: "POST",
        url: "http://teamwork.petgtest.com/badges/index.php",
        data: {img: encodeURIComponent(base64img)},
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        success: function (msg) {
            console.log(msg);
            uploadedImageUrl = msg;
            imageUploadedCallback(msg);
        }
    });
}

function imageUploadedCallback(msg) {
    $("#remove_phone").hide();
    $("#share-screen").removeClass("hide");

    //Facebook share button
    //FbGMessage = FbGMessage + " " + msg;

    fbShareLink = "https://www.facebook.com/dialog/feed?";
    fbShareLink += "app_id=787409934680006";
    fbShareLink += "&display=popup";
    fbShareLink += "&caption=" + encodeURIComponent("Caption");
    fbShareLink += "&link=" + encodeURIComponent(socialShareUrl);
    fbShareLink += "&picture=" + encodeURIComponent(msg);
    fbShareLink += "&description=" + encodeURIComponent(FbGMessage); //upper text
    fbShareLink += "&redirect_uri=" + encodeURIComponent(socialShareUrl);

    //new version - doesn't work as expected
//    fbShareLink = "http://www.facebook.com/sharer/sharer.php?s=100";
//    fbShareLink += "&p[url]=" + socialShareUrl;
//    fbShareLink += "&p[images][0]=" + msg;
//    fbShareLink += "&p[title]=" + encodeURIComponent("TeamWork2015Title");
//    fbShareLink += "&p[summary]=" + encodeURIComponent("" + FbGMessage);

    $("#fbshare").attr("href", fbShareLink);

    //Twitter share button
    tShareLink += "https://twitter.com/share?";
    tShareLink += "url=" + encodeURIComponent(socialShareUrl);
    //tShareLink += "&via=" + encodeURIComponent("Teamwork");
    tShareLink += "&size=" + encodeURIComponent("large");
    tShareLink += "&hashtags=" + encodeURIComponent("teamwork2015");
    tShareLink += "&text=" + encodeURIComponent(TwitterMessage);

    $("#tshare").attr("href", tShareLink);

    //Google+ issue : https://developers.google.com/+/web/snippet/
}

