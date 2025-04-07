<?php
session_start();
// call with ?app=xxx
if (isset($_REQUEST['app'])) {
  $_SESSION['app'] = $_REQUEST['app'];
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
    $authUrl = $cfg['authUrl'] . '?'
      . http_build_query([
        'response_type' => 'code',
        'client_id' => $cfg['clientId'],
        'redirect_uri' => $redirectUri,
        'scope' => $cfg['scope'],
      ]);
    header('Location: ' . $authUrl);
    exit;
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
  // check for presence of access_token
  if (isset($tokenData['access_token'])) {
    // redirect back to angular-app
    header('Location: ' . $cfg['homeUri'] . '?' . $cfg['app'] . '=' . base64_encode($response));
    exit;
  } else {
    // error handling
    header('Location: ' . $cfg['homeUri'] . '?' . $cfg['app'] . '=error&error=' . base64_encode($response));
    exit;
  }
} else {
  include('config/' . $_SESSION['app'] . '.php');
  global $cfg;
  // error handling when this file is called without proper parameters
  header('Location: ' . $cfg['homeUri'] . '?' . $cfg['app'] . '=error');
  exit;
}
