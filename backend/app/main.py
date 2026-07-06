from fastapi import FastAPI

app = FastAPI(title="AI Travel Rewards Agent")


@app.get("/health")
def health():
    return {"status": "ok"}
