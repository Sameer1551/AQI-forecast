.PHONY: setup lint test train serve docker-build

setup:
	python -m venv venv && . venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt

lint:
	ruff check src tests && black --check src tests && mypy src

test:
	pytest tests/ -v --cov=src --cov-report=term-missing

train:
	python -m src.models.core.train

serve:
	uvicorn src.serving.app:app --reload --port 8000

docker-build:
	docker build -t aqi-forecast:latest .
