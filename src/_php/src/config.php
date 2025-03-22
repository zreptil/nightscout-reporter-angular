<?php
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$homeUri = $scheme . '://' . $host;
$redirectUri = $homeUri . '/backend/';
