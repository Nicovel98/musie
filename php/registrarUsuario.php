<?php
include 'conexion.php';

if (isset($_POST['register'])) {
    $nickname = $_POST['nickname'];
    $email = $_POST['email'];
    /* La contraseña ya debe estar validada por JS */
    $pass = $_POST['pass'];
    $pass2 = $_POST['confirm'];

    /* if ($pass == $pass2) {
         $pass_encrypt = base64_encode($pass);

         $sql = mysqli_query($conexion,"INSERT INTO persona (nickname, email, pass) VALUES
         ('$nickname', '$email', '$pass_encrypt')");
          header ('location:../index.html'); 
     }
     else {
         /* header ('location:../index.html'); 
     }*/

    $pass_encrypt = base64_encode($pass);

    $sql = mysqli_query($conexion, "INSERT INTO Persona (nickName, email, pass) 
            VALUES('$nickname','$email','$pass_encrypt')");
    header('location:../index.html');
}
?>