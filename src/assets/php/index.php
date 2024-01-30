<?php
// access-origins must be defined in config.php
require_once 'config.php';
/*
for ($i = 1; $i <= 1000; $i++) {
echo ($i." - ".createAuthKey().'<br>');
}
die();
      // the standard authorization
      $cfg['auth']['null'] = array('load','list','save');
*/
// $origins has to contain the origins that are allowed to
// access this script
if ($origins === NULL)
{
  $origins = [];
}
if (isset($_SERVER['HTTP_ORIGIN'])) 
{
  $from = $_SERVER['HTTP_ORIGIN'];
  if (in_array($from,$origins))
  {
    header('Access-Control-Allow-Origin: '.$from);
    header('Access-Control-Allow-Credentials: true');
  }
} else {
  // if the following line is activated then every origin can access this url
  // header('Access-Control-Allow-Origin: *');
}
if (isset($_REQUEST['activate']))
{
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
header('Content-Type: application/json');
$body = file_get_contents('php://input');
if (!isset($body)) 
{
  echo '{"error":"errNoBody"}';
  die();
}
$body = json_decode($body, true);

if ($body == NULL)
{
  $body = [];
}

$cmd = $body['cmd'];
if ($body['auth'] == '' || $body['auth'] === NULL || $body['auth'] == 'false')
{
  $body['auth'] = 'null';
}

$isReadonly = $cmd != 'save' && $cmd != 'delete';
$db = new DatabaseConnector();
$dbFile = 'themes.sqlite';
$dbOptions = null;

if ($isReadonly)
{
  $dbOptions = [PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY];
}
if ( $db->Connect("sqlite:$dbFile", null, null, $dbOptions) === FALSE )
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
  ensureThemeTable();
  ensureUserTable();
}

// load user
$user = $db->SqlGetFirstLine('select * from users where key="'.$body['auth'].'"');
if ( $user === FALSE )
{
  echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
  leave();
}
if ($user === NULL)
{
  // if user is unknown, use default user
  $user = [
    'key' => 'null', 
    'permissions' => 'load,list,save'
  ];
}
$permissions = explode(',',$user['permissions']);
$isAdmin = in_array('admin',$permissions);
$now = new DateTime();
$time = $now->format('YmdHis');
checkAuth();

switch($cmd)
{
  case 'save':
    if (strcasecmp($body['name'],'standard') == 0 || strcasecmp($body['name'],'xmas') == 0)
    {
      echo '{"error":"errReservedName","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    if ($user['key'] == 'null') 
    {
      $body['auth'] = createAuthKey();
      $user['key'] = $body['auth'];
      $user['name'] = $body['username'];
      $result = $db->SqlExecute('insert into users (key,name,permissions,create_user,create_time,modify_user,modify_time) values("'.$user['key'].'","'.$user['name'].'","'.$user['permissions'].'","'.$user['key'].'",'.$time.',"'.$user['key'].'",'.$time.')');
    }
    $result = $db->SqlGetFirstLine('select * from themes where name="'.$body['name'].'"');
    if ( $result === FALSE )
    {
      echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
      leave();
    }
    if ($result === NULL) 
    {
      $db->SqlExecute('insert into themes (name,colors,username,visible,create_user,create_time,modify_user,modify_time) values("'.$body['name'].'","'.$body['colors'].'","'.$body['username'].'",'.$body['visible'].',"'.$user['key'].'",'.$time.',"'.$user['key'].'",'.$time.')');
      if ( $db->GetLastError() )
      {
        echo '{"error":"'.$db->GetLastError().'","auth":"'.$body['auth'].'","cmd":"'.$cmd.'"}';
        leave();
      }
    } else {
      if ($body['overwrite'] && mayOverwrite($result))
      {
        $db->SqlExecute('update themes set colors="'.$body['colors'].'",visible='.$body['visible'].',modify_user="'.$user['key'].'",modify_time='.$time.' where name="'.$body['name'].'"');
        echo '{"auth":"'.$user['key'].'"}';
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
    echo '{"auth":"'.$user['key'].'"}';
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
    foreach ($permissions as $entry)
    {
      $authList .= $diff.'"'.trim($entry).'"';
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
  $user = $GLOBALS['user'];
  $cmd = $GLOBALS['cmd'];
  $body = $GLOBALS['body'];
  if ($body == NULL) 
  {
    return;
  }
  $permissions = explode(',',$user['permissions']);
  if ( $permissions == NULL || (!in_array($cmd, $permissions) && !in_array('admin', $permissions)))
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

// creates an unique authkey using the current microtime
function createAuthKey() 
{
  $ret = microtime(true);
  if ($ret === FALSE) {
    $ret = time();
  }
  $ret = str_replace('.','',"$ret");
  while(strlen($ret)<14) {
    $ret .= '0';
  }
  return $ret;
}

function ensureThemeTable()
{
  $db = $GLOBALS['db'];
  // create table themes if not existing
  // name        name of theme
  // colors      list of colors
  // username    public name given by user in editfield in frontend
  // create_user user that created the entry
  // create_time timestamp the entry was created
  // modify_user user that last modified the entry
  // modify_time timestamp the entry was last modified
  // visible     visibility of the entry (0 = only admin, 1 = user that created it, 2 = everyone)
  if ( $db->SqlExecute('CREATE TABLE IF NOT EXISTS themes(name TEXT PRIMARY KEY,colors TEXT,username TEXT,create_user TEXT NOT NULL,create_time INTEGER NOT NULL,modify_user TEXT NOT NULL,modify_time INTEGER NOT NULL,visible INTEGER NOT NULL DEFAULT (1))') === FALSE )
  {
    echo '{"error":"'.$db->GetLastError().'"}';
    leave();
  }
}

function ensureUserTable()
{
  $db = $GLOBALS['db'];
  // create table users if not existing
  // key         unique key of user (created with createAuthKey)
  // name        public name given by user in editfield in frontend
  // permissions comma separated list of allowed actions
  // create_user user that created the entry
  // create_time timestamp the entry was created
  // modify_user user that last modified the entry
  // modify_time timestamp the entry was last modified
  if ( $db->SqlExecute('CREATE TABLE IF NOT EXISTS users(key TEXT PRIMARY KEY,name TEXT,permissions TEXT,create_user TEXT NOT NULL,create_time INTEGER NOT NULL,modify_user TEXT NOT NULL,modify_time INTEGER NOT NULL)') === FALSE )
  {
    echo '{"error":"'.$db->GetLastError().'"}';
    leave();
  }
}
