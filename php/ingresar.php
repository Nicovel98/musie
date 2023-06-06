<?php
    include 'db/conexion.php';

    $nombre = $_POST["email"]; 
    $pass = $_POST["password"]; 

    $query = ("SELECT nombreLogin, passwordLogin FROM login WHERE nombreLogin = nombre AND passwordLogin = pass");

    $query->bindParam(':nombre', $nombre);
    $query->bindParam(':password', $pass);
    $query->execute();  
    $result = $query->fetchAll(PDO::FETCH_OBJ); 

?>