<?php
header("Access-Control-Allow-Origin: *");
/*
 * Be sure to make the images directory writeable by the web server
 */

/*
 * Change this to match the production server url that points to the share directory
 */
$domain = "http://teamwork.petgtest.com/badges/share";
       
if(!array_key_exists('img', $_POST)){
  print "Error: No image posted.";
  die();
}

$img = urldecode($_POST['img']);
        
$this_dir = dirname(__FILE__);

$upload_root = "$this_dir/images";

$year = date('Y');
$month = date('m');
$day = date('d');

$upload_path = "$upload_root/$year/$month/$day";

if(!file_exists($upload_path)){
  if(!@mkdir($upload_path, 0777, true)){
    err();
  }
}

//$base64img = str_replace('data:image/png;base64,', '', $img);
//$base64img = substr($img, 28, strlen($img));
$base64img = substr($img, strpos($img, ',') + 1 , strlen($img));

$file_name = md5($base64img).".png";

$data = base64_decode($base64img);

$foreground = @imagecreatefromstring($data);

//$foreground = @imagecreatefrompng($this_dir . '/dots_example.png');
if(!$foreground){
  err();
}

$background = @imagecreatefrompng($this_dir . '/template.png');
if(!$background){
  err();
}

if(!@imagecopy($background, $foreground, 85, 240, 0, 0, 477, 268)){
  err();
}

if(!@imagepng($background, $upload_path.'/'.$file_name)){
  err();
}

print "$domain?img=/$year/$month/$day/$file_name";

/*
 * Functions
 */

function err(){
  $error = error_get_last();
  print 'Error: '.$error['message']; 
  die();  
}