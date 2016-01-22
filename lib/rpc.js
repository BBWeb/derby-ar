var _ = require('lodash');

module.exports = {
  add: add,
  plugin: plugin
};

function add(model, path, prototype) {
  function rpcClosure(model, path, method) {
    var model = model;
    var path = path;
    var method = method;

    return function rpc() {
      var args = Array.prototype.slice.call(arguments);

      if(!args.length || !_.isFunction(args[args.length - 1])) {
        var cb = _.noop;
      } else {
        var cb = args.pop();
      }

      var data = {method: method, args: args, path: path};

      model.call('derby-ar', data, cb);
    }
  }

  _.each(prototype, function (fn, method) {
    fn.rpc = rpcClosure(model, path, method);
  });

  return prototype;
}

// Add RPC support
function plugin(derby) {
  // Wrap createBackend in order to be able to listen to derby-ar RPC calls
  // But only do it once (e.g. if we have many apps, we need to ensure we only wrap it once since otherwise we'll destroy the wrapping)
  if(derby.__createBackend) return;

  derby.__createBackend = derby.createBackend;
  derby.createBackend = function () {
    // Create backend using regular createBackend method
    var backend = this.__createBackend.apply(this, arguments);

    backend.rpc.on('derby-ar', function (data, cb) {
      var path = data.path;
      var method = data.method;
      var args = data.args || [];

      var model = backend.createModel();
      var $scoped = model.scope(data.path);

      args.push(cb);

      $scoped[method].apply($scoped, args);
    });

    return backend;
  };
}
