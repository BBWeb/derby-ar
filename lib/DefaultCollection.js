module.exports = DefaultCollection;

function DefaultCollection() {}

DefaultCollection.prototype.query = function () {
  var args = Array.prototype.slice.call(arguments);

  // Add current collection as default path
  if(args.length === 1) args = [this._at].concat(args);

  return this.root.query.apply(this.root, args);
};

DefaultCollection.prototype.subscribe = function () {
  var args = Array.prototype.slice.call(arguments);

  this._fetchSubscribe('subscribe', args);
};

DefaultCollection.prototype.fetch = function () {
  var args = Array.prototype.slice.call(arguments);

  this._fetchSubscribe('fetch', args);
};

DefaultCollection.prototype._fetchSubscribe = function (method, args) {
  // No query was passed along, add query for everything as first arg
  if(!args.length || typeof args[0] === 'function') args.unshift(this.query({}));

  // Always go to root
  return this.root[method].apply(this, args);
};
