var express = require('express');
var router = express.Router();
var orm = require('orm');
var helpers = require('../helpers');
var async = require('async');

// All notes (main page)
router.get('/', helpers.loginRequired, function(req, res) {
  req.user.getNotes(req.param("order", "-updated_at"), function(i, notes) {
    async.map(notes, function(item, cb) {
      item.getPad(function(err, pad) {
        item.pad = pad;
        return cb(null, item);
      })
    }, function(err, results) {
      res.render('notes/list', {title: 'All notes', notes: results});
    });
  })
});

// Inject note in request
router.use('/notes/:id', function(req, res, next) {
  if (req.user) {
    req.models.Note.one(
      {id: req.param('id'), user_id: req.user.id},
      function(err, note) {
        req.note = note;
        next();
      });
  } else {
    next();
  }
});

// Create new note
router.get('/notes/create', helpers.loginRequired, function(req, res) {
  res.render('notes/create', {title: 'New note'});
});

router.post('/notes/create', helpers.loginRequired, function(req, res) {
  var data = req.body;
  data['user_id'] = req.user.id;
  req.models.Note.create(data, function(err, message) {
    if (err) {
      res.locals.errors = helpers.formatModelErrors(err);
    } else {
      req.flash(
        'success',
        'Note is successfully created'
      );
      return res.redirect('/');
    }
    res.render('notes/create', {title: 'New note'});
  });
});

// Edit note
router.get('/notes/:id/edit', helpers.loginRequired, function(req, res) {
  res.render('notes/edit', {title: 'Edit note', note: req.note});
});

router.post('/notes/:id/edit', helpers.loginRequired, function(req, res) {
  req.note.save({name: req.param('name')}, function(err) {
    if (err) {
      res.locals.errors = helpers.formatModelErrors(err);
      res.render('notes/edit', {title: 'Edit note', note: note});
    } else {
      req.flash(
        'success',
        'Note is successfully updated'
      );
      res.redirect('/');
    }
  });
});

// Delete note
router.get('/notes/:id/delete', helpers.loginRequired, function(req, res) {
  res.render('notes/delete', {title: 'Delete note', note: req.note});
});

router.post('/notes/:id/delete', helpers.loginRequired, function(req, res) {
  req.note.remove(function(err) {
    req.flash(
      'success',
      'Note is successfully deleted'
    );
    res.redirect('/');
  });
});

module.exports = router;
