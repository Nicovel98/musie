<?php
    include 'conexion.php';    
    
    if (isset($_POST['login'])) {
        $nombre = $_POST["email-login"];
        $pass = $_POST["password"];
        $pass_encrypt = base64_encode($pass);

        $consulta = mysqli_query($conexion, "SELECT * FROM Persona
            WHERE email = '$nombre' AND pass = '$pass_encrypt'");
            
        $cant = mysqli_num_rows($consulta);

        if ($cant == 1) {
            while ($consult = mysqli_fetch_array($consulta)) {
                session_start();
                $_SESSION['user'] = $consult['nickName'];
                $_SESSION['email'] = $consult['email'];                
            }
            header('location:../index.php');
        }else {
            header('location:../index.php');
        }
    }
    
?>