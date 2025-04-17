from contextlib import AsyncExitStack


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware



from src.pickl_fastapi import lifespan_mechanism, sub_application_pickl_test


async def main_lifespan(app: FastAPI):
    async with AsyncExitStack() as stack:
        # Manage the lifecycle of sub_app
        await stack.enter_async_context(
            lifespan_mechanism(sub_application_pickl_test)
        )
        yield


app = FastAPI(lifespan=main_lifespan)

origins = [
    "http://localhost:5173",  # React dev server
    "https://www.neurobeacon.net/",  # Prod URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/mod", sub_application_pickl_test)


# /docs endpoint is defined by FastAPI automatically
# /openapi.json returns a json object automatically by FastAPI
