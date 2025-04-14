FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /code/requirements.txt

COPY ./app /code/app
COPY ./models_trained /code/models_trained

ARG PORT=8001
ENV PORT=${PORT}

EXPOSE $PORT

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload"]
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]


