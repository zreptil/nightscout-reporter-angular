<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
  $from = $_SERVER['HTTP_ORIGIN'];
  $allowed = array('https://nightrep.zreptil.de',
                   'http://localhost:3002',
                   'https://nightrep-dev.zreptil.de');
  if (in_array($from,$allowed)) {
    header('Access-Control-Allow-Origin: '.$from);
    header('Access-Control-Allow-Credentials: true');
  }
} else {
  // currently not allowed from any other url than defined above
  // header('Access-Control-Allow-Origin: https://nightrep-dev.zreptil.de');
}
if (isset($_REQUEST['activate'])) {
?>
<html>
<head>
  <style>
  body {
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #a0a0ff;
    font-family: roboto,tahoma,verdana,arial;
    font-size: 3em;
    width: 100vw;
    height: 100vh;
  }
  </style>
</head>
<body>
  <div>Die Verbindung funktioniert.</div>
</body>
</html>
<?php
  die();
}
header('Access-Control-Max-Age: 86400');
require_once 'DatabaseConnector.php';
require_once 'config.php';
header('Content-Type: application/json');
$body = file_get_contents('php://input');
$body = json_decode($body, true);
if (!isset($body)) {
  echo '{"error":"errNoBody"}';
  die();
}

if ($body == NULL)
{
  $body = [];
}

$cmd = $body['cmd'];
if ($body['auth'] == '' || $body['auth'] == NULL|| $body['auth'] == 'null') 
{
  $body['auth'] = 'null';
}

checkAuth();
$db = new DatabaseConnector();
$dbFile = 'themes.sqlite';
$timeout = 5000;
$isReadonly = $cmd != 'save' && $cmd != 'delete';
$dbOptions = null;
if ($isReadonly)
{
  $dbOptions = [PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY];
}
if ( $db->Connect("sqlite:$dbFile", null, null, $dbOptions) === FALSE )
// if ( $db->ConnectSqlite3($dbFile, $timeout) === FALSE )
{
  $myfile = fopen($dbFile, 'w');
  fclose($myfile);
  if ( $db->Connect("sqlite:$dbFile", null, null, $dbOptions) === FALSE )
  {
    echo '{"error":"errNoThemeDB","auth":"'.$body['auth'].'","file":"'.$dbFile.'"}';
    die();
  }
}

if (!$isReadonly)
{
  // create table if not existing
  // name        name of theme
  // colors      list of colors
  // username    public name given by user in editfield in frontend
  // create_user user that created the entry
  // create_time timestamp the entry was created
  // modify_user user that last modified the entry
  // modify_time timestamp the entry was last modified
  // visible     visibility of the entry (0 = only admin, 1 = user that created it, 2 = everyone)
  if ( $db->SqlExecute('CREATE TABLE IF NOT EXISTS themes(name TEXT PRIMARY KEY,colors TEXT, username TEXT, create_user TEXT NOT NULL, create_time INTEGER NOT NULL, modify_user TEXT NOT NULL, modify_time INTEGER NOT NULL, visible INTEGER NOT NULL DEFAULT (1))') === FALSE )
  {
    echo '{"error":"'.$db->GetLastError().'"}';
    leave();
  }
} 
$isAdmin = in_array('admin',$cfg['auth'][$body['auth']]);
$now = new DateTime();
$time = $now->format('YmdHis');
     
