FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt* ./

RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

RUN pip install flask gunicorn

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
