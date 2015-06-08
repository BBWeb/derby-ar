module.exports = function(racer) {
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

    if(!segments.length) return this._scope(path);

    var Model = racer._models[segments[0]];

    // No classes saved to this collection path
    if(!Model) return this._scope(path);

    // Dereference to simplify checks (if refs are present)
    var dereferencedSegments = this._dereference(segments);
    var dereferenced = dereferencedSegments.join('.');

    if(segments.length === 1 && Model.Collection) {
      // We are at a collection level, return Collection instance
      // TODO: Add support for refList collections

      return this._createCollection(path, Model.Collection);
    } else if(dereferencedSegments.length === 2 && Model.Item) {
      // We are at an item level, return Item instance

      return this._createItem(dereferenced, Model.Item);
    }

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

    Collection.prototype = racer.util.mergeInto(this._scope(path), constructor.prototype);

    return new Collection();
  }

  Model.prototype._createItem = function(path, constructor) {
    function Item() {}

    Item.prototype = racer.util.mergeInto(this._scope(path), constructor.prototype);

    return new Item();
  }

  // Taken straight from Racer since it's not possible to access it externally
  function ChildModel(model) {
    // Shared properties should be accessed via the root. This makes inheritance
    // cheap and easily extensible
    this.root = model.root;

    // EventEmitter methods access these properties directly, so they must be
    // inherited manually instead of via the root
    this._events = model._events;
    this._maxListeners = model._maxListeners;

    // Properties specific to a child instance
    this._context = model._context;
    this._at = model._at;
    this._pass = model._pass;
    this._silent = model._silent;
    this._eventContext = model._eventContext;
  }
  ChildModel.prototype = new Model();
};
