var Promise = require('bluebird');
var assert = require('chai').assert;
var amqp = require('amqplib/callback_api');
var exchange = require('../lib/exchange');

describe('exchange', function() {

  describe('constructor', function() {

    describe("with empty name ('') and direct type", function() {
      var e = exchange('', 'direct');
      it('returns an exchange', function() {
        assert.equal(e.name, '');
        assert.equal(e.type, 'direct');
        assert.ok(e.queue);
        assert.ok(e.publish);
      });
    });

    describe('with no name', function() {

      describe('and a direct type', function() {
        var e = exchange(undefined, 'direct');
        it('receives the default name amq.direct', function() {
          assert.equal(e.name, 'amq.direct');
        });
      });

      describe('and a fanout type', function() {
        var e = exchange(undefined, 'fanout');
        it('receives the default name amq.fanout', function() {
          assert.equal(e.name, 'amq.fanout');
        });
      });

      describe('and a topic type', function() {
        var e = exchange(undefined, 'topic');
        it('receives the default name amq.topic', function() {
          assert.equal(e.name, 'amq.topic');
        });
      });

      describe('and no type', function() {
        it('throws an error', function() {
          assert.throws(exchange.bind(this, undefined, undefined), 'missing exchange type');
        });
      });
    });
  });

  describe('#connect', function() {
    before(function(done) {
      amqp.connect(process.env.RABBIT_URL, function(err, conn) {
        assert.ok(!err);
        this.connection = conn;
        done();
      }.bind(this));
    });
    it('emits a "connected" event', function(done) {
      exchange('', 'direct')
        .connect(this.connection)
          .once('connected', function (channel) {
            assert.ok(channel.consume);
            done();
          });
    });
  });

  describe('#queue', function() {
    describe('with no options', function() {
      var directExchange;
      before(function(done) {
        amqp.connect(process.env.RABBIT_URL, function(err, conn) {
          assert.ok(!err);
          this.connection = conn;
          done();
        }.bind(this));
      });
      before(function() {
        directExchange = exchange('', 'direct');
        this.q = directExchange
          .connect(this.connection)
            .queue({name: 'someQueue'});
      });
      it('returns a queue instance', function() {
        assert.ok(this.q.consume);
      });
      describe('delayed consume', function () {
        it('should be able to attach consumer', function () {
          var consumerSpyInvoked = false;

          function consumerSpy() {
            consumerSpyInvoked = true;
          }

          var q = this.q;
          return new Promise(function (resolve) {
            q.once('ready', resolve);
          }).then(function () {
                q.consume(consumerSpy, {noAck: true});
                directExchange.publish('abc', {key: 'someQueue'});
              })
              .delay(100)
              .then(function () {
                assert.equal(true, consumerSpyInvoked);
              });
        });
      });
    });
  });

  describe('#publish', function() {
    
  });
});
