<?php
global $error;

echo '{';
echo '"code": "' . $error['code'] . '",';
echo '"error": "' . $error['msg'] . '"';
echo '}';
exit;
