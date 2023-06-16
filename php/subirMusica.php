<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
    require_once 'conexion.php';

    if (isset($_POST['guardar'])) {        
        $name = $_POST['name'];
        $artist = $_POST['artist'];
        $image = ($_FILES['image']['tmp_name']);
        $musica = ($_FILES['file_mp3']['tmp_name']);
    
        $ruta = "upload/";
        $nombrefinal_imagen = trim($_FILES['image']['name']); //Eliminamos los espacios en blanco
        $nombrefinal_musica = trim($_FILES['file_mp3']['name']); //Eliminamos los espacios en blanco
        $upload_imagen = $ruta . $nombrefinal_imagen;
        $upload_musica = $ruta . $nombrefinal_musica;
    
        if (move_uploaded_file($_FILES['image']['tmp_name'], $upload_imagen) && move_uploaded_file($_FILES['file_mp3']['tmp_name'], $upload_musica)) { //movemos los archivos a su ubicacion 
    
            $stmt = $conexion->prepare("SELECT idArtista FROM Artista WHERE nombreArtista = ?");
            $stmt->bind_param("s", $artist);
            $stmt->execute();
            $result = $stmt->get_result();
    
            if($result->num_rows === 0) {
                // Artista no encontrado, agregar nuevo
                $stmt = $conexion->prepare("INSERT INTO Artista (nombreArtista) VALUES (?)");
                $stmt->bind_param("s", $artist);
                $stmt->execute();
    
                $idArtista = $conexion->insert_id; // obtener el idArtista recién insertado
            } else {
                $row = $result->fetch_assoc();
                $idArtista = $row['idArtista'];
            }
    
            echo "<b>Upload exitoso!. Datos:</b><br>";
            echo "Nombre: <i><a href=\"" . $ruta . $nombrefinal_imagen . "\">" . $_FILES['image']['name'] . "</a></i><br>";
            echo "Tipo MIME: <i>" . $_FILES['image']['type'] . "</i><br>";
            echo "Peso: <i>" . $_FILES['image']['size'] . " bytes</i><br>";
            echo "<br><hr><br>";
    
            $stmt = $conexion->prepare("INSERT INTO Cancion (nombreCancion, imagenCancion, archivoCancion, idArtista) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("sssi", $name, $upload_imagen, $upload_musica, $idArtista);
            $stmt->execute();
    
            header('Location:../index.php'); // Redirigir al usuario a subirMusica.php
        }
    }
?>