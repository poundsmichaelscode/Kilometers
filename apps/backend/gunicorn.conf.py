import os

bind = "0.0.0.0:8000"

workers = int(
    os.getenv("GUNICORN_WORKERS", "2")
)

threads = int(
    os.getenv("GUNICORN_THREADS", "2")
)

worker_class = "gthread"

timeout = 60
graceful_timeout = 30
keepalive = 5

max_requests = 1000
max_requests_jitter = 100

accesslog = "-"
errorlog = "-"
loglevel = "info"

capture_output = True
worker_tmp_dir = "/dev/shm"

preload_app = False
