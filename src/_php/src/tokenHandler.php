<?php
global $cfg;

function replaceUrl($url)
{
  foreach ($_REQUEST as $key => $value) {
    $url = str_replace('{' . $key . '}', $value, $url);
  }
  return $url;
}

// function to refresh the access-Token with the refresh-token
function refreshAccessToken($refreshToken)
{
  global $cfg;
  $tokenParams = [
    'grant_type' => 'refresh_token',
    'refresh_token' => $refreshToken,
  ];

  $ch = curl_init($cfg['tokenUrl']);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_USERPWD, $cfg['clientId'] . ':' . $cfg['clientSecret']);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
  ]);
  $response = curl_exec($ch);
  curl_close($ch);
  $ret = json_decode($response, true);
  $ret['wurst'] = 'Leber';
  if (!$ret['success']) {
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
  return $ret;
}

// fill return array for output to the caller
$ret = [
  'at' => $_REQUEST['at'],
  'rt' => $_REQUEST['rt'],
  'te' => $_REQUEST['te']
];

// check, if access-token is available and still valid
if (isset($_REQUEST['at']) && time() < $_REQUEST['te']) {
  $accessToken = $_REQUEST['at'];
} elseif (isset($_REQUEST['rt'])) {
  // Access-Token ist abgelaufen, aber Refresh-Token ist vorhanden
  $tokenData = refreshAccessToken($_REQUEST['rt']);

  if (isset($tokenData['access_token'])) {
    // set new values to return array
    $ret['at'] = $tokenData['access_token'];
    $ret['rt'] = $tokenData['refresh_token'];
    $ret['te'] = time() + $tokenData['expires_in'];
    $accessToken = $tokenData['access_token'];
  } else {
    // errorhandling when refresh fails
    echo 'error when refreshing access-token.';
    exit;
  }
} else {
  // no valid token available
  echo 'please authorize the app again.';
  exit;
}
