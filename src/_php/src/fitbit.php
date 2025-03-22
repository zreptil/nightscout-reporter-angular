<?php
include('config/fitbit.php');
global $clientId;
global $clientSecret;
global $redirectUri;
global $homeUri;

if (isset($_GET['code'])) {
  $code = $_GET['code'];

  $tokenParams = [
    'client_id' => $clientId,
    'grant_type' => 'authorization_code',
    'redirect_uri' => $redirectUri . 'fitbit.php',
    'code' => $code,
  ];

  $ch = curl_init('https://api.fitbit.com/oauth2/token');
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
    'Content-Type: application/x-www-form-urlencoded',
  ]);

  // execute request
  $response = curl_exec($ch);
  curl_close($ch);

  $tokenData = json_decode($response, true);
  // check for presence of access_token
  if (isset($tokenData['access_token'])) {
    // redirect back to angular-app
    header('Location: ' . $homeUri . '?fitbit=' . base64_encode($response));
    exit;
  } else {
    // error handling
    header('Location: ' . $homeUri . '?fitbit=error');
    exit;
  }
} else {
  // didn't receive authorization
  header('Location: ' . $homeUri . '?fitbit=error');
  exit;
}
?>
