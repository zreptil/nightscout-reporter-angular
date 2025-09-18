<?php
header('Access-Control-Allow-Origin: *');
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$cfg = array();
$baseUri = $scheme . '://' . $host;
$pos = strrpos($_SERVER['SCRIPT_NAME'], '/');
$cfg['redirectUri'] = $baseUri . substr($_SERVER['SCRIPT_NAME'], 0, $pos);
if ($cfg['redirectUri'][strlen($cfg['redirectUri']) - 1] != '/')
  $cfg['redirectUri'] .= '/';
if (isset($_SESSION['home'])) {
  $cfg['homeUri'] = $_SESSION['home'];
} else {
  $cfg['homeUri'] = $baseUri;
}
if (!function_exists('returnResult')) {
  function returnResult($url, $info = false)
  {
    global $cfg;
    if (isset($cfg['debug']) && $cfg['debug'] == true) {
      $diff = '?';
      $pos = strpos($url, $diff);
      if ($pos !== false) {
        $diff = '&';
      }
      $url .= $diff . 'debug=true';
      ?>
      <html>
      <head>
        <title>Redirect</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-flow: column;
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            background: cornflowerblue;
            font-family: roboto, verdana, arial, helvetica, sans-serif;
          }

          div {
            color: white;
            font-size: 2em;
            margin: 1em;
            word-break: break-all;
          }

          a {
            word-break: break-all;
            line-height: 2em;
            padding: 1em;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            text-decoration: none !important;
            margin: 1em;
            border-radius: 1em;
          }
        </style>
      </head>
      <body>
      <?php
      if ($info) {
        echo '<div>' . $info . '</div>';
      }
      ?>
      <a href="<?= $url ?>" target="_blank"><?= $url ?></a>
      </body>
      </html>
      <?php
      exit;
    }
    header('Location: ' . $url);
  }
}
