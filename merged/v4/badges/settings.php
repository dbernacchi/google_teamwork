<?php
/*
 * Be sure to make the images directory writeable by the web server
 */

/*
 * Change this to match the production server url that points to the share directory
 */
$domain = "http://teamwork.petgtest.com";

/*
 * Change this to match the production server document root
 */
$root = "/mnt/www/teamwork";

$this_dir = dirname(__FILE__);

$url_path = str_replace($root,"", $this_dir);

$share_url = $domain.$url_path."/share?img=";

$img_url = $domain.$url_path."/images";

$img_root = $this_dir."/images";