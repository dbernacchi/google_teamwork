<?php 
//$share_url and $img_url set in settings.php
require_once("../settings.php");
$img = $img_url.$_GET['img'].'_rec.png';

?>
<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Google Teamwork" />
    <meta property="og:url" content="<?=$share_url?><?=$_GET['img']?>" />
    <meta property="og:site_name" content="Google Teamwork" />
    <meta property="og:description" content="Check out my virtual journey at Teamwork, created using my head movements using Google Cardboard. #teamwork2015 http://teamwork2015.com/" />
    <meta property="og:image" content="<?=$img?>" />
  </head>
  <body>
    <script type="text/javascript">
      location.href="http://teamwork2015.com";
    </script>
  </body>
</html>