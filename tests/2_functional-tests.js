const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');
const routes = require('../routes/api');
const issueSchema = routes.issueSchema;
const issueModel = mongoose.model('issueModel', issueSchema);

chai.use(chaiHttp);

suite('Functional Tests', function() {

    test('Create an issue with every field: POST', function (done) {
        chai
        .request(server)
        .keepOpen()
        .post('/api/issues/apitest')
        .send ({
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe",
            "assigned_to": "Joe",
            "status_text": "In QA"
        })
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, 'Fix error in posting data');
            assert.equal(res.body.issue_text, 'When we post data it has an error.');
            assert.equal(res.body.created_by, 'Joe');
            assert.equal(res.body.assigned_to, 'Joe');
            assert.equal(res.body.status_text, 'In QA');
            assert.equal(res.body.project, 'apitest');
            done();
        });
    });

    test('Create an issue with only required fields: POST', function (done) {
        chai
        .request(server)
        .keepOpen()
        .post('/api/issues/apitest')
        .send ({
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe"
        })
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, 'Fix error in posting data');
            assert.equal(res.body.issue_text, 'When we post data it has an error.');
            assert.equal(res.body.created_by, 'Joe');
            assert.equal(res.body.assigned_to, '');
            assert.equal(res.body.status_text, '');
            assert.equal(res.body.project, 'apitest');
            done();
        });
    });

    test('Create an issue with missing required fields: POST', function (done) {
        chai
        .request(server)
        .keepOpen()
        .post('/api/issues/apitest')
        .send ({
            "issue_title": "Fix error in posting data",
            "issue_text": "",
            "created_by": ""
        })
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'required field(s) missing' });
            done();
        });
    });

    test('View issues on a project: GET', function (done) {
        chai
        .request(server)
        .keepOpen()
        .get('/api/issues/apitest')
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            for (i = 0; i < res.body.length; i++)
                assert.isString(res.body[i].project);
            done();
        });
    });

    test('View issues on a project with one filter: GET', function (done) {
        chai
        .request(server)
        .keepOpen()
        .get('/api/issues/apitest?open=true')
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            for (i = 0; i < res.body.length; i++)
                assert.equal(res.body[i].open, true);
            done();
        });
    });

    test('View issues on a project with multiple filters: GET', function (done) {
        chai
        .request(server)
        .keepOpen()
        .get('/api/issues/apitest?open=true&project=apitest')
        .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            for (i = 0; i < res.body.length; i++) {
                assert.equal(res.body[i].open, true);
                assert.equal(res.body[i].project, 'apitest')
            }
            done();
        });
    });

    test('Update one field on an issue: PUT', function (done) {
        const issue = new issueModel({ 
            "project": "apitest",
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe"
        });
        issue.save();

        chai
            .request(server)
            .keepOpen()
            .put('/api/issues/apitest')
            .send ({
                "_id": issue._id,
                "created_by": "Jill"
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {  result: 'successfully updated', '_id': issue._id.toString() });
                done();
            });
    });

    test('Update multiple fields on an issue: PUT', function (done) {
        const issue = new issueModel({ 
            "project": "apitest",
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe"
        });
        issue.save();

        chai
            .request(server)
            .keepOpen()
            .put('/api/issues/apitest')
            .send ({
                "_id": issue._id,
                "issue_text": "we have no idea.",
                "created_by": "Jill"
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {  result: 'successfully updated', '_id': issue._id.toString() });
                done();
            });
    });

    test('Update an issue with missing _id: PUT', function (done) {
        chai
            .request(server)
            .keepOpen()
            .put('/api/issues/apitest')
            .send ({
                "created_by": "Jill"
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, { error: 'missing _id' });
                done();
            });
    });

    test('Update an issue with no fields to update: PUT', function (done) {
        const issue = new issueModel({ 
            "project": "apitest",
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe"
        });
        issue.save();

        chai
            .request(server)
            .keepOpen()
            .put('/api/issues/apitest')
            .send ({
                "_id": issue._id
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {error: 'no update field(s) sent', '_id': issue._id.toString() });
                done();
            });
    });

    test('Update an issue with an invalid _id: PUT ', function (done) {
        chai
            .request(server)
            .keepOpen()
            .put('/api/issues/apitest')
            .send ({
                "_id": "1234",
                "created_by": "Jill"
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, { error: 'could not update', '_id': "1234" });
                done();
            });
    });

    
    test('Delete an issue: DELETE', function (done) {
        const issue = new issueModel({ 
            "project": "apitest",
            "issue_title": "Fix error in posting data",
            "issue_text": "When we post data it has an error.",
            "created_by": "Joe"
        });
        issue.save();

        chai
            .request(server)
            .keepOpen()
            .delete('/api/issues/apitest')
            .send ({
                "_id": issue._id
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.result, 'successfully deleted');
                done();
            });
    });

    test('Delete an issue with an invalid _id: DELETE', function (done) {

        chai
            .request(server)
            .keepOpen()
            .delete('/api/issues/apitest')
            .send ({
                "_id": 1234
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {error: 'could not delete', '_id': 1234});
                done();
            });
    });

    test('Delete an issue with missing _id: DELETE', function (done) {

        chai
            .request(server)
            .keepOpen()
            .delete('/api/issues/apitest')
            .send ({})
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {error: 'missing _id'});
                done();
            });
    });
});
