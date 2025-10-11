include common.mk

# Our directories
BACKEND_DIR = backend
FRONTEND_DIR = frontend
REQ_DIR = .

# Python executable
PYTHON = python3

FORCE:

prod: all_tests github

github: FORCE
	- git commit -a
	git push origin main

all_tests: FORCE
	cd $(BACKEND_DIR); make tests

dev_env: FORCE
	@echo "Setting up development environment..."
	cd $(BACKEND_DIR); $(PYTHON) -m venv venv
	cd $(BACKEND_DIR); . venv/bin/activate && pip install -r requirements-dev.txt
	cd $(FRONTEND_DIR); npm install
	@echo ""
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "Backend venv created at: backend/venv"
	@echo ""
	@echo "To activate backend venv, run:"
	@echo "  cd backend && source venv/bin/activate"
	@echo ""
	@echo "Or use the aliases:"
	@echo "  notkabackend  - cd to backend and activate venv"
	@echo "  notkarun      - run backend server"
	@echo "  notkadev      - run frontend dev server"
	@echo ""
	@echo "Set PYTHONPATH for testing:"
	@echo "  export PYTHONPATH=$(shell pwd)/backend"

run_backend: FORCE
	cd $(BACKEND_DIR); . venv/bin/activate && $(PYTHON) run.py

run_frontend: FORCE
	cd $(FRONTEND_DIR); npm run dev

clean: FORCE
	cd $(BACKEND_DIR); make clean
	cd $(FRONTEND_DIR); make clean
