# Common make vars and targets for Notka project
# Following Software Engineering class standards

# Python linting configuration
export LINTER = flake8
export PYLINTFLAGS = --exclude=__main__.py --max-line-length=100

# Python files and test configuration
PYTHONFILES = $(shell ls *.py 2>/dev/null)
PYTESTFLAGS = -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning

# Force target for always-run rules
FORCE:

# Main test target: lint then run tests
tests: lint pytests

# Lint all Python files
lint: $(patsubst %.py,%.pylint,$(PYTHONFILES))

# Lint individual Python file
%.pylint:
	$(LINTER) $(PYLINTFLAGS) $*.py

# Run pytest with coverage
pytests: FORCE
	. venv/bin/activate && export PYTHONPATH=$$(pwd) && pytest $(PYTESTFLAGS) --cov=$(PKG)

# Test individual Python file
%.py: FORCE
	$(LINTER) $(PYLINTFLAGS) $@
	pytest $(PYTESTFLAGS) tests/test_$*.py

# Clean up temporary files
nocrud:
	-rm *~
	-rm *.log
	-rm *.out
	-rm .*swp
	-rm *.pyc
	-rm -rf __pycache__
	-rm -rf .pytest_cache
	-rm -rf htmlcov
	-rm .coverage
