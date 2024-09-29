'use strict';

// mongoose
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
// Schema setup
const issueSchema = new Schema({
  project: {type: String, required: true},
  issue_title: {type: String, required: true},
  issue_text: {type: String, required: true},
  created_on: {type: Date, default: Date.now},
  updated_on: {type: Date, default: Date.now},
  created_by: {type: String, required: true},
  assigned_to: {type: String},
  open: {type: Boolean, default: true},
  status_text: {type: String}
});
// Model setup
const issueModel = mongoose.model('issueModel', issueSchema);

module.exports = issueSchema;

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    // view
    .get(async function (req, res){
      var findquery = req.query;
      findquery['project'] = req.params.project;
      var issues = await issueModel.find(findquery).select('-__v');
      res.json(issues);
    })
    
    // save
    .post(async function (req, res){
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) res.json({ error: 'required field(s) missing' });
      else { var issue = new issueModel({
        project: req.params.project,
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || ""
      });
      await issue.save();
      issue = await issueModel.findById(issue._id).select('-__v');
      res.json(issue);
    }
    })
    
    // update
    .put(async function (req, res){
      if (!req.body._id) res.json({ error: 'missing _id' });
      else {
        var update_data = {};
        if (req.body.issue_title) update_data["issue_title"] = req.body.issue_title;
        if (req.body.issue_text) update_data["issue_text"] = req.body.issue_text;
        if (req.body.created_by) update_data["created_by"] = req.body.created_by;
        if (req.body.assigned_to) update_data["assigned_to"] = req.body.assigned_to;
        if (req.body.status_text) update_data["status_text"] = req.body.status_text;
        if (req.body.open) update_data["open"] = false;

        if (Object.keys(update_data).length === 0) res.json({ error: 'no update field(s) sent', '_id': req.body._id });
        else {
          update_data["updated_on"] = Date.now();
          try {
            var issue = await issueModel.findByIdAndUpdate(req.body._id, update_data, {new: true});
            res.json({  result: 'successfully updated', '_id': issue._id });
          } catch (error) {
            res.json({ error: 'could not update', '_id': req.body._id })
          }
        }
      }
    })
    
    // delete
    .delete(async function (req, res){
      if (!req.body._id) res.json({error: 'missing _id'});
      else  try {
        var issue = await issueModel.findByIdAndDelete(req.body._id).select('-__v');
        res.json({result: "successfully deleted", '_id': issue._id});
      } catch (error) {
        res.json({error: 'could not delete', '_id': req.body._id})
      }
      
    });
    
};
