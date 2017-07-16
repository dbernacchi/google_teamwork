<?php
header("Access-Control-Allow-Origin: *");

//$this_dir, $share_url, $img_url set in settings.php
require_once("./settings.php");


if(!array_key_exists('img', $_POST)){
  print "Error: No image posted.";
  die();
}

$img = urldecode($_POST['img']);
        

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

$base64img = substr($img, strpos($img, ',') + 1 , strlen($img));

$file_name = md5($base64img.time());

$data = base64_decode($base64img);

$foreground = @imagecreatefromstring($data);

if(!$foreground){
  err();
}

render($foreground, $this_dir, $upload_path, $file_name, '_rec', 621, 357);

render($foreground, $this_dir, $upload_path, $file_name, '_sq', 0, 200);
        
$output_path = "/$year/$month/$day/$file_name";

$arr = array(
    'share_url' => $share_url.$output_path,
    'img_url' => $img_url.$output_path.'_sq.png'
        );


print json_encode($arr);

/*
 * Functions
 */

function err(){
  $error = error_get_last();
  print 'Error: '.$error['message']; 
  die();  
}

function render($foreground, $this_dir, $upload_path, $file_name, $suffix, $pos_x, $pos_y){
 
  $background = @imagecreatefrompng($this_dir . '/template'.$suffix.'.png');
  if(!$background){
    err();
  }

  if(!@imagecopy($background, $foreground, $pos_x, $pos_y, 0, 0, 640, 480)){
    err();
  }

  if(!@imagepng($background, $upload_path.'/'.$file_name.$suffix.'.png')){
    err();
  }  
  
}