from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# CONFIGURACIÓN DE LA CONEXIÓN
# Estructura: postgresql://usuario:contraseña@servidor:puerto/nombre_db

# IMPORTANTE: Cambia 'admin' por tu contraseña real si pusiste otra.
# Si tu contraseña es 1234, pon: postgres:1234
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:1234@localhost/traintohire"
# Creamos el motor (El coche)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Creamos la sesión (El conductor)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La base para tus modelos
Base = declarative_base()

# Función para obtener la DB (La llave)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()