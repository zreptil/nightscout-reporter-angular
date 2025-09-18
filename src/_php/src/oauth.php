<?php
session_start();
$from = '*';
if (isset($_SERVER['HTTP_ORIGIN'])) {
  $from = $_SERVER['HTTP_ORIGIN'];
}
header('Access-Control-Allow-Origin: ' . $from);
header('Vary: Origin');
// call with ?app=xxx
if (isset($_REQUEST['app'])) {
  if ($_REQUEST['app'] == 'info') {
    include('config.php');
    global $cfg;
    echo($cfg['redirectUri'] . '<br>');
    phpinfo();
    exit;
  }
  $_SESSION['app'] = $_REQUEST['app'];
  $_SESSION['home'] = $_REQUEST['home'];
  include('config/' . $_SESSION['app'] . '.php');
  global $cfg;
  if (isset($_REQUEST['revoke'])) {
    try {
      if (isset($cfg['revokeUrl']) && $_REQUEST['revoke'] != '') {
        $tokenParams = [
          'token' => $_POST['revoke']
        ];

//        $ch = curl_init($cfg['revokeUrl']);
//        curl_setopt($ch, CURLOPT_POST, true);
//        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
//        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//        curl_setopt($ch, CURLOPT_HTTPHEADER, [
//          'Authorization: Basic ' . base64_encode($cfg['clientId'] . ':' . $cfg['clientSecret']),
//          'Content-Type: application/x-www-form-urlencoded',
//        ]);
//        // execute request
//        $response = curl_exec($ch);
//        curl_close($ch);
      }
    } catch (Exception $ex) {
      $error['code'] = 500;
      $error['msg'] = $ex->getMessage();
      include('error.php');
    }
    exit;
  } else if (isset($_REQUEST['cmd'])) {
    include($_REQUEST['cmd'] . '.php');
    exit;
  } else {
    // redirect to this file again, will be called with "code" as parameter
    $redirectUri = $cfg['redirectUri'] . basename(__FILE__);
    $httpParams = [
      'response_type' => 'code',
      'client_id' => $cfg['clientId'],
      'redirect_uri' => $redirectUri,
      'scope' => $cfg['scope'],
    ];
    if (isset($cfg['authParams']) && is_array($cfg['authParams']) && !empty($cfg['authParams'])) {
      foreach ($cfg['authParams'] as $key => $value) {
        $httpParams[$key] = $value;
      }
    }
    $authUrl = $cfg['authUrl'] . '?' . http_build_query($httpParams);
    returnResult($authUrl, 'Request authorization from ' . $cfg['app']);
  }
} else if (isset($_GET['code'])) {
  // received code
  $code = $_GET['code'];

  include('config/' . $_SESSION['app'] . '.php');
  global $cfg;
  $tokenParams = [
    'client_id' => $cfg['clientId'],
    'grant_type' => 'authorization_code',
    'redirect_uri' => $cfg['redirectUri'] . basename(__FILE__),
    'code' => $code,
  ];
  if (isset($cfg['tokenParams']) && is_array($cfg['tokenParams']) && !empty($cfg['tokenParams'])) {
    foreach ($cfg['tokenParams'] as $key => $value) {
      $tokenParams[$key] = $value;
    }
  }

  $ch = curl_init($cfg['tokenUrl']);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($cfg['clientId'] . ':' . $cfg['clientSecret']),
    'Content-Type: application/x-www-form-urlencoded',
  ]);

  // execute request
  $response = curl_exec($ch);
  curl_close($ch);

  $tokenData = json_decode($response, true);
  // withings returns tokenData in body
  if (isset($tokenData['body'])) {
    $tokenData = $tokenData['body'];
  }
  // check for presence of access_token
  if (isset($tokenData['access_token'])) {
    // redirect back to angular-app
    returnResult(
      $cfg['homeUri'] . '?' . $cfg['app'] . '=' . base64_encode(json_encode($tokenData)),
      'Received access-token from ' . $cfg['app'] . '<br><br>' . json_encode($tokenData));
  } else {
    // error handling
    returnResult(
      $cfg['homeUri'] . '?' . $cfg['app'] . '=error&error=' . base64_encode($response),
      'Received error from ' . $cfg['app'] . '<br><br>' . $response);
  }
} else if (isset($_GET[$_SESSION['app']])) {
  include('config/' . $_SESSION['app'] . '.php');
  global $cfg;
  print_r($_SESSION);
  returnResult(
    $cfg['homeUri'] . '?' . $cfg['app'] . '=' . $_GET[$_SESSION['app']],
    'Received data from ' . $cfg['app'] . '<br><br>' . $_GET[$_SESSION['app']]);
} else {
  include('config/' . $_SESSION['app'] . '.php');
  global $cfg;
  // error handling when this file is called without proper parameters
  returnResult(
    $cfg['homeUri'] . '?' . $cfg['app'] . '=error',
    $cfg['app'] . ' called without proper parameters');
  exit;
}
