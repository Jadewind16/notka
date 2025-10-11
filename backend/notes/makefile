PKG = notes

# Use backend venv
export LINTER = ../venv/bin/flake8
export PYLINTFLAGS = --exclude=__main__.py

PYTHONFILES = $(shell ls *.py 2>/dev/null)
PYTESTFLAGS = -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning

FORCE:

tests: lint pytests

lint: $(patsubst %.py,%.pylint,$(PYTHONFILES))

%.pylint:
	$(LINTER) $(PYLINTFLAGS) $*.py

pytests: FORCE
	cd .. && . venv/bin/activate && export PYTHONPATH=/home/jadewind/notka/backend && pytest $(PYTESTFLAGS) --cov=$(PKG)
