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

      var data = {method: method, args: args};

      // TODO: Break current API so that one should always assume there's an err passed as firt var - or?
      function callback(err, args) {
        if(err) throw new Error(err);

        cb.apply(this, args);
      }

      var query = model.root.connection.createFetchQuery(path, data, {db: '$rpc'}, callback);

      // Overwrite _handleResponse in order to bypass adding docs etc. to model
      query._handleResponse = function (err, data, extra) {
        var callback = this.callback;
        this.callback = null;
        if(err) return this._finishResponse(err, callback);

        // Set args as results
        if(data && data[0] && data[0].data && data[0].data.args) {
          this.results = data[0].data.args;
        } else {
          this.results = [];
        }

        this._finishResponse(null, callback);
      };
    }
  }

  _.each(prototype, function (fn, method) {
    fn.rpc = rpcClosure(model, path, method);
  });

  return prototype;
}

// Add RPC support
function plugin(derby) {
  // Wrap createBackend in order to be able to listen to RPC calls
  // But only do it once (e.g. if we have many apps, we need to ensure we only wrap it once since otherwise we'll destroy the wrapping)
  if(!derby._createBackend) {
    derby._createBackend = derby.createBackend;
    derby.createBackend = function () {
      // Create backend using regular createBackend method
      var backend = this._createBackend.apply(this, arguments);

      // Add extra DB for handling RPC calls
      backend.extraDbs['$rpc'] = new DB(backend);

      return backend;
    };
  }
}

// Our fake DB for calling methods on model
function DB(backend) {
  this.backend = backend;
}

DB.prototype.query = function (path, query, fields, options, callback) {
  var method = query.method;
  var args = query.args;
  var model = this.backend.createModel();

  function cb() {
    var args = Array.prototype.slice.call(arguments);

    callback.call(this, null, [{v: 1, data: {args: args}}]);
  }

  args.push(cb);

  var $scoped = model.scope(path);
  $scoped[method].apply($scoped, args);
};
