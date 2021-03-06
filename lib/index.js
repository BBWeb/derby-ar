var _ = require('lodash');
var derbyServices = require('derby-services');
var racerRpc = require('racer-rpc');
var DefaultCollection = require('./DefaultCollection');
var DefaultItem = require('./DefaultItem');
var rpc = require('./rpc');

// TODO: Split up into one separate file for the server and one for the client for faster loading and less useless code transmitted to the client?
// See: https://github.com/derbyparty/derby-faq/tree/master/en#how-to-require-a-module-that-will-run-only-on-the-server-of-a-derby-application
module.exports = function(derby) {
  var racer = derby;
  var Model = racer.Model;
  var options = {
    schemas: {},
    formats: {},
    validators: {},
    skipNonExisting: true
  };
  racer._models = {};

  Model.INITS.push(function (model) {
    // Initiate racer-schema ASAP model is initiated as we then know no more models can be added
    racer.use(require('racer-schema'), options);
  });

  derby.use(racerRpc);
  derby.use(derbyServices);
  derby.use(rpc.plugin);

  /**
   * Adds model classes to Racer
   *
   * @param {Object} args
   * @param {String} args.name - the name/path to the collection on which to bind to
   * @param {Class} [args.Collection] - the model class to be used for the collection
   * @param {Class} [args.Item] - the model class to be used for each item in the collection
   * @param {Object} [args.schema] - a (model) schema for each item in the collection
   * @param {Object} [args.formats] - formats to be used for schema
   * @param {Object} [args.validators] - validators to be used for schema
   * @param {Array} [args.hooks] - a list of hooks to bind to Share. Note! Not yet implemented!
   */
  racer.model = function (args) {
    if(!args || !args.name) throw new Error('Name/path of collection must be passed');

    racer._models[args.name] = args;

    // Use racer-schema for underlying schema stuff
    // TODO: Possibly, do a transformation from a (imo) nicer format for schema stuff
    // TODO: Implement schema refs, basically not using racer-schema
    if(args.schema) options.schemas[args.name] = args.schema;
    if(args.formats) racer.util.mergeInto(options.formats, args.formats);
    if(args.validators) racer.util.mergeInto(options.validators, args.validators);

    // Look into how to do this best.
    if(args.hooks) throw new Error('Hooks are not yet implemented!');
  };

  // Overwrite scope, which is used by all other fns related to path
  // Preserve old scope fn for re-use internally
  Model.prototype._scope = Model.prototype.scope;
  Model.prototype.scope = function(path) {
    var segments = this.__splitPath(path);

    // No segments - no point in parsing further
    if(!segments.length) return this._scope(path);

    // Get Models
    var Model = racer._models[segments[0]];

    // Only allow collection level models straight up from non-dereferenced Models,
    // since otherwise we're either moving through a ref to a collection, which is just pointless (or is it?)
    // or we're moving through a refList on the refList level which doesn't point to the whole collection but only a subset of it - and in those scenarios we don't want a Collection Model to be returned
    // TODO: Revise assumption above, it seems that in some scenarios you'd want to create regular references to a whole collection like if you'd want to reference a certain global collection to a component's view model so that the component could render all of it (though, then it might be a special case of above where it is a "subset" that just happens to be all of the items of the original collection)
    // TODO: Review also for Item level - similar issues may arise there too.
    if(Model && segments.length === 1 && Model.Collection) {
      // We are at a collection level, return Collection instance
      // TODO: Add support for refList collections? See above
      return this._createCollection(path, Model.Collection);
    } else if(segments.length === 2 && Model && Model.Item) {
      // We are at an item level, return Item instance
      return this._createItem(path, Model.Item);
    }

    // Always fallback on original scope/regular Child Model
    return this._scope(path);
  };

  /**
   * Helper fn for splitting a full path
   */
  Model.prototype.__splitPath = function(path) {
    return (path && path.split('.')) || [];
  };

  /**
   * Helper fn for creating a collection for a specific path
   */
  Model.prototype._createCollection = function(path, constructor) {
    function Collection() {}

    constructor.prototype = rpc.add(this, path, constructor.prototype);

    Collection.prototype = _.assign(this._scope(path), DefaultCollection.prototype, constructor.prototype);

    return new Collection();
  }

  Model.prototype._createItem = function(path, constructor) {
    function Item() {}

    constructor.prototype = rpc.add(this, path, constructor.prototype);

    Item.prototype = _.assign(this._scope(path), DefaultItem.prototype, constructor.prototype);

    return new Item();
  }
};
