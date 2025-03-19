<?php
include('config/fitbit.php');
$requestUrl = 'https://api.fitbit.com/1/user/-/activities/date/' . $_GET['date'] . '.json';

// Zugriffstoken (ersetzen Sie dies durch das tatsächliche Token)
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$accessToken = $data['at'];

// Initialisierung von cURL
$ch = curl_init();

// cURL-Optionen setzen
curl_setopt($ch, CURLOPT_URL, $requestUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer ' . $accessToken,
  'Content-Type: application/json'
]);

// Ausführung der Anfrage
$response = curl_exec($ch);

// Fehlerprüfung
if (curl_errno($ch)) {
  http_response_code(500);
  echo 'cURL-Fehler: ' . curl_error($ch);
} else {
  // Antwort an den Client weiterleiten
  header('Content-Type: application/json');
  echo $response;
}

// cURL schließen
curl_close($ch);
?>
