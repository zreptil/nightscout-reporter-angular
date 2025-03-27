<?php
header('Access-Control-Allow-Origin: *');
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$cfg = array();
$cfg['homeUri'] = $scheme . '://' . $host;
$cfg['redirectUri'] = $cfg['homeUri'] . '/backend/';
