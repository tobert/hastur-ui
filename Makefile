all: hastur-ui.js

clean: Makefile
	@rm -f lib/$@

hastur-ui.js: clean
	cat src/start.js src/namespace.js src/hastur.js src/hastur/*.js src/end.js > lib/$@
	@chmod 0644 lib/$@

syntax: hastur-ui.js
	node lib/hastur-ui.js

test: syntax
	node test/node-test-syntax.js
