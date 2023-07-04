<?php
include 'conexion.php';
$consulta2 = mysqli_query($conexion, "SELECT * FROM Cancion");

while ($consult = mysqli_fetch_array($consulta2)) {
    $idSong = $consult['idCancion'];
    $nameSong = $consult['nombreCancion'];
    $imgSong = $consult['imagenCancion'];
    $fileSong = $consult['archivoCancion'];
    $idArtista = $consult['idArtista'];

    /* echo $idSong."<br>";
    echo $nameSong."<br>";
    echo $imgSong."<br>";
    echo $fileSong."<br>";
    echo $idArtista."<br>"; */

}
?>

<script type="text/javascript">
    let allMusic = [{
        name: <?php echo json_encode($nameSong); ?>,
        artist: <?php echo json_encode($idArtista); ?>,
        img: "upload" + <?php echo json_encode($imgSong); ?>,
        src: "upload" + <?php echo json_encode($fileSong); ?>
    }
    ];
</script>