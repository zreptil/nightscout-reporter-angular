<?php
include('config/fitbit.php');
global $clientId;
global $clientSecret;
global $redirectUri;
global $homeUri;

// Überprüfen, ob der Autorisierungscode vorhanden ist
if (isset($_GET['code'])) {
  $code = $_GET['code'];

  // Anfrage-Parameter für das Access-Token
  $tokenParams = [
    'client_id' => $clientId,
    'grant_type' => 'authorization_code',
    'redirect_uri' => $redirectUri,
    'code' => $code,
  ];

  // cURL-Initialisierung
  $ch = curl_init('https://api.fitbit.com/oauth2/token');
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
    'Content-Type: application/x-www-form-urlencoded',
  ]);

  // Ausführung der Anfrage
  $response = curl_exec($ch);
  curl_close($ch);

  // Antwort dekodieren
  $tokenData = json_decode($response, true);
  // Überprüfen, ob ein Access-Token erhalten wurde
  if (isset($tokenData['access_token'])) {
    // Weiterleitung zurück zur Angular-Anwendung
    header('Location: ' . $homeUri . '?fitbit=' . base64_encode($response));
    exit;
  } else {
    // Fehlerbehandlung
    header('Location: ' . $homeUri . '?fitbit=error');
    exit;
  }
} else {
  // Kein Autorisierungscode erhalten
  header('Location: ' . $homeUri . '?fitbit=error');
  exit;
}
?>
