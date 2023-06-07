<?php
    include 'conexion.php';
    
    if (isset($_POST['login'])) {
        $nombre = $_POST["email"];
        $pass = $_POST["password"];
        $pass_encrypt = base64_encode($pass);

        $consulta = mysqli_query($conexion, "SELECT * FROM personas 
            WHERE email = '$nombre' AND pass = '$pass_encrypt'");
            
        $cant = mysqli_num_rows($count);

        if ($cant == 1) {
            while ($consult = mysqli_fetch_array($consulta)) {
                session_start();
                $_SESSION['user'] = $consult['nickName'];
                $_SESSION['email'] = $consult['email'];                
            }
            header('location:../index2.php');
        }else {
            header('location:../index2.php');
        }
    }
    
?>