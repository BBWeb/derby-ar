# derby-orm
Plugin for adding ORM functionality to Derby

How to use
==========
After adding the plugin:
```javascript
derby.use(require('derby-orm'));
```

One can add model layer code automatically to the model layer and schemas:

```javascript
function CollectionConstructor() {}

CollectionConstructor.prototype.doSomethingWithCollection = function() {
  // Your code here
};

function ItemConstructor() {}

ItemConstructor.prototype.doSomethingWithItem = function() {
  // Your code here
};

derby.model({
  name: 'myCollection',
  schema: {}, // Schema - see https://github.com/derbyparty/racer-schema for more details
  formats: {}, // Formats according to https://github.com/derbyparty/racer-schema
  validators: {}, // Validators according to https://github.com/derbyparty/racer-schema
  Collection: CollectionConstructor,
  Item: ItemConstructor
});
```

All added schemas are automatically validated server-side and will return errors in the appropriate callbacks - see https://github.com/derbyparty/racer-schema for more details. Formats and validators are there to help the schema validations.

The functionality added to the CollectionConstructor and ItemConstructor can be used to add Model layer (Model as in MVC) such as examplified below:

```javascript
...
var myCollection = model.at('myCollection'); // model needs to be root here, e.g. model.root if used inside Components
myCollection.subscribe(function () {
  myCollection.doSomethingWithCollection();

  var myItem = myCollection.at('<id of myItem>');

  myItem.doSomethingWithItem();
});
...
```

How it works
============
Automatically when scoping a model to a collection or item level which has CollectionConstructor and/or ItemConstructor added, the scoped model will inherit the prototype of the Collection/Item-Constructor. Thus, all normal model operations are possible, such as examplified below:

```javascript
...
myCollection.get(); // Will return plain Collection object of all items in collection

myItem.set('firstName', 'Carl-Johan'); // Works as normal set
myItem.set('lastName', 'Blomqvist'); // Works as normal set

myItem.start('fullName', 'firstName', 'lastName', function (firstName, lastName) {
  return firstName + ' ' + lastName;
});

myItem.get('fullName') // Returns 'Carl-Johan Blomqvist'
...
```

Ideas and limitations
=====================
* There are currently no way to add collection/item specific hooks triggered server side.
* There still needs some work to make dereferencing properly work.
* Relations should be added to the schema as a way to automatically subscribe to multiple levels of related collections, and to automatically create references/refLists between items. There's no such functionality right now.
