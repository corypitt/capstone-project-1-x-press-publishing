const express = require('express');
const sqlite3 = require('sqlite3');



const artistsRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || '../database.sqlite');

artistsRouter.get('/', (req, res, next)=> {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, artists) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({artists: artists});
        };

    });

});

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get('SELECT * FROM Artist WHERE id = $artistId', {
        $artistId: artistId
    }, (error, artist) => {
        if (error) {
            next(error);
        } else if (artist) {
            req.artist = artist;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

artistsRouter.get('/:artistId', (req, res, next)=> {
    res.status(200).json({artist: req.artist});
});

const validateArtist = (req, res, next) => {
    const artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        return res.sendStatus(400);
    } else {
        next();
    }
};

artistsRouter.post('/', validateArtist, (req, res, next) => {
    const artist = req.body.artist;
    const name = artist.name;
    const dateOfBirth = artist.dateOfBirth;
    const biography = artist.biography;
    const isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;

    const sql = 'INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, ' +
        '$dateOfBirth, $biography, $isCurrentlyEmployed)';
    const values = {
        $name: name,
        $dateOfBirth: dateOfBirth,
        $biography: biography,
        $isCurrentlyEmployed: isCurrentlyEmployed
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID}`,
                (error, artist) => {
                    res.status(201).json({artist: artist});
                });
        }
    });
});

artistsRouter.put('/:artistId', validateArtist, (req, res, next)=> {
    const artist = req.body.artist;
    const name = artist.name;
    const dateOfBirth = artist.dateOfBirth;
    const biography = artist.biography;
    const isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;

    const sql = 'UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, ' +
        'is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId';
    const values = {
        $name: name,
        $dateOfBirth: dateOfBirth,
        $biography: biography,
        $isCurrentlyEmployed: isCurrentlyEmployed,
        $artistId: req.params.artistId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
                (error, artist) => {
                     res.status(200).json({artist: artist});
                });
        }
    });
});

artistsRouter.delete('/:artistId', (req, res, next) => {

    const sql = `UPDATE Artist SET is_currently_employed = $unemployed WHERE Artist.id = $artistId`;
    const values = {
        $unemployed: 0,
        $artistId: req.params.artistId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
                (error, artist) => {
                    res.status(200).json({artist: artist});
                });
        }
    });
});




module.exports = artistsRouter;