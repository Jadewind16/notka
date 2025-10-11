# common make vars and targets:
export LINTER = flake8
export PYLINTFLAGS = --exclude=__main__.py

PYTHONFILES = $(shell ls *.py 2>/dev/null)
PYTESTFLAGS = -vv --verbose --cov-branch --cov-report term-missing --tb=short -W ignore::FutureWarning

FORCE:

tests: lint pytests

lint: $(patsubst %.py,%.pylint,$(PYTHONFILES))

%.pylint:
	$(LINTER) $(PYLINTFLAGS) $*.py

pytests: FORCE
	pytest $(PYTESTFLAGS) --cov=$(PKG)

# test a python file:
%.py: FORCE
	$(LINTER) $(PYLINTFLAGS) $@
	pytest $(PYTESTFLAGS) tests/test_$*.py

nocrud:
	-rm *~
	-rm *.log
	-rm *.out
	-rm .*swp
	-rm $(TESTDIR)/*~
