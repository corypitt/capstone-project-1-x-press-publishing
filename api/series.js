const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const seriesRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next)=> {
    db.all('SELECT * FROM Series', (err, series) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({series: series});
        }
    });
});

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get('SELECT * FROM Series WHERE id = $seriesId', {
        $seriesId: seriesId
    }, (error, series) => {
        if (error) {
            next(error);
        } else if (series) {
            req.series = series;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

seriesRouter.get('/:seriesId', (req, res, next)=> {
    res.status(200).json({series: req.series});
});


const validateSeries = (req, res, next) => {
    const series = req.body.series;
    if (!series.name || !series.description) {
        return res.sendStatus(400);
    } else {
        next();
    }
};

seriesRouter.post('/', validateSeries, (req, res, next) => {
    const series = req.body.series;
    const name = series.name;
    const description = series.description;

    const sql = 'INSERT INTO Series (name, description) VALUES ($name, ' +
        '$description)';
    const values = {
        $name: name,
        $description: description
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Series WHERE series.id = ${this.lastID}`,
                (error, series) => {
                    res.status(201).json({series: series});
                });
        }
    });
});


seriesRouter.put('/:seriesId', validateSeries, (req, res, next)=> {
    const series = req.body.series;
    const name = series.name;
    const description = series.description;

    const sql = 'UPDATE Series SET name = $name, description = $description';
    const values = {
        $name: name,
        $description: description
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`,
                (error, series) => {
                    res.status(200).json({series: series});
                });
        }
    });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const issueValue = {
        $seriesId: req.params.seriesId
    };

    db.get(issueSql, issueValue, (error, issue)=> {
        if (error) {
            next(error);
        } else if (issue) {
              res.sendStatus(400);
            } else {

            const sql = 'DELETE FROM Series WHERE Series.id = $seriesId';
            const value = {$seriesId: req.params.seriesId};

            db.run(sql, value, (error) => {
                if (error) {
                    next(error)
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = seriesRouter;