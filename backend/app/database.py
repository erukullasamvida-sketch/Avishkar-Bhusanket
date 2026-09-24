from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///./landslideguard.db"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

    with engine.begin() as connection:
        columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(fieldreport)")
        }
        if "severity" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE fieldreport ADD COLUMN severity VARCHAR NOT NULL DEFAULT 'moderate'"
            )


def get_session():
    with Session(engine) as session:
        yield session