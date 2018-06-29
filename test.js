/* globals describe, it */

// to test, first create a search service in azure, and set the url and key here.
var clientConfiguration = {
  url: process.env.URL || 'https://xxx.search.windows.net',
  key: process.env.KEY || 'your key goes here',
  // This API version is required for all tests to pass
  version: '2017-11-11-Preview'
}

// You would also need a storage account (fill in the connection string for that account below)
// Please, also create a container named 'azuresearchtest' in that account (can have private access, and be empty)
var storageConnectionString = process.env.CONNECTION_STRING || 'DefaultEndpointsProtocol=https;AccountName=aaa;AccountKey=bbb'

var clientFactory = require('./index')
var client = clientFactory(clientConfiguration)

describe('search service', function () {
  this.timeout(5000)
  it('creates an index', function (done) {
    var schema = {
      name: 'myindex',
      fields: [
        {
          name: 'id',
          type: 'Edm.String',
          searchable: false,
          filterable: true,
          retrievable: true,
          sortable: true,
          facetable: true,
          key: true
        },
        {
          name: 'description',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          sortable: false,
          facetable: false,
          key: false
        },
        {
          name: 'category',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          sortable: false,
          facetable: true,
          key: false,
          analyzer: 'phonetic_area_analyzer'
        }
      ],
      'analyzers': [
        {
          'name': 'phonetic_area_analyzer',
          '@odata.type': '#Microsoft.Azure.Search.CustomAnalyzer',
          'tokenizer': 'area_standard',
          'tokenFilters': ['lowercase', 'asciifolding', 'areas_phonetc']
        }
      ],
      'charFilters': [],
      'tokenizers': [
        {
          'name': 'area_standard',
          '@odata.type': '#Microsoft.Azure.Search.StandardTokenizerV2'
        },
        {
          'name': 'area_keyword',
          '@odata.type': '#Microsoft.Azure.Search.KeywordTokenizerV2'
        }
      ],
      'tokenFilters': [
        {
          'name': 'area_edge',
          '@odata.type': '#Microsoft.Azure.Search.EdgeNGramTokenFilterV2',
          'minGram': 2,
          'maxGram': 50
        },
        {
          'name': 'area_token_edge',
          '@odata.type': '#Microsoft.Azure.Search.EdgeNGramTokenFilterV2',
          'minGram': 2,
          'maxGram': 20
        },
        {
          'name': 'areas_phonetc',
          '@odata.type': '#Microsoft.Azure.Search.PhoneticTokenFilter',
          'encoder': 'doubleMetaphone'
        }
      ],
      suggesters: [
        {
          name: 'sg',
          searchMode: 'analyzingInfixMatching',
          sourceFields: ['description', 'id']
        }
      ],
      scoringProfiles: [],
      defaultScoringProfile: null,
      corsOptions: { allowedOrigins: ['*'] }
    }

    client.createIndex(schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (!data) return done('data is not defined')
      if (data.name !== 'myindex') return done('no index name')
      if (data.fields.length !== 3) return done('wrong number of fields')
      return done()
    })
  })

  it('get index stats', function (done) {
    client.getIndexStats('myindex', function (err, index) {
      if (err) return done('error returned')
      if (!index) return done('index is null')
      if (index.documentCount !== 0) return done('wrong document size')
      return done()
    })
  })

  it('runs test analyzer', function (done) {
    var data = {
      'text': 'Text to analyze',
      'analyzer': 'standard'
    }
    client.testAnalyzer('myindex', data, function (err, tokens) {
      if (err) return done('error returned')
      if (!tokens) return done('tokens is null')
      if (tokens.length === 0) return done('no tokens returned')
      return done()
    })
  })

  it('indexes a document', function (done) {
    var doc1 = {
      'id': 'document1',
      'description': 'this is the description of my unique document',
      'category': 'mycategory'
    }
    client.addDocuments('myindex', [doc1], function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('data is null')
      return done()
    })
  })

  it('deletes a document', function (done) {
    var doc2 = {
      'id': 'document2',
      'description': 'this is the description of my document'
    }

    client.addDocuments('myindex', [doc2], function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('data is null')

      var key = { 'id': 'document2' }

      client.deleteDocuments('myindex', [key], function (err, data) {
        if (err) return done('error returned')
        if (!data) return done('data is null')
        return done()
      })
    })
  })

  it('updates a document', function (done) {
    var doc3 = {
      'id': 'document3',
      'description': 'this is the description of my document'
    }

    client.addDocuments('myindex', [doc3], function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('data is null')
      // update description field
      doc3.description = 'updated description'

      client.updateDocuments('myindex', [doc3], function (err, data) {
        if (err) return done('error returned')
        if (!data) return done('data is null')

        // ensure changes were saved
        client.lookup('myindex', 'document3', function (err, results) {
          if (err) return done('error returned')
          if (!results) return done('results is null')
          if (results.description !== doc3.description) return done('document not updated')
          return done()
        })
      })
    })
  })

  it('updates or uploads a document', function (done) {
    var doc5 = {
      'id': 'document5',
      'description': 'this is the description of my document'
    }

    client.updateOrUploadDocuments('myindex', [doc5], function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('data is null')
      // update description field
      doc5.description = 'updated description'

      client.updateOrUploadDocuments('myindex', [doc5], function (err, data) {
        if (err) return done('error returned')
        if (!data) return done('data is null')

        // ensure changes were saved
        client.lookup('myindex', 'document5', function (err, results) {
          if (err) return done('error returned')
          if (!results) return done('results is null')
          if (results.description !== doc5.description) return done('document not updated')
          return done()
        })
      })
    })
  })

  it('updates a document', function (done) {
    var doc3 = {
      'id': 'document3',
      'description': 'this is the description of my document'
    }

    client.addDocuments('myindex', [doc3], function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('data is null')
      // update description field
      doc3.description = 'updated description'

      client.updateDocuments('myindex', [doc3], function (err, data) {
        if (err) return done('error returned')
        if (!data) return done('data is null')

        // ensure changes were saved
        client.lookup('myindex', 'document3', function (err, results) {
          if (err) return done('error returned')
          if (!results) return done('results is null')
          if (results.description !== doc3.description) return done('document not updated')
          return done()
        })
      })
    })
  })

  it('lists the indexes', function (done) {
    client.listIndexes(function (err, indexes) {
      if (err) return done('error returned', err)
      if (!Array.isArray(indexes)) return done('indexes is not an array')
      var found = false
      for (var idx = 0; idx < indexes.length && !found; idx++) {
        if (indexes[idx].name === 'myindex') {
          found = true
        }
      }
      if (!found) {
        return done('Expected index "myindex" was not found')
      }
      return done()
    })
  })

  it('get an index', function (done) {
    client.getIndex('myindex', function (err, index) {
      if (err) return done('error returned', err)
      if (!index) return done('index is null')
      if (index.name !== 'myindex') return done('index has the wrong name')
      return done()
    })
  })

  it('searches with no result', function (done) {
    client.search('myindex', { search: '1234' }, function (err, results) {
      if (err) return done('error returned')
      if (!results) return done('results is null')
      if (!Array.isArray(results)) return done('results is not an array')
      if (results.length !== 0) return done('results is not the right length')
      return done()
    })
  })

  it('looks up a document', function (done) {
    client.lookup('myindex', 'document1', function (err, results) {
      if (err) return done('error returned')
      if (!results) return done('results is null')
      if (results.id !== 'document1') return done('wrong results')
      return done()
    })
  })

  it('counts documents in an index', function (done) {
    client.count('myindex', function (err, count) {
      if (err) return done('error returned')
      // if (count !== 1) return done('wrong results')
      return done()
    })
  })

  it('suggestions', function (done) {
    client.suggest('myindex', { search: 'doc', suggesterName: 'sg' }, function (err, results) {
      if (err) return done('error returned')
      if (!results) return done('results is null')
      if (!Array.isArray(results)) return done('results is not an array')
      return done()
    })
  })

  it('searches', function (done) {
    client.search('myindex', { search: 'unique' }, function (err, results) {
      if (err) return done('error returned')
      if (!results) return done('results is null')
      if (!Array.isArray(results)) return done('results is not an array')
      if (results.length !== 1) return done('results is not the right length')
      if (results[0].id !== 'document1') return done('doc 1 is not returned')
      return done()
    })
  })

  it('updates an index', function (done) {
    var schema = {
      name: 'myindex',
      fields: [
        {
          name: 'id',
          type: 'Edm.String',
          searchable: false,
          filterable: true,
          retrievable: true,
          sortable: true,
          facetable: true,
          key: true
        },
        {
          name: 'description',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          sortable: false,
          facetable: false,
          key: false
        },
        {
          name: 'category',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          sortable: false,
          facetable: true,
          key: false,
          analyzer: 'phonetic_area_analyzer'
        },
        {
          name: 'foo',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          sortable: false,
          facetable: false,
          key: false
        }
      ],
      'analyzers': [
        {
          'name': 'phonetic_area_analyzer',
          '@odata.type': '#Microsoft.Azure.Search.CustomAnalyzer',
          'tokenizer': 'area_standard',
          'tokenFilters': ['lowercase', 'asciifolding', 'areas_phonetc']
        }
      ],
      'charFilters': [],
      'tokenizers': [
        {
          'name': 'area_standard',
          '@odata.type': '#Microsoft.Azure.Search.StandardTokenizerV2'
        },
        {
          'name': 'area_keyword',
          '@odata.type': '#Microsoft.Azure.Search.KeywordTokenizerV2'
        }
      ],
      'tokenFilters': [
        {
          'name': 'area_edge',
          '@odata.type': '#Microsoft.Azure.Search.EdgeNGramTokenFilterV2',
          'minGram': 2,
          'maxGram': 50
        },
        {
          'name': 'area_token_edge',
          '@odata.type': '#Microsoft.Azure.Search.EdgeNGramTokenFilterV2',
          'minGram': 2,
          'maxGram': 20
        },
        {
          'name': 'areas_phonetc',
          '@odata.type': '#Microsoft.Azure.Search.PhoneticTokenFilter',
          'encoder': 'doubleMetaphone'
        }
      ],
      suggesters: [
        {
          name: 'sg',
          searchMode: 'analyzingInfixMatching',
          sourceFields: ['description', 'id']
        }
      ],
      scoringProfiles: [],
      defaultScoringProfile: null,
      corsOptions: { allowedOrigins: ['*'] }
    }

    client.updateIndex('myindex', schema, function (err) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('creates a blob data source', function (done) {
    var options = {
      name: 'blob-datasource',
      type: 'azureblob',
      credentials: { connectionString: storageConnectionString },
      container: { name: 'azuresearchtest', query: '' }
    }
    client.createDataSource(options, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('gets data source', function (done) {
    client.getDataSource('blob-datasource', function (err, data) {
      if (err) return done('error returned')
      if (!data) return done('datasource is null')
      return done()
    })
  })

  it('updates a blob data source', function (done) {
    var options = {
      name: 'blob-datasource',
      type: 'azureblob',
      credentials: { connectionString: storageConnectionString },
      container: { name: 'azuresearchtest', query: '' }
    }
    client.updateDataSource(options, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('creates a table data source', function (done) {
    var options = {
      name: 'table-datasource',
      type: 'azuretable',
      credentials: { connectionString: storageConnectionString },
      container: { name: 'azuresearchtest', query: '' }
    }
    client.createDataSource(options, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('updates a table data source', function (done) {
    var options = {
      name: 'table-datasource',
      type: 'azuretable',
      credentials: { connectionString: storageConnectionString },
      container: { name: 'azuresearchtest', query: '' }
    }
    client.updateDataSource(options, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('creates an indexer', function (done) {
    var schema = {
      name: 'myindexer',
      description: 'Anything', // Optional. Anything you want, or null
      dataSourceName: 'blob-datasource', // Required. The name of an existing data source
      targetIndexName: 'myindex' // Required. The name of an existing index
    }

    client.createIndexer(schema, function (err) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('updates an indexer', function (done) {
    var schema = {
      name: 'myindexer',
      description: 'Anything Different', // Optional. Anything you want, or null
      dataSourceName: 'blob-datasource', // Required. The name of an existing data source
      targetIndexName: 'myindex', // Required. The name of an existing index
      schedule: { // Optional. All of the parameters below are required.
        interval: 'PT15M', // The pattern for this is: 'P[nD][T[nH][nM]]'. Examples:  PT15M for every 15 minutes, PT2H for every 2 hours.
        startTime: '2016-06-01T00:00:00Z' // A UTC datetime when the indexer should start running.
      }
    }

    client.updateIndexer('myindexer', schema, function (err) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('runs an indexer', function (done) {
    client.runIndexer('myindexer', function (err, indexer) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('resets an indexer', function (done) {
    client.resetIndexer('myindexer', function (err, indexer) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('deletes an indexer', function (done) {
    client.deleteIndexer('myindexer', function (err, indexer) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('deletes a blob data source', function (done) {
    client.deleteDataSource('blob-datasource', function (err, indexer) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('deletes a table data source', function (done) {
    client.deleteDataSource('table-datasource', function (err, indexer) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('deletes an index', function (done) {
    client.deleteIndex('myindex', function (err, index) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('creates a synonymmap', function (done) {
    var schema = {
      name: 'mysynonmap',
      format: 'solr',
      synonyms: 'a=>b\nb=>c'
    }

    client.createSynonymMap(schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (!data) return done('data is not defined')
      if (data.name !== 'mysynonmap') return done('wrong synonym map name')
      if (data.format !== 'solr') return done('wrong synonym map format')
      if (data.synonyms.split('\n').length !== 2) return done('wrong synonym rows')
      return done()
    })
  })

  it('updates a synonymmap', function (done) {
    var schema = {
      name: 'mysynonmap',
      format: 'solr',
      synonyms: 'd=>e\ng=>h\nz=>x'
    }

    client.updateOrCreateSynonymMap('mysynonmap', schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('gets a synonymmap', function (done) {
    client.getSynonymMap('mysynonmap', function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (!data) return done('data is not defined')
      if (data.name !== 'mysynonmap') return done('wrong synonym map name')
      if (data.format !== 'solr') return done('wrong synonym map format')
      if (data.synonyms.split('\n').length !== 3) return done('wrong synonym rows')
      return done()
    })
  })

  it('lists synonymmaps', function (done) {
    client.listSynonymMaps(function (err, maps) {
      if (err) return done('error returned', err)
      if (!Array.isArray(maps)) return done('indexes is not an array')
      var found = false
      for (var idx = 0; idx < maps.length && !found; idx++) {
        if (maps[idx].name === 'mysynonmap') {
          found = true
        }
      }
      if (!found) {
        return done('Expected synonym map "mysynonmap" was not found')
      }
      return done()
    })
  })

  it('deletes a synonymmap', function (done) {
    client.deleteSynonymMap('mysynonmap', function (err) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('creates while updating a non existant synonymmap', function (done) {
    var schema = {
      name: 'mysynonmap2',
      format: 'solr',
      synonyms: 'd=>e\ng=>h\nz=>x'
    }

    client.updateOrCreateSynonymMap(schema.name, schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (!data) return done('data is not defined')
      if (data.name !== schema.name) return done('wrong synonym map name')
      if (data.format !== 'solr') return done('wrong synonym map format')
      if (data.synonyms.split('\n').length !== 3) return done('wrong synonym rows')
      return done()
    })
  })

  it('deletes a synonymmap - again', function (done) {
    client.deleteSynonymMap('mysynonmap2', function (err, index) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('creates a skillset', function (done) {
    var schema = {
      name: 'myskillset',
      description: 'My skillset',
      skills: [{
        '@odata.type': '#Microsoft.Skills.Text.SentimentSkill',
        inputs: [{
          name: 'text',
          source: '/document/content'
        }],
        outputs: [{
          name: 'score',
          targetName: 'myScore'
        }]
      }]
    }

    client.createSkillset(schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (!data) return done('data is not defined')
      if (data.name !== 'myskillset') return done('wrong skillset name')
      if (data.description !== 'My skillset') return done('wrong skillset description')
      if (data.skills.length !== 1) return done('wrong number of skills')
      return done()
    })
  })

  it('updates a skillset', function (done) {
    var schema = {
      name: 'myskillset',
      description: 'My updated skillset',
      skills: [{
        '@odata.type': '#Microsoft.Skills.Text.SentimentSkill',
        inputs: [{
          name: 'text',
          source: '/document/content'
        }],
        outputs: [{
          name: 'score',
          targetName: 'myScore'
        }]
      }]
    }

    client.updateOrCreateSkillset('myskillset', schema, function (err, data) {
      if (err) return done('error returned ' + err.message)
      return done()
    })
  })

  it('gets a skillset', function (done) {
    client.getSkillset('myskillset', function (err, data) {
      if (err) return done('error returned ' + err.message)
      if (data.name !== 'myskillset') return done('wrong skillset name')
      if (data.description !== 'My updated skillset') return done('wrong skillset description')
      if (data.skills.length !== 1) return done('wrong number of skills')
      return done()
    })
  })

  it('lists skillsets', function (done) {
    client.listSkillsets(function (err, skillsets) {
      if (err) return done('error returned', err)
      if (!Array.isArray(skillsets)) return done('indexes is not an array')
      var found = false
      for (var idx = 0; idx < skillsets.length && !found; idx++) {
        if (skillsets[idx].name === 'myskillset') {
          found = true
        }
      }
      if (!found) {
        return done('Expected skillset "myskillset" was not found')
      }
      return done()
    })
  })

  it('deletes a skillset', function (done) {
    client.deleteSkillset('myskillset', function (err) {
      if (err) return done('error returned', err)
      return done()
    })
  })

  it('handles azure errors', function (done) {
    client.getSynonymMap('nonexistant', function (err, data) {
      if (!err) return done('expected error is missing')
      if (err && !err.code) return done('error code not provided')
      if (err && !err.message) return done('error message not provided')
      return done()
    })
  })

  it('handles http errors', function (done) {
    var badClientConfiguration = {
      url: 'https://no.no.no.nothing.here.zz',
      key: clientConfiguration.key
    }
    var badClient = clientFactory(badClientConfiguration)
    badClient.getSynonymMap('nonexistant', function (err, data) {
      if (!err) return done('expected error is missing')
      if (err && !err.code) return done('error code not provided')
      if (err && !err.message) return done('error message not provided')
      return done()
    })
  })

  it('handles plain text errors', function (done) {
    client.count('nosuchindex', function (err, count) {
      if (!err) return done('expected error is missing')
      return done()
    })
  })

  // This is an edge case
  // happens when accessing an API endppoint from an API version which is too old
  it('handles error status codes with a response body', function (done) {
    var oldClientConfiguration = {
      url: clientConfiguration.url,
      key: clientConfiguration.key,
      version: '2016-09-01'
    }
    var oldClient = clientFactory(oldClientConfiguration)
    oldClient.getSynonymMap('mysynonmap', function (err, data) {
      if (!err) return done('expected error is missing')
      if (err && !err.code) return done('error code not provided')
      return done()
    })
  })
})
