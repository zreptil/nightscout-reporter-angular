<?php
include('tokenHandler.php');
global $ret;
global $cfg;

$url = replaceUrl($cfg['activitiesUrl']);

//// API-Anfrage mit dem Access-Token
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer ' . $ret['at']
]);

$ret['response'] = json_decode(curl_exec($ch));
curl_close($ch);

$json = json_encode($ret);
echo $json;
exit;
// print_r($_REQUEST);
// echo('<br><br>' . $url);
// http://localhost/oauth.php?app=fitbit&cmd=activities&dateKey=beforeDate&date=2025-03-28&at=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1E0SzkiLCJzdWIiOiJCN0pCMloiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyd2VpIHJhY3QgcmhyIiwiZXhwIjoxNzQyNzA1MjQ1LCJpYXQiOjE3NDI2NzY0NDV9.ADXoHVDqARgH_IebcTU3oPZ4G8MNGp2uFtOEZszQ5cA&rt=800d90449820fcf5271dc2acb957fe1c29c74aca8cddcfd99f04771d295b6349&te=0
// https://nightrep-dev.zreptil.de/backend/oauth.php?app=fitbit&cmd=activities&dateKey=afterDate&date=2025-03-23&at=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1E0SzkiLCJzdWIiOiJCN0pCMloiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJzZXQgcmFjdCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNzQzMTA5NjA2LCJpYXQiOjE3NDMwODA4MDZ9.C_FmXyhJCVBvIwOIifKvkacHhizowNhzKucnGQTtYQ4&rt=e8ca909dd6d1ac639421222057df1ecfe94f6130422d73377fc5bfb8914f2cb9&te=0
