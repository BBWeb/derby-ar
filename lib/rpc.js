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
        var cb = new Function();
      } else {
        var cb = args.pop();
      }

      var data = {method: method, path: path, args: args};

      model.root.channel.send('derby-ar-rpc', data, cb);
    }
  }

  _.each(prototype, function (fn, method) {
    fn.rpc = rpcClosure(model, path, method);
  });

  return prototype;
}

// Add RPC support
function plugin(derby) {
  // Wrap createStore in order to be able to listen to RPC calls
  // But only do it once (e.g. if we have many apps, we need to ensure we only wrap it once since otherwise we'll destroy the wrapping)
  if(!derby._createStore) {
    derby._createStore = derby.createStore;
    derby.createStore = function () {
      // Create store using regular creatStory method
      var store = this._createStore.apply(this, arguments);

      store.on('client', function (client) {
        client.channel.on('derby-ar-rpc', function (data, cb) {
          var method = data.method;
          var args = data.args;
          var path = data.path;
          var model = store.createModel();

          args.push(cb);

          var $scoped = model.scope(path);
          $scoped[method].apply($scoped, args);
        });
      });

      return store;
    };
  }
}
