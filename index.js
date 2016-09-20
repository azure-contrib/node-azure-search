var http = require('https')
var url = require('url')

module.exports = function (options) {
  if (!options) throw new Error('please supply the options object')
  if (!options.url) throw new Error('please supply the url of the search service')
  if (!options.key) throw new Error('please supply the key of the search service')
  if (!options.version) options.version = '2015-02-28-Preview'

  var get = function (path, overrides, callback) {
    execute(path, 'GET', null, overrides, callback)
  }
  var post = function (path, body, callback) {
    execute(path, 'POST', body, null, callback)
  }
  var put = function (path, body, callback) {
    execute(path, 'PUT', body, null, callback)
  }
  var del = function (path, callback) {
    execute(path, 'DELETE', null, null, callback)
  }

  var execute = function (path, method, body, overrides, cb) {
    path.push({'api-version': options.version})

    var payload = ''
    if (body) {
      payload = JSON.stringify(body)
    }

    var headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'api-key': options.key,
      'Accept': 'application/json',
      'Accept-Charset': 'UTF-8',
      'Content-Length': Buffer.byteLength(payload) // fix
    }

    if (overrides) {
      for (var x in overrides) {
        headers[x] = overrides[x]
      }
    }

    var req = http.request({
      host: url.parse(options.url).hostname,
      path: '/' + arrayToPath(path),
      port: 443,
      method: method,
      withCredentials: false,
      headers: headers
    }, function (res) {
      var result = ''
      if (res.setEncoding) res.setEncoding('utf8')
      res.on('data', function (chunk) {
        result += chunk
      })
      res.on('end', function () {
        if (!cb) return

        // Bail out if no result
        if (!result) {
          if (res.statusCode < 200 || res.statusCode > 206) {
            return cb({ code: res.statusCode }, null, res) // Fail
          } else {
            return cb(null, null, res) // Success with no body
          }
        }

        // Parse result
        try {
          if (overrides && overrides.Accept === 'text/plain') {
            // do nothing
          } else {
            result = JSON.parse(result)
          }
        } catch (err) {
          return cb('failed to parse JSON:\n' + err + '\n ' + result, null, res)
        }

        // Check for Azure error
        var error = result.error
        if (error) {
          error.code = error.code || res.statusCode // This is currently not populated by azure
          cb(error, null, res)
        } else {
          cb(null, result, res)
        }
        return
      })

      res.on('error', function (err) {
        if (cb) {
          cb(err, null, res)
          cb = undefined
          return
        }
      })
    })
    try {
      if (payload) {
        req.write(payload)
      }
      req.end()
      req.on('error', function (err) {
        if (cb) {
          cb(err, null, req)
          cb = undefined
          return
        }
      })
    } catch (err) {
      if (cb) {
        cb(err)
        cb = undefined
        return
      }
    }
  }

  return {
    listIndexes: function (cb) {
      get(['indexes'], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    createIndex: function (schema, cb) {
      if (!schema) throw new Error('schema is not defined')
      post(['indexes'], schema, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    getIndex: function (indexName, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      get(['indexes', indexName], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    getIndexStats: function (indexName, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      get(['indexes', indexName, 'stats'], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    deleteIndex: function (indexName, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      del(['indexes', indexName], function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    listIndexers: function (cb) {
      get(['indexers'], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    createIndexer: function (schema, cb) {
      if (!schema) throw new Error('schema is not defined')
      post(['indexers'], schema, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    updateIndexer: function (indexerName, schema, cb) {
      if (!indexerName) throw new Error('indexName is not defined')
      if (!schema) throw new Error('schema is not defined')
      put(['indexers', indexerName], schema, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    getIndexer: function (indexerName, cb) {
      if (!indexerName) throw new Error('indexName is not defined')
      get(['indexers', indexerName], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    getIndexerStatus: function (indexerName, cb) {
      if (!indexerName) throw new Error('indexerName is not defined')
      get(['indexers', indexerName, 'status'], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    deleteIndexer: function (indexerName, cb) {
      if (!indexerName) throw new Error('indexerName is not defined')
      del(['indexers', indexerName], function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    runIndexer: function (indexerName, cb) {
      if (!indexerName) throw new Error('indexerName is not defined')
      post(['indexers', indexerName, 'run'], function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },
    resetIndexer: function (indexerName, cb) {
      if (!indexerName) throw new Error('indexerName is not defined')
      post(['indexers', indexerName, 'reset'], function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    createDataSource: function (options, cb) {
      if (!options) throw new Error('options is not defined')
      post(['datasources'], options, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    updateDataSource: function (options, cb) {
      if (!options) throw new Error('options is not defined')
      if (!options.name) throw new Error('options.name is not defined')
      put(['datasources', options.name], options, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    deleteDataSource: function (dataSourceName, cb) {
      del(['datasources', dataSourceName], function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    addDocuments: function (indexName, documents, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!documents) throw new Error('documents is not defined')
      post(['indexes', indexName, 'docs', 'index'], {value: documents}, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    updateDocuments: function (indexName, documents, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!documents) throw new Error('documents is not defined')

      for (var i = 0; i < documents.length; i++) {
        documents[i]['@search.action'] = 'merge'
      }

      post(['indexes', indexName, 'docs', 'index'], {value: documents}, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    uploadDocuments: function (indexName, documents, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!documents) throw new Error('documents is not defined')

      for (var i = 0; i < documents.length; i++) {
        documents[i]['@search.action'] = 'upload'
      }

      post(['indexes', indexName, 'docs', 'index'], {value: documents}, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    deleteDocuments: function (indexName, keys, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!keys) throw new Error('keys is not defined')

      for (var i = 0; i < keys.length; i++) {
        keys[i]['@search.action'] = 'delete'
      }

      post(['indexes', indexName, 'docs', 'index'], {value: keys}, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data.value, data)
      })
    },
    search: function (indexName, query, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!query) throw new Error('query is not defined')

      post(['indexes', indexName, 'docs', 'search'], query, function (err, results) {
        if (err) return cb(err, null, results)
        if (results && results.error) return cb(results.error, null, results)
        cb(null, results.value, results)
      })
    },

    lookup: function (indexName, key, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!key) throw new Error('key is not defined')

      get(['indexes', indexName, "docs('" + key + "')"], null, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, data, data)
      })
    },

    count: function (indexName, cb) {
      if (!indexName) throw new Error('indexName is not defined')

      get(['indexes', indexName, 'docs', '$count'], {'Accept': 'text/plain'}, function (err, data) {
        if (err) return cb(err, null, data)
        cb(null, parseInt(data.trim()), data)
      })
    },

    suggest: function (indexName, query, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!query) throw new Error('query is not defined')

      get(['indexes', indexName, 'docs', 'suggest', query], null, function (err, results) {
        if (err) return cb(err, null, results)
        if (results && results.error) return cb(results.error, null, results)
        cb(null, results.value, results)
      })
    },
    updateIndex: function (indexName, schema, cb) {
      if (!indexName) throw new Error('indexName is not defined')
      if (!schema) throw new Error('schema is not defined')
      put(['indexes', indexName], schema, function (err, data) {
        if (err) return cb(err, null, data)
        if (data && data.error) return cb(data.error, null, data)
        cb(null, null, data)
      })
    }

  }
}

// converts this ["hello","world", {format:"json", facet: ["a", "b"]}] into this "hello/world?format=json&facet=a&facet=b"
function arrayToPath (array) {
  var path = array.filter(function (x) {
    return typeof x !== 'object'
  })
  var filter = array.filter(function (x) {
    return typeof x === 'object'
  })
  var qs = []
  filter.forEach(function (x) {
    for (var key in x) {
      if (x[key] instanceof Array) {
        x[key].forEach(function (y) {
          qs.push(key + '=' + encodeURIComponent(y))
        })
      } else {
        qs.push(key + '=' + encodeURIComponent(x[key]))
      }
    }
  })
  return path.join('/') + '?' + qs.join('&')
}
