const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();

chai.use(chaiHttp);

describe('Server', () => {
  it('should return a welcome message on GET /', (done) => {
    chai.request(server)
      .get('/auth')
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal('Express');
        done();
      });
  });

  it('should handle non-existing routes with a 404', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
