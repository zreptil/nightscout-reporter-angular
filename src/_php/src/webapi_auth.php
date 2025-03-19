<?php
include('config/fitbit.php');
global $clientId;
global $redirectUri;
global $scope;
global $authUrl;

// URL zur Fitbit-Autorisierungsseite
$authUrl .= '?' . http_build_query([
    'response_type' => 'code',
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'scope' => $scope,
  ]);

// Benutzer zur Autorisierungsseite weiterleiten
header('Location: ' . $authUrl);
exit;
?>
