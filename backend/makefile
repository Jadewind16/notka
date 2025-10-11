PKG = app

# Override to use venv
export LINTER = ./venv/bin/flake8
export PYLINTFLAGS = --exclude=__main__.py

PYTHONFILES = $(shell ls *.py 2>/dev/null)
PYTESTFLAGS = -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning

FORCE:

tests: lint pytests

lint: $(patsubst %.py,%.pylint,$(PYTHONFILES))

%.pylint:
	$(LINTER) $(PYLINTFLAGS) $*.py

pytests: FORCE
	. venv/bin/activate && pytest $(PYTESTFLAGS) --cov=$(PKG)

run: FORCE
	. venv/bin/activate && python run.py

install: FORCE
	python -m venv venv
	. venv/bin/activate && pip install -r requirements-dev.txt

clean: FORCE
	-rm -rf __pycache__
	-rm -rf app/__pycache__
	-rm -rf app/*/__pycache__
	-rm -rf tests/__pycache__
	-rm -rf notes/__pycache__
	-rm -rf notes/tests/__pycache__
	-rm -rf .pytest_cache
	-rm -rf .coverage
	-rm *~
	-rm *.log
	-rm *.out
	-rm .*swp
