<?php
include('config.php');
$cfg['app'] = 'withings';
$cfg['authUrl'] = 'https://account.withings.com/oauth2_user/authorize2';
$cfg['tokenUrl'] = 'https://wbsapi.withings.net/v2/oauth2';
$cfg['scope'] = 'user.info,user.metrics';
$cfg['apiExplorerUrl'] = 'https://www.postman.com/withings/withings-health-solutions/collection/hx5ar4t/withings-public-api-integration';
$cfg['devAppUrl'] = 'https://developer.withings.com/dashboard/';
require_once('apps/' . $cfg['app'] . '.php');
$cfg['authParams'] = ['state' => 'nr-withings'];
$cfg['tokenParams'] = array('action' => 'requesttoken', 'client_secret' => $cfg['clientSecret']);
