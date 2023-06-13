<?php
if (isset($_POST['guardar'])) {
    $name = $_POST['name'];
    $artist = $_POST['artist'];
    $image = ($_FILES['image']['tmp_name']);
    $musica = ($_FILES['file_mp3']['tmp_name']);

    $ruta = "upload/";
    $nombrefinal = trim($_FILES['image']['name']); //Eliminamos los espacios en blanco
    $upload = $ruta . $nombrefinal;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $upload)) { //movemos el archivo a su ubicacion 
        echo "<b>Upload exitoso!. Datos:</b><br>";
        echo "Nombre: <i><a href=\"" . $ruta . $nombrefinal . "\">" . $_FILES['image']['name'] . "</a></i><br>";
        echo "Tipo MIME: <i>" . $_FILES['image']['type'] . "</i><br>";
        echo "Peso: <i>" . $_FILES['image']['size'] . " bytes</i><br>";
        echo "<br><hr><br>";
        $query = mysqli_query($conexion, "INSERT INTO Cancion (ruta) VALUES
        ('$upload')");
    }
}
?>