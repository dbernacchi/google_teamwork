var FbGMessage = "I just completed the TeamWork Cardboard experience. Unlock your own journey at teamwork2015.com #TeamWork2015";
var TwitterMessage = "I just completed the TeamWork Cardboard experience. Unlock your own journey at";
var uploadedImageUrl = "";
var fbShareLink = "";
var tShareLink = "";
var gShareLink = "";
var socialShareUrl = "";
var postUrl = location.href.replace('index.html','');
postUrl = postUrl.replace('?skip=on', '');
postUrl += "/badges/index.php";

var defaultUrl = "http://teamwork2015.com";

function UploadImage()
{
    $("#main_container_id").hide();
    $("#glContainer").hide();

    var base64img = PX.GeneratedImageData;

    $.ajax({
        type: "POST",
        url: postUrl,
        data: {img: encodeURIComponent(base64img)},
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        success: function (msg) {
            var obj = jQuery.parseJSON(msg);
            var share_url = obj["share_url"];
            var img_url = obj["img_url"];

            uploadedImageUrl = img_url;
            socialShareUrl = share_url;
            imageUploadedCallback(share_url, img_url);
        }
    });
}

function imageUploadedCallback(page, pic) {
  
    $(".dots-shared").attr('src', pic);
    
    $("#share-screen").removeClass("hide");

    //Facebook share button
    //FbGMessage = FbGMessage + " " + msg;

//    fbShareLink = "https://www.facebook.com/dialog/feed?";
//    fbShareLink += "app_id=787409934680006";
//    fbShareLink += "&display=popup";
//    fbShareLink += "&caption=" + encodeURIComponent("Caption");
//    fbShareLink += "&link=" + encodeURIComponent(socialShareUrl);
//    fbShareLink += "&picture=" + encodeURIComponent(pic);
//    fbShareLink += "&description=" + encodeURIComponent(FbGMessage); //upper text
//    fbShareLink += "&redirect_uri=" + encodeURIComponent(socialShareUrl);


    $.post(
            'https://graph.facebook.com',
            {
                id: page,
                scrape: true
            },
    function (response) {
        $("#fbshare").attr("href", "http://www.facebook.com/sharer.php?u=" + encodeURIComponent(page));
        //Twitter share button
        tShareLink += "https://twitter.com/share?";
        tShareLink += "url=" + encodeURIComponent(defaultUrl);
        //tShareLink += "&via=" + encodeURIComponent("Teamwork");
        tShareLink += "&size=" + encodeURIComponent("large");
        tShareLink += "&hashtags=" + encodeURIComponent("teamwork2015");
        tShareLink += "&text=" + encodeURIComponent(TwitterMessage);

        $("#tshare").attr("href", tShareLink);

        //Google+ Share button
        gShareLink = "https://plus.google.com/share?url=" + encodeURIComponent(page);
        $("#gshare").attr("href", gShareLink);
    }
    );

    //fbShareLink = "http://www.facebook.com/sharer.php?u=" + encodeURIComponent(page);

    //new version - doesn't work as expected
//    fbShareLink = "http://www.facebook.com/sharer/sharer.php?s=100";
//    fbShareLink += "&p[url]=" + socialShareUrl;
//    fbShareLink += "&p[images][0]=" + msg;
//    fbShareLink += "&p[title]=" + encodeURIComponent("TeamWork2015Title");
//    fbShareLink += "&p[summary]=" + encodeURIComponent("" + FbGMessage);

    //$("#fbshare").attr("href", fbShareLink);




}

