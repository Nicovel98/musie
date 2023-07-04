<?php
session_start();
?>

<!DOCTYPE html>
<html lang="ES-CO">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Musie Reproductor de Música</title>

    <link rel="shortcut icon" href="img/musie_logo_removebg.ico" type="image/x-icon">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/formstyle.css">
    <link rel="stylesheet" href="css/darkstyle.css">
    <link rel="stylesheet" href="css/responsive.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
</head>

<body>

    <!-- <section class="home">
        <div class="text">Dashboard Sidebar</div>
    </section> -->

    <!-- Elemento principal necesario para el responsive -->
    <section class="main">
        <!-- --- Modelo de navbar lateral --- -->
        <nav class="sidebar close">
            <header>
                <div class="image-text">
                    <span class="image">
                        <img src="img/musie_logo_removebg.png" alt="Musie_Logo">
                    </span>
                    <!-- --- Texto que acompaña al logo --- -->
                    <div class="text logo-text">
                        <span class="name-player">Musie</span>
                        <span class="subname">Web Player</span>
                    </div>
                </div>
                <!-- Flecha para abrir y cerrar la barra lateral -->
                <i class="material-icons toggle">chevron_right</i>
            </header>
            <div>
                <div class="menu-bar">
                    <div class="menu">
                        <!-- --- Caja de busqueda --- -->
                        <p>Browse</p>
                        <li class="search-box">
                            <i class="material-icons icon">search</i>
                            <input type="text" placeholder="Search...">
                        </li>
                        <!-- --- Lista vínculos --- -->
                        <ul class="menu-links">
                            <li class="nav-link">
                                <a href="#reproductor" id="btnReproductor">
                                    <i class="material-icons icon">home</i>
                                    <span class="text nav-text">Dashboard</span>
                                </a>
                            </li>
                            <p>Playlist</p>
                            <?php
                            if (isset($_SESSION['user'])):
                                ?>
                                <li class="nav-link">
                                    <a href="#favorites" id="btnFavorite">
                                        <i class="material-icons icon">favorite</i>
                                        <span class="text nav-text">Favorites</span>
                                    </a>
                                </li>
                                <?php
                            endif;
                            ?>
                            <li class="nav-link">
                                <a href="#music_list" id="btnMusicList">
                                    <i class="material-icons icon">queue_music</i>
                                    <span class="text nav-text">Music List</span>
                                </a>
                            </li>
                            <?php
                            if (isset($_SESSION['user'])):
                                ?>
                                <li class="nav-link">
                                    <a href="#add_music" id="btnAddMusic">
                                        <i class="material-icons icon">library_add</i>
                                        <span class="text nav-text">Add Music</span>
                                    </a>
                                </li>
                                <?php
                            endif;
                            ?>
                            <p>Settings</p>
                            <?php
                            if (isset($_SESSION['user'])):
                                ?>
                                <li class="nav-link">
                                    <a href="#profile" id="btnProfile">
                                        <i class="material-icons icon">account_circle</i>
                                        <span class="text nav-text">Profile</span>
                                    </a>
                                </li>
                                <?php
                            endif;
                            ?>
                        </ul>
                    </div>

                    <div class="bottom-content">
                        <?php
                        if (!isset($_SESSION['user'])) {
                            ?>
                            <li class="nav-link">
                                <a href="#" id="form-login">
                                    <i class="material-icons icon">login</i>
                                    <span class="text nav-text">Login</span>
                                </a>
                            </li>
                            <?php
                        } else {
                            ?>
                            <li class="nav-link">
                                <a href="php/salir.php">
                                    <i class="material-icons icon">logout</i>
                                    <span class="text nav-text">Logout</span>
                                </a>
                            </li>
                            <?php
                        }
                        ?>
                        <li class="mode">
                            <div class="sun-moon">
                                <i class="material-icons moon">dark_mode</i>
                                <i class="material-icons sun">light_mode</i>
                            </div>
                            <span class="mode-text text">Dark mode</span>

                            <div class="toggle-switch">
                                <span class="switch"></span>
                            </div>
                        </li>

                    </div>
                </div>
            </div>
        </nav>
        <!--  Área para arrastrar archivos -->
        <div id="dropArea">
            <div id="dropZone" class="box">
                <p class="hidden-text"> Arrastra y suelta la canción aquí </p>
            </div>
        </div>
        <!-- --- Modelo de Carta Reproductor --- -->
        <div class="wrapper" id="reproductor">
            <div class="top-bar">
                <i class="material-icons">expand_more</i>
                <span>Now Playing</span>
                <!-- <i class="material-icons">dark_mode</i> -->
                <i class="material-icons">menu</i>
                <!-- <i class="material-icons">more_horiz</i> -->
            </div>
            <!-- imagen de la canción -->
            <div class="img-area">
                <img src="" alt="">
            </div>
            <!-- Información de la canción -->
            <div class="song-details">
                <div class="controls controls-song">
                    <i id="fav" class="material-icons">favorite</i>
                    <div id="volume-control">
                        <i id="volume-up" class="material-icons">volume_up</i>
                        <div class="volume-progress-area">
                            <div class="volume-progress-bar"></div>
                        </div>
                        <input class="volume-slider" type="range" min="0" max="100" value="50">
                    </div>
                </div>
                <p class="name"></p>
                <p class="artist"></p>
            </div>
            <!-- Barra de progreso de la canción -->
            <div class="progress-area">
                <div class="progress-bar">
                    <audio id="main-audio" src=""></audio>
                </div>
                <!-- Tiempo actual y duración de la canción -->
                <div class="song-timer">
                    <span class="current-time">0:00</span>
                    <span class="max-duration">0:00</span>
                </div>
            </div>
            <!-- Controles del Reproductor 
                Repetir canción, canción aleatoria
                Canción anterior, canción siguiente
                Devolver canción, adelantar canción
                Boton lista de música -->
            <div class="controls">
                <i id="repeat-plist" class="material-icons" title="Playlist looped">repeat</i>
                <i id="prev" class="material-icons">skip_previous</i>
                <i id="rew" class="material-icons">fast_rewind</i>
                <div class="play-pause">
                    <i class="material-icons play">play_arrow</i>
                </div>
                <i id="forw" class="material-icons">fast_forward</i>
                <i id="next" class="material-icons">skip_next</i>
                <i id="more-music" class="material-icons">queue_music</i>
            </div>
            <!-- Lista de canciones en cola para reproducirse con boton de cerrar 
                Cada canción tiene su duración y si se esta reproduciendo-->
            <div class="music-list">
                <div class="header">
                    <div class="row">
                        <i class="list material-icons">queue_music</i>
                        <span>Music list</span>
                    </div>
                    <i id="close" class="material-icons">close</i>
                </div>
                <ul>
                </ul>
            </div>
        </div>
        <!-- Modelo de carta Favoritos -->
        <div class="wrapper" id="favorites">
            <div class="top-bar">
                <i class="material-icons">expand_more</i>
                <span>Favorites</span>
                <i class="material-icons">menu</i>
            </div>
        </div>
        <!-- Modelo de carta Lista de música -->
        <?php
        include 'php/conexion.php';
        $consulta2 = mysqli_query($conexion, "SELECT * FROM Cancion");


        ?>
        <div class="wrapper" id="music_list">
            <div class="top-bar">
                <i class="material-icons">expand_more</i>
                <span>Music List</span>
                <i class="material-icons">menu</i>
            </div>
            <div class="">
                <ul>
                    <?php
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

                        echo '
                            <li>
                                <div class="row">
                                    <div class="img-area">
                                        <img src="' . $imgSong . '" alt="' . $nameSong . '">
                                    </div>        
                                    <div class="info-song">
                                        <div>
                                            <span>' . $nameSong . '</span>                                        
                                        </div>
                                        <div>                                    
                                            <span>Artista' . $idArtista . '</span>
                                        </div>
                                    </div>                                       
                                    <audio controls>
                                        <source src="' . $fileSong . '" type="audio/ogg">
                                        <source src="' . $fileSong . '" type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>                                    
                                </div>
                            </li>
                            ';
                    }
                    ?>
                </ul>
            </div>
        </div>
        <!-- Modelo de carta Favoritos -->
        <div class="wrapper" id="profile">
            <div class="top-bar">
                <i class="material-icons">expand_more</i>
                <span>Profile</span>
                <i class="material-icons">menu</i>
            </div>
        </div>
        <!-- Modelo de carta Añadir Música (quizá cambiar a las opciones de menu de la carta) -->
        <div class="wrapper" id="add_music">
            <div class="top-bar">
                <i class="material-icons">expand_more</i>
                <span>Add Music</span>
                <i class="material-icons">menu</i>
            </div>
            <div class="header">
                <div class="subir">
                    <form action="php/subirMusica.php" method="post" enctype="multipart/form-data">
                        <div class="input-text">
                            <input type="text" name="name" placeholder="Song name" required />
                        </div>
                        <div class="input-text">
                            <input type="text" name="artist" placeholder="Artist name" required />
                        </div>
                        <div class="divFile">
                            <span>Select a Image:</span>
                            <input type="file" name="image" class="file" placeholder="Portada" required />
                        </div>
                        <div class="divFile">
                            <span>Select a Song:</span>
                            <input type="file" name="file_mp3" class="file" placeholder="Archivo de canción" required />
                        </div>
                        <button type="submit" name="guardar" id="btnSubirMusica"> Song Upload </button>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <!-- --- Formularios SignUp y Login --- -->
    <section class="home">
        <div class="form_container">
            <i class="material-icons icon form_close">close</i>
            <!-- --- Formulario Login  --- -->
            <div class="form login_form">
                <form action="php/ingresar.php" method="post">
                    <h2>Login</h2>
                    <!-- --- Entrada de Email --- -->
                    <div class="input_box">
                        <input type="email" placeholder="Enter your email" name="email-login" required />
                        <i class="material-icons email">email</i>
                    </div>
                    <!-- --- Entrada de password --- -->
                    <div class="input_box">
                        <input type="password" placeholder="Enter your password" name="password" required />
                        <i class="material-icons password">lock</i>
                        <i class="material-icons pw_hide">visibility</i>
                    </div>
                    <!-- --- Entrada para repetir password --- 
                    <div class="input_box">
                        <input type="password" placeholder="Enter your password" required />
                        <i class="material-icons password">lock</i>
                        <i class="material-icons pw_hide">visibility</i>
                    </div>-->
                    <!-- --- Casilla recordar usuario --- -->
                    <div class="option_field">
                        <span class="checkbox">
                            <input type="checkbox" id="check" />
                            <label for="check">Remember me</label>
                        </span>
                        <!-- --- Recuperar contraseña --- -->
                        <!-- <a href="#" class="forgot_pw">Forgot password?</a> -->
                    </div>
                    <button type="submit" name="login" class="button">Login Now</button>
                    <div class="login_signup">Don't have an account? <a href="#" id="signup">Signup</a></div>
                </form>
            </div>
            <!-- --- Formulario Signup --- -->
            <div class="form signup_form">
                <form action="php/registrarUsuario.php" method="post">
                    <h2>Signup</h2>
                    <div class="input_box">
                        <input type="text" placeholder="Enter your nickname" name="nickname" required />
                        <i class="material-icons icon email">account_circle</i>
                    </div>
                    <!-- --- Entrada de correo electronico --- -->
                    <div class="input_box">
                        <input type="email" placeholder="Enter your email" name="email" required />
                        <i class="material-icons icon email">email</i>
                    </div>
                    <!-- --- Creación de contraseña --- -->
                    <div class="input_box">
                        <input type="password" placeholder="Create password" name="pass" required />
                        <i class="material-icons password">lock</i>
                        <i class="material-icons pw_hide">visibility</i>
                    </div>
                    <!-- --- Confirmación Creación de contraseña --- -->
                    <div class="input_box">
                        <input type="password" placeholder="Confirm password" name="confirm" required />
                        <i class="material-icons password">lock</i>
                        <i class="material-icons pw_hide">visibility</i>
                    </div>
                    <button type="submit" name="register" class="button">Signup Now</button>
                    <div class="login_signup">Already have an account? <a href="#" id="login">Login</a></div>
                </form>
            </div>
        </div>
    </section>

    <!-- --- Se carga la lista de música con un array de objetos en js CAMBIAR --- -->
    <!-- <script src="js/music-list.js"></script> -->

    <script>
        /* Se le quita el /upload a la dirección del archivo de img y music  */
        let strImg = <?php echo json_encode($imgSong); ?>;
        let newStrImg = strImg.slice(7);
        let strSong = <?php echo json_encode($fileSong); ?>;
        let newStrSong = strSong.slice(7);
        let allMusic = [{
            name: <?php echo json_encode($nameSong); ?>,
            artist: <?php echo json_encode($idArtista); ?>,
            img: newStrImg,
            src: newStrSong
        }];
    </script>

    <!-- --- Se llaman los botones por id y se les crea las funciones y los escuchadores --- -->
    <script src="js/script.js"></script>
    <!-- --- Se llama el script para la funcionalidad del Darkmode --- -->
    <script src="js/darkscript.js"></script>
    <!-- --- Se llama el script del login --- -->
    <script src="js/formscript.js"></script>
</body>

</html>