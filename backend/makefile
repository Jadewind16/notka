# Backend makefile - follows SE class pattern
PKG = app
include ../common.mk

# Python executable
PYTHON = python3

# Override to use venv linter
export LINTER = ./venv/bin/flake8

FORCE:

run: FORCE
	. venv/bin/activate && export PYTHONPATH=$(shell pwd) && $(PYTHON) run.py

install: FORCE
	$(PYTHON) -m venv venv
	. venv/bin/activate && pip install -r requirements-dev.txt
	@echo "export PYTHONPATH=$(shell pwd)" >> venv/bin/activate
	@echo ""
	@echo "✅ Virtual environment created with PYTHONPATH set!"

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
