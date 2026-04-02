# Guía de Desarrollo Backend - LogiCapture 1.0

Esta guía detalla los estándares y procedimientos para extender las capacidades del API de LogiCapture (FastAPI).

---

## Estructura de la Aplicación

El backend se organiza siguiendo una arquitectura modular por capas:

- **`models/`**: Definiciones de tablas de SQLAlchemy (Capa de Datos).
- **`schemas/`**: Modelos de Pydantic para validación y serialización (DTOs).
- **`routers/`**: Definición de endpoints y controladores (Capa de Entrada).
- **`services/`**: Lógica de negocio compleja, integración con OCR y generación de reportes.
- **`core/`**: Configuraciones globales (`settings`), seguridad y JWT.
- **`utils/`**: Funciones auxiliares genéricas (limpieza de datos, logging).

---

## Flujo para Agregar una Nueva Funcionalidad

Para mantener la consistencia, siga estos pasos al añadir una nueva entidad o módulo:

### 1. Definir el Modelo (`models/`)
Cree la clase heredando de `Base` en el archivo correspondiente. Utilice `Mapped` y `mapped_column` para seguir el estándar de SQLAlchemy 2.0 cuando sea posible.

```python
class NuevaEntidad(Base):
    __tablename__ = "nueva_entidad"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
```

### 2. Crear Schemas (`schemas/`)
Defina los modelos de Pydantic para la entrada (`Create`) y salida (`Response`).

```python
class EntidadCreate(BaseModel):
    nombre: str

class EntidadResponse(EntidadCreate):
    id: int
    class Config:
        from_attributes = True
```

### 3. Implementar el Router (`routers/`)
Cree el router, asigne un prefijo y defina los endpoints inyectando la sesión de base de datos.

```python
router = APIRouter(prefix="/api/v1/entidad", tags=["Entidad"])

@router.get("/", response_model=List[EntidadResponse])
def get_entidades(db: Session = Depends(get_db)):
    return db.query(NuevaEntidad).all()
```

### 4. Registrar en `main.py`
No olvide incluir el nuevo router en la aplicación principal para que sea accesible.

---

## Estándares Técnicos

### Inyección de Dependencias
Utilice `Depends(get_db)` para gestionar las sesiones de base de datos. Esto asegura que la conexión se cierre correctamente después de cada petición.

### Manejo de Errores
Lance excepciones de FastAPI para retornar códigos de estado HTTP correctos:
```python
raise HTTPException(status_code=404, detail="Recurso no encontrado")
```

### Validaciones de Negocio
- Realice limpiezas de datos (trimming, uppercase) antes de guardar en la DB.
- Use expresiones regulares (`re`) para validar formatos críticos como Placas o RUCs.

### Documentación Automática
Aproveche los `docstrings` en funciones y clases; FastAPI los usará para generar la documentación en `/docs` (Swagger) y `/redoc`.

---

## Funcionalidades Especiales

- **OCR**: El sistema utiliza `pytesseract` y `opencv` para procesar imágenes de licencias y tarjetas. (Ver `services/ocr.py`).
- **PDFs**: Generación de Packing Lists (OGL) mediante `reportlab` o `weasyprint`. (Ver `services/pdf_service.py`).