switch($cmd)
{
  case 'save':
    if (strcasecmp($body['name'],'standard') == 0 || strcasecmp($body['name'],'xmas') == 0)
    {
      echo '{"error":"errReservedName","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    $result = $db->SqlGetFirstLine('select * from themes where name="'.$body['name'].'"');
    if ( $result === FALSE )
    {
      echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    if ($result === NULL) 
    {
      $db->SqlExecute('insert into themes (name,colors,username,create_user,create_time,modify_user,modify_time) values("'.$body['name'].'","'.$body['colors'].'","'.$body['username'].'","'.$body['auth'].'",'.$time.',"'.$body['auth'].'",'.$time.')');
      if ( $db->GetLastError() )
      {
        echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
        leave();
      }
    } else {
      if ($body['overwrite'] && mayOverwrite($result))
      {
        $db->SqlExecute('update themes set colors="'.$body['colors'].'",modify_user="'.$body['auth'].'",modify_time='.$time.' where name="'.$body['name'].'"');
        echo '{}';
        leave();
      }
      if (mayOverwrite($result))
      {
        echo '{"error":"errExists"}';
      } else {
        echo '{"error":"errExistsFixed"}';
      }
      leave();
    }
    echo '{}';
    break;
  case 'load':
    $result = $db->SqlGetFirstLine('select * from themes where name="'.$body['name'].'"');
    if ( $result === FALSE )
    {
      echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    $src = decode($result['colors']);
    $data = '{';
    $diff = '';
    foreach($src as $key => $value) {
      $data .= $diff.'"'.$key.'":"'.$value.'"';
      $diff = ',';
    }
    $data .= '}';
    echo $data;
    break;
  case 'delete':
    $db->SqlExecute('delete from themes where name="'.$body['name'].'"');
    if ( $db->GetLastError() )
    {
      echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    echo '{}';
    break;
  case 'list':
    $authList = '[';
    $diff = '';
    foreach ($cfg['auth'][$body['auth']] as $entry)
    {
      $authList .= $diff.'"'.$entry.'"';
      $diff = ',';
    }
    $authList .= ']';
    $data = '{"cfg":'.$authList.',"themes":[';
    $result = $db->SqlGetLines('select * from themes');
    if ($result === NULL)
    {
      $data .= ']}';
      echo $data;
      leave();
    }
    if ($result === FALSE)
    {
      echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    $keys = array('mainHeadBack','mainHeadFore','mainBodyBack','mainBodyFore',
      'owlBody', 'owlBrow', 'owlBodyLeft', 'owlBodyRight', 'owlEyearea',
      'owlEyes', 'owlXmasBodyLeft', 'owlXmasBodyRight', 'owlXmasEyearea', 'owlXmasEyes',
      'owlXmasFrame', 'owlXmasFur', 'owlXmasFabric', 'owlWizardBodyLeft', 'owlWizardBodyRight',
      'owlWizardEyearea', 'owlWizardEyes', 'owlWizardFabric', 'owlWizardStar1', 'owlWizardStar2',
      'owlReporterFrame', 'owlReporterFabric', 'owlOwnEyearea', 'owlOwnFrame', 'owlOwnBeard',
      'owlOwnFabric', 'owlOwnEyes', 'owlOwnBodyLeft', 'owlOwnBodyRight', 'owlOwnBrow');
    $diff = '';
    foreach ($result as $item)
    {
      if (checkTheme($item))
      {
        $src = decode($item['colors']);
        $colors = '';
        // extract all colors that are defined in $keys and return them
        // the colors in $keys are needed to display the colors on the cards
        // in the frontend
        foreach($keys as $key) {
          $v = $src[$key];
          if ($v == '') {
            $v = 'red';
          }
          $colors .= ',"'.$key.'":"'.$v.'"';
        }
        $data .= $diff.'{';
        $data .= '"n":"'.$item['name'].'"';
        $data .= ',"c":{'.substr($colors,1).'}';
        $data .= ',"u":"'.$item['username'].'"';
        $actions = '';
        if ($item['create_user'] == $body['auth'] || $isAdmin)
        {
          $actions .= '"delete"';
        }
        $data .= ',"a":['.$actions.']';
        $data .= ',"m":'.$item['modify_time'];
        $data .= '}';
        $diff = ',';
      }
    }

    $data .= ']}';
    echo $data;
    break;
  default:
    echo '{"error":"errAuthFail"}';
    leave();
    break;
}

function leave() {
  $db = $GLOBALS['db'];
  if ($db != null) 
  {
    $db->Disconnect();
  }
  die();
}

function mayOverwrite($theme)
{
  $body = $GLOBALS['body'];
  $isAdmin = $GLOBALS['isAdmin'];
  return $body['auth'] == $result['create_user'] || $isAdmin;
}

function checkTheme($theme)
{
  $body = $GLOBALS['body'];
  $ret = $GLOBALS['isAdmin'];
  switch ($theme['visible'])
  {
    case 0:
      break;
    case 1:
      $ret = $ret || $body['auth'] == $theme['create_user'];
      break;
    case 2:
      $ret = true;
      break;
  }
  return $ret;
}

function checkAuth() 
{
  $cfg = $GLOBALS['cfg'];
  $cmd = $GLOBALS['cmd'];
  $body = $GLOBALS['body'];
  if ($body == NULL) 
  {
    return;
  }
  $auth = $cfg['auth'][$body['auth']];
  if ( $auth == NULL || (!in_array($cmd, $auth) && $auth != ['admin']))
  {
    echo '{"error":"errAuthFail","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
    die();
  }
}

function decode($encoded) 
{
  $decoded = '';
  // strings longer than 5k can be problematic, so this is split
  for ($i=0; $i < ceil(strlen($encoded)/256); $i++)
    $decoded = $decoded.base64_decode(substr($encoded,$i*256,256));  
  return json_decode($decoded, true);
}