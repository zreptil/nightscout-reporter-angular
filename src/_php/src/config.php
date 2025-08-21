<?php
header('Access-Control-Allow-Origin: *');
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$cfg = array();
$cfg['homeUri'] = $scheme . '://' . $host;
$pos = strrpos($_SERVER['SCRIPT_NAME'], '/');
$cfg['redirectUri'] = $cfg['homeUri'] . substr($_SERVER['SCRIPT_NAME'], 0, $pos);
if ($cfg['redirectUri'][strlen($cfg['redirectUri']) - 1] != '/')
  $cfg['redirectUri'] .= '/';
