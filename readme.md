# node-azure-search

A JavaScript client library for the Azure Search service, which works from either from Node.js or the browser. The module is browserify compatible.

This module calls the Azure Search REST API. The documentation for the API is available [here](http://msdn.microsoft.com/library/azure/dn798935.aspx).

## Installation

Use npm:

```
$ npm install azure-search
```

## Usage

If using from node:

```js
var AzureSearch = require('azure-search');
var client = AzureSearch({
	url: "https://XXX.search.windows.net",
	key:"YYY"
});
```

If using in the browser:

```html
<html>
	<head>
		<script src="azure-search.min.js"></script>
	</head>
	<body>
		<script>

		var client = AzureSearch({
			url: "https://XXX.search.windows.net",
			key:"YYYY"
		});

		</script>
	</body>
</html>
```
> Note that from the browser, you must have the `corsOptions` set in the index schema, and only `search`, `suggest`, `lookup` and `count` will work.

A client object can then be used to create, update, list, get and delete indexes:

```js
var schema = {
  name: 'myindex',
  fields:
   [ { name: 'id',
       type: 'Edm.String',
       searchable: false,
       filterable: true,
       retrievable: true,
       sortable: true,
       facetable: true,
       key: true },
     { name: 'description',
       type: 'Edm.String',
       searchable: true,
       filterable: false,
       retrievable: true,
       sortable: false,
       facetable: false,
       key: false } ],
  scoringProfiles: [],
  defaultScoringProfile: null,
  corsOptions: null };

// create/update an index
client.createIndex(schema, function(err, schema){
	// optional error, or the schema object back from the service
});

// update an index
client.updateIndex('myindex', schema, function(err){
  // optional error
});

// get an index
client.getIndex('myindex', function(err, schema){
	// optional error, or the schema object back from the service
});

// list the indexes
client.listIndexes(function(err, schemas){
	// optional error, or the list of schemas from the service
});

// get the stats for an index
client.getIndexStats('myindex', function(err, stats){
	// optional error, or the list of index stats from the service
});

// delete an index
client.deleteIndex('myindex', function(err){
	// optional error
});
```

You can also add documents to the index, and search it:

```js
var doc1 = {
  "id": "document1",
  "description": "this is the description of my document"
}

// add documents to an index
client.addDocuments('myindex', [doc1], function(err, results){
	// optional error, or confirmation of each document being added
});

// retrieve a document from an index
client.lookup('myindex', 'document1', function(){
	// optional error, or the document
});

// count the number of documents in the index
client.count('myindex', function(err, count){
	// optional error, or the number of documents in the index
});

// search the index
client.search('myindex', {search: "document", $top: 10}, function(err, results){
	// optional error, or an array of matching results
});

// suggest results based on partial input
client.suggest('myindex', {search: "doc"}, function(err, results){
	// optional error, or an array of matching results
});
```

### Accessing the Raw Response

The raw response body is always returned as the 3rd argument in the callback.

i.e.

```js
// search the index
client.search('myindex', {search: "document", $top: 10}, function(err, results, raw){
	// raw argument contains response body as described here:
	// https://msdn.microsoft.com/en-gb/library/azure/dn798927.aspx
});

```

## License

MIT
