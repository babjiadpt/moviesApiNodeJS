const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("db server started http://localhost3000/");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const movieListObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const directorListObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//Returns a list of all movie names in the movie table API
app.get("/movies/", async (request, response) => {
  const getAllMoviesQuery = `SELECT * FROM movie `;
  const moviesArray = await db.all(getAllMoviesQuery);
  response.send(moviesArray.map((eachMovie) => movieListObject(eachMovie)));
});

//Creates a new movie in the movie table API
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieDetailsQuery = `
    INSERT INTO
            movie(director_id, movie_name, lead_actor)
     VALUES (
         ${directorId},
          '${movieName}', 
          '${leadActor}'
          );`;

  await db.run(addMovieDetailsQuery);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID API
app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId}`;
    const movieArray = await db.get(getMovieQuery);
    response.send(convertDbObjectToResponseObject(movieArray));
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
});

//Updates the details of a movie in the movie table based on the movie ID API
app.put("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const { directorId, movieName, leadActor } = request.body;
    const upDateMovieQuery = `
    UPDATE 
        movie 
    SET 
        director_id = '${directorId}',
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE 
        movie_id = ${movieId};`;

    await db.run(upDateMovieQuery);
    response.send(`Movie Details Updated`);
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
});

//Deletes a movie from the movie table based on the movie ID API
app.delete("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const deleteMovieQuery = `
    DELETE FROM
        movie 
    WHERE 
        movie_id = ${movieId};`;

    await db.run(deleteMovieQuery);
    response.send(`Movie Removed`);
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
});

//Returns a list of all directors in the director table API
app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `SELECT * FROM director `;
  const directorsArray = await db.all(getAllDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) => directorListObject(eachDirector))
  );
});

//Returns a list of all movie names directed by a specific director API
app.get("/directors/:directorId/movies/", async (request, response) => {
  try {
    const { directorId } = request.params;
    const getDirectorMovieNamesQuery = `
  SELECT * FROM 
        movie
  WHERE
        director_id = '${directorId}'`;

    const directorMoviesArray = await db.all(getDirectorMovieNamesQuery);
    response.send(
      directorMoviesArray.map((eachMovie) => movieListObject(eachMovie))
    );
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
});

module.exports = app;
