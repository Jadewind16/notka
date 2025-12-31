# Frontend makefile - follows SE class pattern

FORCE:

# Install dependencies
install: FORCE
	npm install

# Run development server
dev: FORCE
	npm run dev

# Build for production
build: FORCE
	npm run build

# Run tests
tests: FORCE
	npm test

# Lint frontend code
lint: FORCE
	npm run lint

# Clean temporary files (SE class pattern)
nocrud: FORCE
	-rm *~
	-rm *.log
	-rm *.out
	-rm .*swp

# Clean build artifacts
clean: nocrud
	-rm -rf node_modules/.cache
	-rm -rf dist
