# derby-ar
Plugin for helping writing ActiveRecord style/pattern code for Derby

How to use
==========
After adding the plugin:
```javascript
derby.use(require('derby-ar'));
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

Features
========
In addition to the base functionality described above, one can call each method as a RPC (Remote Procedure Call), and one can easily switch between ensuring certain methods are only processed server-side. This is useful when one does not trust the client do so certain processing, e.g. when certain processesing is to cumbersome for clients. Any method that exists on any Collection or Item class, can also be triggered in the following manner to process it server-side:

```javascript
// Trigger myMethod client-side, just like normally
myCollection.myMethod(myArg1, myArg2, callback);

// Trigger myMethod as a RPC
myCollection.myMethod.rpc(myArg1, myArg2, callback);
```

E.g. the only difference in how to call a method as a RPC (and make it process server-side) is to add `.rpc` after the method. The same parameters should be passed. Noteworthy is that a function can in some instances be triggered client side and in some instances triggered as a RPC - this is fully up to the caller.

NOTE! There's one requirement for any method which is possibly called as a RPC. It needs to have a callback function (since RPCs are always asynchronous), and the callback needs to be the last argument passed.
NOTE 2! This does not protect the methods - they are still passed along to the client.

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
