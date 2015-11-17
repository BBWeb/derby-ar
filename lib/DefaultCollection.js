module.exports = DefaultCollection;

function DefaultCollection() {}

DefaultCollection.prototype.query = function () {
  var args = Array.prototype.slice.call(arguments);
  args = [this._at].concat(args);

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
  // No args passed, just pass along as scoped
  if(!args.length) return this.root[method].apply(this);;

  // A cb was the only argument passed, just pass along as scoped
  if(typeof args[0] === 'function') return this.root[method].apply(this, args);

  // A path (i.e. a string) was passed as the first arg - just pass long as scoped
  if(typeof args[0] === 'string') return this.root[method].apply(this, args);

  // A query was passed along, we need to go to root
  return this.root[method].apply(this, args);
};
