import pytest
from fastapi.testclient import TestClient
from clerkk_backend.main import app


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Database session fixture for tests"""
    # TODO: Setup test database
    pass
