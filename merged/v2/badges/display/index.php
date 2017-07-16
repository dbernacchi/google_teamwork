<?php
//$img_root set in settings.php
require_once("../settings.php");
$file = $img_root.$_GET['img'].'_rec.png';


$type = 'image/png';
header('Content-Type:'.$type);
header('Content-Length: ' . filesize($file));
readfile($file);

