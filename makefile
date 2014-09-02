all: clean lint test build
 
clean:
	rm -f *.min.js

lint: 
	jshint --config jshintconfig.json $(filter-out $(wildcard *.min.js), $(wildcard *.js))
 
test:
	mocha
 
build: clean
	browserify azure-search.js | uglifyjs > azure-search.min.js

setup:
	npm install jshint mocha uglifyjs browserify -g
