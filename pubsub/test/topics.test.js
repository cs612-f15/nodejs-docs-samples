// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var proxyquire = require('proxyquire').noCallThru();
var topicName = 'foo';

function getSample () {
  var topicMock = {
    get: sinon.stub(),
    publish: sinon.stub().callsArgWith(1, null, [1]),
    delete: sinon.stub().callsArgWith(0, null)
  };
  topicMock.get.callsArgWith(1, null, topicMock);
  var topicsMock = [
    {
      name: topicName
    }
  ];

  var pubsubMock = {
    topic: sinon.stub().returns(topicMock),
    getTopics: sinon.stub().callsArgWith(0, null, topicsMock)
  };
  var PubSubMock = sinon.stub().returns(pubsubMock);
  return {
    program: proxyquire('../topics', {
      '@google-cloud/pubsub': PubSubMock
    }),
    mocks: {
      PubSub: PubSubMock,
      pubsub: pubsubMock,
      topics: topicsMock,
      topic: topicMock
    }
  };
}

describe('pubsub:topics', function () {
  describe('create', function () {
    it('should create a topic', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.createTopic(topicName, callback);

      assert.ifError(callback.firstCall.args[0]);
      assert.strictEqual(callback.firstCall.args[1], sample.mocks.topic);
      assert(console.log.calledWith('Created topic: %s', topicName));
    });
    it('should require name', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.createTopic(undefined, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message = '"name" is required!');
      assert.equal(callback.firstCall.args[1], undefined);
    });
    it('should handle error', function () {
      var sample = getSample();
      var error = new Error('error');
      var callback = sinon.stub();
      sample.mocks.topic.get.callsArgWith(1, error);

      sample.program.createTopic(topicName, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message === 'error');
    });
  });

  describe('delete', function () {
    it('should delete a topic', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.deleteTopic(topicName, callback);

      assert.ifError(callback.firstCall.args[0]);
      assert(console.log.calledWith('Deleted topic: %s', topicName));
    });
    it('should require name', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.deleteTopic(undefined, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message = '"name" is required!');
      assert.equal(callback.firstCall.args[1], undefined);
    });
    it('should handle error', function () {
      var sample = getSample();
      var error = new Error('error');
      var callback = sinon.stub();
      sample.mocks.topic.delete.callsArgWith(0, error);

      sample.program.deleteTopic(topicName, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message === 'error');
    });
  });

  describe('publish', function () {
    it('should publish a message', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.publishMessage(topicName, '{"data":"hello world"}', callback);

      assert.ifError(callback.firstCall.args[0]);
      assert.deepEqual(callback.firstCall.args[1], [1]);
      assert(console.log.calledWith('Published %d messages!', callback.firstCall.args[1].length));
    });
    it('should require name', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.publishMessage(undefined, undefined, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message = '"name" is required!');
      assert.equal(callback.firstCall.args[1], undefined);
    });
    it('should require message', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.publishMessage(topicName, undefined, callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message = '"message" is required!');
      assert.equal(callback.firstCall.args[1], undefined);
    });
    it('should require a valid JSON string', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.publishMessage(topicName, 'asdf', callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message = '"message" must be a valid JSON string!');
      assert.equal(callback.firstCall.args[1], undefined);
    });
    it('should handle error', function () {
      var sample = getSample();
      var error = new Error('error');
      var callback = sinon.stub();
      sample.mocks.topic.publish.callsArgWith(1, error);

      sample.program.publishMessage(topicName, '{"data":"hello world"}', callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message === 'error');
      assert.equal(callback.firstCall.args[1], undefined);
    });
  });

  describe('list', function () {
    it('should list topics', function () {
      var sample = getSample();
      var callback = sinon.stub();

      sample.program.listTopics(callback);

      assert.ifError(callback.firstCall.args[0]);
      assert.strictEqual(callback.firstCall.args[1], sample.mocks.topics);
      assert(console.log.calledWith('Found %d topics!', callback.firstCall.args[1].length));
    });
    it('should handle error', function () {
      var sample = getSample();
      var error = new Error('error');
      var callback = sinon.stub();
      sample.mocks.pubsub.getTopics.callsArgWith(0, error);

      sample.program.listTopics(callback);

      assert(callback.firstCall.args[0]);
      assert(callback.firstCall.args[0].message === 'error');
      assert.equal(callback.firstCall.args[1], undefined);
    });
  });

  describe('main', function () {
    it('should call createTopic', function () {
      var program = getSample().program;

      sinon.stub(program, 'createTopic');
      program.main(['create', topicName]);
      assert.equal(program.createTopic.calledOnce, true);
      assert.deepEqual(program.createTopic.firstCall.args.slice(0, -1), [topicName]);
    });

    it('should call deleteTopic', function () {
      var program = getSample().program;

      sinon.stub(program, 'deleteTopic');
      program.main(['delete', topicName]);
      assert.equal(program.deleteTopic.calledOnce, true);
      assert.deepEqual(program.deleteTopic.firstCall.args.slice(0, -1), [topicName]);
    });

    it('should call listTopics', function () {
      var program = getSample().program;

      sinon.stub(program, 'listTopics');
      program.main(['list']);
      assert.equal(program.listTopics.calledOnce, true);
      assert.deepEqual(program.listTopics.firstCall.args.slice(0, -1), []);
    });

    it('should call publishMessage', function () {
      var program = getSample().program;

      sinon.stub(program, 'publishMessage');
      program.main(['publish', topicName, '{}']);
      assert.equal(program.publishMessage.calledOnce, true);
      assert.deepEqual(program.publishMessage.firstCall.args.slice(0, -1), [topicName, '{}']);
    });
  });
});
