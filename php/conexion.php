<?php
    /*para iniciar el lammp sudo /opt/lampp/lampp start */
    $host = 'localhost';
    $usuario = 'root';
    $contraseña = '';
    $basedatos = 'musie';

    $conexion = new mysqli($host,$usuario,$contraseña,$basedatos);

    if ($conexion->connect_errno) {
        echo "fallos en conexión";
        exit();
    }/*else{
         echo "Conexión Exitosa"; 
    }   */ 
?>