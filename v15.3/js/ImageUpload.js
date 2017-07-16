function UploadImage()
{
    var base64img = PX.GeneratedImageData;
    console.log("HERE WE GO");
    console.log(image);
    $.ajax({
        type: "POST",
        url: "http://teamwork.petgtest.com/badges/index.php",
        data: {text: text, img: encodeURIComponent(base64img)},
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        success: function (msg) {
            console.log(msg);
        }
    });
}
