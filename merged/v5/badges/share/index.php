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
    <meta property="og:description" content="I just completed the TeamWork Cardboard experience. Unlock your own journey at http://teamwork2015.com #TeamWork2015" />
    <meta property="og:image" content="<?=$img?>" />
  </head>
  <body>
    <script type="text/javascript">
      location.href="http://teamwork2015.com";
    </script>
  </body>
</html>