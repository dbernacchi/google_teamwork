
var FbGMessage = "Check out my virtual journey at Teamwork, created using my head movements using Google Cardboard. #teamwork2015 http://teamwork2015.com/";
var TwitterMessage = "Check out this amazing virtual experience at Teamwork, using Google Cardboard. #teamwork2015 http://teamwork2015.com/";
var uploadedImageUrl = "";

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
        }
    });
    $("#remove_phone").hide();
    $("#share-screen").removeClass("hide");
    
// https://www.facebook.com/dialog/feed?
// app_id=1438439249728371
// &display=popup
// &caption={caption}
// &link={link-to-share}
// &description={description}
// &redirect_uri={redirect-url-to-your-site}
}
