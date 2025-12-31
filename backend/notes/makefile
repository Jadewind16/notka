# Notes module makefile - follows SE class pattern
PKG = notes

# Use backend venv
export LINTER = ../venv/bin/flake8

BACKEND_DIR = $(shell cd .. && pwd)

FORCE:

tests: lint pytests

lint:
	@echo "Linting notes module..."
	$(LINTER) $(PYLINTFLAGS) *.py

pytests: FORCE
	cd .. && . venv/bin/activate && export PYTHONPATH=$(BACKEND_DIR) && pytest -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning --cov=$(PKG)
