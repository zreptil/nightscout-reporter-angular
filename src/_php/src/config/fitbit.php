<?php
include('config.php');
$cfg['app'] = 'fitbit';
$cfg['authUrl'] = 'https://www.fitbit.com/oauth2/authorize';
$cfg['tokenUrl'] = 'https://api.fitbit.com/oauth2/token';
$cfg['revokeUrl'] = 'https://api.fitbit.com/oauth2/revoke';
$cfg['scope'] = 'activity heartrate location nutrition profile settings sleep social weight';
$cfg['apiExplorerUrl'] = 'https://dev.fitbit.com/build/reference/web-api/explore/';
$cfg['devAppUrl'] = 'https://dev.fitbit.com/apps';
$cfg['activitiesUrl'] = 'https://api.fitbit.com/1/user/-/activities/list.json?{dateKey}={date}&sort=ascending&offset=0&limit=100';
require_once('apps/' . $cfg['app'] . '.php');
