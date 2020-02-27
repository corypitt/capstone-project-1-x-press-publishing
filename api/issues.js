const express = require('express');
const sqlite3 = require('sqlite3');

const issuesRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.get('/', (req, res, next)=> {

    const sql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const values = {
        $seriesId: req.params.seriesId
    };
    db.all(sql, values, (error, issues) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({issues: issues});
        }
    });
});



issuesRouter.post('/', (req, res, next)=> {

    const issue = req.body.issue;
    const name = issue.name;
    const issueNumber = issue.issueNumber;
    const publicationDate = issue.publicationDate;
    const artistId = issue.artistId;

    const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = {$artistId: artistId};

    db.get(artistSql, artistValues, (error, artist) => {
        if (error) {
            next(error);
        } else {
            if (!name || !issueNumber || !publicationDate || !artist) {
                return res.sendStatus(400);
            }

            const sql = 'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ' +
                '($name, $issueNumber, $publicationDate, $artistId, $seriesId)';
            const values = {
                $name: name,
                $issueNumber: issueNumber,
                $publicationDate: publicationDate,
                $artistId: artistId,
                $seriesId: req.params.seriesId
            };

            db.run(sql, values, function(error) {
                if (error) {
                    next(error);
                } else {
                    db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`,
                        (error, issue) => {
                        res.status(201).json({issue: issue});

                        });
                }
            });


        }
    });
});

issuesRouter.param('issueId', (req, res, next, issueId)=> {
    const sql = 'SELECT * FROM Issue WHERE Issue.id = $issueId';
    const values = {
        $issueId: issueId
    };
    db.get(sql, values, (error, issue) => {
        if (error) {
            next(error);
        } else if (issue) {
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

issuesRouter.put('/:issueId', (req, res, next) => {

    const issue = req.body.issue;
    const name = issue.name;
    const issueNumber = issue.issueNumber;
    const publicationDate = issue.publicationDate;
    const artistId = issue.artistId;

    const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = {$artistId: artistId};

    db.get(artistSql, artistValues, (error, artist) => {
        if (error) {
            next(error);
        } else {
            if (!name || !issueNumber || !publicationDate || !artist) {
                return res.sendStatus(400);
            }

            const sql = 'UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.id = $issueId';
            const values = {
                $name: name,
                $issueNumber: issueNumber,
                $publicationDate: publicationDate,
                $artistId: artistId,
                $issueId: req.params.issueId
            };

            db.run(sql, values, function(error) {
                if (error) {
                    next(error);
                } else {
                    db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`,
                        (error, issue) => {
                            res.status(200).json({issue: issue});

                        });
                }
            });
        }
    });

});


issuesRouter.delete('/:issueId', (req, res, next) => {

    const sql = 'DELETE FROM Issue WHERE Issue.id = $issueId';
    const value = {$issueId: req.params.issueId};

    db.run(sql, value, (error) => {
        if (error) {
            next(error);
        } else {
                res.sendStatus(204);
            }
    });
});



module.exports = issuesRouter;