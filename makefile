include common.mk

# Our directories
BACKEND_DIR = backend
FRONTEND_DIR = frontend
REQ_DIR = .

FORCE:

prod: all_tests github

github: FORCE
	- git commit -a
	git push origin main

all_tests: FORCE
	cd $(BACKEND_DIR); make tests

dev_env: FORCE
	cd $(BACKEND_DIR); python -m venv venv
	cd $(BACKEND_DIR); . venv/bin/activate && pip install -r requirements-dev.txt
	cd $(FRONTEND_DIR); npm install
	@echo "Backend venv created at: backend/venv"
	@echo "You should set PYTHONPATH to: "
	@echo $(shell pwd)

run_backend: FORCE
	cd $(BACKEND_DIR); . venv/bin/activate && python run.py

run_frontend: FORCE
	cd $(FRONTEND_DIR); npm run dev

clean: FORCE
	cd $(BACKEND_DIR); make clean
	cd $(FRONTEND_DIR); make clean
