PKG = notes
PYTHON = python3

# Use backend venv
export LINTER = ../venv/bin/flake8
export PYLINTFLAGS = --exclude=__main__.py

PYTHONFILES = $(shell ls *.py 2>/dev/null)
PYTESTFLAGS = -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning

BACKEND_DIR = $(shell cd .. && pwd)

FORCE:

tests: lint pytests

lint: $(patsubst %.py,%.pylint,$(PYTHONFILES))

%.pylint:
	$(LINTER) $(PYLINTFLAGS) $*.py

pytests: FORCE
	cd .. && . venv/bin/activate && export PYTHONPATH=$(BACKEND_DIR) && pytest $(PYTESTFLAGS) --cov=$(PKG)
