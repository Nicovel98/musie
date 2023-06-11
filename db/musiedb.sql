CREATE DATABASE musie;

USE musie;

CREATE TABLE Persona(
	idPersona INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nickName VARCHAR(30) NOT NULL,
	email VARCHAR(40) NOT NULL,
	pass VARCHAR(999) NOT NULL	
);

CREATE TABLE RolPersona(
	idRolPersona INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    descripcionPersona VARCHAR(50) NOT NULL
);

/* ALTER TABLE Persona ADD CONSTRAINT FK_Persona_RolPersona 
	FOREIGN KEY (idPersona) 
	REFERENCES RolPersona (idRolPersona); */

CREATE TABLE Genero (
	idGenero INT AUTO_INCREMENT PRIMARY KEY,
    descripcionGenero VARCHAR(50) NOT NULL    
);

CREATE TABLE Artista ( 
	idArtista INT AUTO_INCREMENT PRIMARY KEY, 
	nombreArtista VARCHAR(40) NOT NULL, 
	paisArtista VARCHAR(45) NOT NULL 
);

CREATE TABLE Cancion (
	idCancion INT AUTO_INCREMENT PRIMARY KEY,
	nombreCancion VARCHAR(40) NOT NULL,
    imagenCancion BLOB NOT NULL,
	archivoCancion BLOB NOT NULL,
    duracion TIME NOT NULL,
    idGenero INT NOT NULL,
    idArtista INT NOT NULL
);

/* ALTER TABLE Cancion ADD CONSTRAINT FK_Cancion_Genero
	FOREIGN KEY (idGenero) 
	REFERENCES Genero (idGenero);

ALTER TABLE Cancion ADD CONSTRAINT FK_Cancion_Artista
	FOREIGN KEY (idArtista) 
	REFERENCES Artista (idArtista); */

CREATE TABLE ListaReproducion(
	idLista INT NOT NULL PRIMARY KEY,
    nombreLista VARCHAR(100) NOT NULL,
    idPersona INT NOT NULL
);

/* ALTER TABLE ListaReproducion ADD CONSTRAINT FK_ListaReproducion_Persona
	FOREIGN KEY (idPersona) 
	REFERENCES Persona (idPersona); */

CREATE TABLE ListaCancion(
	idLista INT NOT NULL, 
    idCancion INT NOT NULL, 
    PRIMARY KEY (idLista, idCancion)
);

/* ALTER TABLE ListaCancion ADD CONSTRAINT FK_ListaCancion_ListaReproducion
	FOREIGN KEY (idLista) 
	REFERENCES ListaReproducion (idLista); */
    
/* ALTER TABLE ListaCancion ADD CONSTRAINT FK_ListaCancion_Cancion
	FOREIGN KEY (idCancion) 
	REFERENCES Cancion (idCancion); */

CREATE TABLE Login(
	idLogin INT NOT NULL PRIMARY KEY,
    nombreLogin VARCHAR(40) NOT NULL,
    passwordLogin VARCHAR(40) NOT NULL   
);





















