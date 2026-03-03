from contextlib import contextmanager, AbstractContextManager
from typing import Callable
from sqlalchemy import create_engine, orm
from sqlalchemy.orm import Session, declarative_base

Base = declarative_base()


class Database:
    def __init__(self, database_url: str) -> None:
        self._engine = create_engine(
            database_url,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=3600,  # Recycle connections after 1 hour
            connect_args={
                "connect_timeout": 5,  # 5 second connection timeout
                "options": "-c statement_timeout=30000",  # 30 second query timeout
            },
        )
        self._session_factory = orm.scoped_session(
            orm.sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine,
            ),
        )

    def create_database(self) -> None:
        Base.metadata.create_all(self._engine)

    @contextmanager
    def session(self) -> Callable[..., AbstractContextManager[Session]]:
        session: Session = self._session_factory()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @property
    def engine(self):
        return self._engine
