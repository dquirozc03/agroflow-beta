import traceback
from app.database import SessionLocal
from app.models.factura import FacturaLogistica

print("Testing direct DB connection...")
try:
    with SessionLocal() as db:
        test_f = FacturaLogistica(
            proveedor_ruc="11111111111",
            proveedor_razon_social="Test",
            serie_correlativo="F001-1",
            moneda="PEN",
            subtotal=10.0,
            forma_pago="Test"
        )
        db.add(test_f)
        db.commit()
        print("Success, ID:", test_f.id)
except Exception as e:
    print("FAILED TO INSERT:")
    traceback.print_exc()
