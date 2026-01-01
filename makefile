include common.mk

# Project directories (SE class pattern)
BACKEND_DIR = backend
FRONTEND_DIR = frontend
NOTES_DIR = backend/notes
REQ_DIR = .

# Python executable
PYTHON = python3

FORCE:

# Production deployment: run all tests, then push to GitHub
prod: all_tests github

# Push to GitHub (SE class pattern)
github: FORCE
	- git commit -a
	git push origin main

# Run all tests across all modules (SE class pattern)
all_tests: FORCE
	@echo "🧪 Running all tests..."
	cd $(BACKEND_DIR); make tests
	@echo "✅ All tests passed!"
	@echo ""
	@echo "🧹 Cleaning up test data..."
	@./clean_test_data.sh
	@echo "✅ Test cleanup complete!"

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

# Clean test data (test database + test files)
clean_tests: FORCE
	@echo "🧹 Cleaning test data..."
	@./clean_test_data.sh
