<?php
header('Content-Type:application/json');

@$user_name = $_REQUEST['user_name'];
@$sex = $_REQUEST['sex'];
@$addr = $_REQUEST['addr'];
@$phone = $_REQUEST['phone'];
@$did = $_REQUEST['did'];

if(empty($user_name) || empty($sex) || empty($addr) || empty($phone) || empty($did))
{
    echo '[]';
    return;
}

$order_time = time()*1000;
require('init.php');

$sql = "INSERT INTO kf_order VALUES(NULL,'$phone','$user_name','$sex','$order_time','$addr','$did')";
$result = mysqli_query($conn,$sql);

$output = [];
$arr = [];
if($result)
{
    $arr['msg'] = 'succ';
    $arr['oid'] = mysqli_insert_id($conn);
}
else
{
    $arr['msg'] = 'error';
}

$output[] = $arr;

echo json_encode($output);

?>




