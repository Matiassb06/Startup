import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Cargar variables de entorno desde .env
load_dotenv()

# CONFIGURACIÓN DE LA CONEXIÓN (ahora desde .env)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost/traintohire")

# JWT settings (accesibles desde cualquier módulo)
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))

# Motor de la base de datos
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependency para obtener la DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()