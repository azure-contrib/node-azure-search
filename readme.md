[![Build Status](https://travis-ci.org/azure-contrib/node-azure-search.svg?branch=master)](https://travis-ci.org/azure-contrib/node-azure-search)

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
  key: "YYY",
  version: "2016-09-01", // optional, can be used to enable preview apis
  headers: { // optional, for example to enable searchId in telemetry in logs
    "x-ms-azs-return-searchid": "true",
    "Access-Control-Expose-Headers": "x-ms-azs-searchid"
      
  }
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

 var data = {
      'text': 'Text to analyze',
      'analyzer': 'standard'
    }
// shows how an analyzer breaks text into tokens
client.testAnalyzer('myindex', data, function (err, tokens) {
  //optional error, or array of tokens
}

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

// search the index (note that multiple arguments can be passed as an array)
client.search('myindex', {search: "document", top: 10, facets: ["facet1", "facet2"]}, function(err, results){
	// optional error, or an array of matching results
});

// suggest results based on partial input
client.suggest('myindex', {search: "doc"}, function(err, results){
	// optional error, or an array of matching results
});
```

You can get, create, update and delete data sources:

```js
var options = {
	name : "blob-datasource",
	type : "azureblob",
	credentials : { connectionString : "DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=yyy" },
	container : { name : "mycontainer", query : "" }
}

client.createDataSource(options, function(err, data){
	// data source created
});

client.updateDataSource(options, function(err, data){
	// data source updated
});

client.deleteDataSource("blob-datasource", function(err, data){
	// data source deleted
});

client.getDataSource("dataSourceName", function(err, data) {
  //data source returned
});
```

You can also create, update, list, get, delete, run and reset indexers:

```js
var schema = {
  name: 'myindexer',
  description: 'Anything', //Optional. Anything you want, or null
  dataSourceName: 'myDSName', //Required. The name of an existing data source
  targetIndexName: 'myIndexName', //Required. The name of an existing index
  schedule: { //Optional. All of the parameters below are required.
    interval: 'PT15M', //The pattern for this is: "P[nD][T[nH][nM]]". Examples:  PT15M for every 15 minutes, PT2H for every 2 hours.
    startTime: '2016-06-01T00:00:00Z' //A UTC datetime when the indexer should start running.
  },
  parameters: { //Optional. All of the parameters below are optional.
    'maxFailedItems' : 10, //Default is 0
    'maxFailedItemsPerBatch' : 5, //Default is 0
    'base64EncodeKeys': false, //Default is false
    'batchSize': 500 //The default depends on the data source type: it is 1000 for Azure SQL and DocumentDB, and 10 for Azure Blob Storage
  }};

// create/update an indexer
client.createIndexer(schema, function(err, schema){
	// optional error, or the schema object back from the service
});

// update an indexer
client.updateIndexer('myindexer', schema, function(err){
  // optional error
});

// get an indexer
client.getIndexer('myindexer', function(err, schema){
	// optional error, or the schema object back from the service
});

// list the indexers
client.listIndexers(function(err, schemas){
	// optional error, or the list of schemas from the service
});

// get the status for an indexer
client.getIndexerStatus('myindexer', function(err, status){
	// optional error, or the indexer status object
});

// delete an indexer
client.deleteIndexer('myindexer', function(err){
	// optional error
});

// run an indexer
client.runIndexer('myindexer', function(err){
	// optional error
});

// reset an indexer
client.resetIndexer('myindexer', function(err){
	// optional error
});
```

It is also possible to work with the (currently in preview) synonym maps:

```js
var client = require('azure-search')({
  url: 'https://xxx.search.windows.net',
  key: 'your key goes here',
  // Mandatory in order to enable preview support of synonyms
  version: '2016-09-01-Preview'
})

var schema = {
  name: 'mysynonmap',
  // only the 'solr' format is supported for now
  format: 'solr',
  synonyms: 'a=>b\nb=>c',
}

client.createSynonymMap(schema, function(err, data) {
  // optional error or the created map data
});

client.updateOrCreateSynonymMap('mysynonmap', schema, function(err, data) {
  // optional error or
  // when updating - data is empty
  // when creating - data would contain the created map
});

client.getSynonymMap('mysynonmap', function(err, data) {
  // optional error or the synonym map data
});

client.listSynonymMaps(function (err, maps) {
  // optional error or the list of maps defined under the account
})

client.deleteSynonymMap('mysynonmap', function (err) {
  // optional error
});
```

### Accessing the Raw Response

The raw response body is always returned as the 3rd argument in the callback.

i.e.

```js
// search the index
client.search('myindex', {search: "document", top: 10}, function(err, results, raw){
	// raw argument contains response body as described here:
	// https://msdn.microsoft.com/en-gb/library/azure/dn798927.aspx
});

```

### Using Promises

To use promises, invoke `azureSearch` as a function instead of a constructor.

i.e.

```js
var azureSearch = require('azure-search');
azureSearch({
    url: "https://XXX.search.windows.net",
    key: "YYY"
})
    .then(client => client.listIndexes())
    .then(console.log, console.error)
```

*If you need access to the raw response body, use [callback syntax](#accessing-the-raw-response) instead.*

## Contributing

Contributions are very welcome.

To download the dependencies:

```
> npm install
```

To build the minified JavaScript:

```
> npm run build
```

To run the tests:

```
> npm run test
```

Please note that you will have to update your `clientConfiguration` and `storageConnectionString` variables in order to run the tests.

## License

MIT
