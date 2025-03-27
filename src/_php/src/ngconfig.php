<?php
header('Access-Control-Allow-Origin: *');
$files = array_diff(scandir('config'), array('.', '..'));
echo('{');
$diff = '';
$configs = array();
foreach ($files as $file) {
  $path = 'config' . DIRECTORY_SEPARATOR . $file;
  if (is_file($path))
    include($path);
  global $cfg;
  if (isset($cfg) && !empty($cfg['clientId'])) {
    echo($diff . '"' . $cfg['app'] . '":{');
    $diff1 = '';
    foreach (['apiExplorerUrl', 'devAppUrl'] as $cfgkey) {
      echo($diff1 . '"' . $cfgkey . '":"' . $cfg[$cfgkey] . '"');
      $diff1 = ',';
    }
    echo('}');
    $diff = ',';
  }
}
echo('}');
