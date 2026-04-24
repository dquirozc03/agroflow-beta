import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.routers.clientes_ie import create_cliente_ie, update_cliente_ie, ClienteIESchema
from app.models.maestros import ClienteIE

db = SessionLocal()

try:
    print("Probando CREATE...")
    req = ClienteIESchema(
        nombre_legal="TEST PO CLIENT",
        pais="PERU",
        po="TAG1,TAG2"
    )
    res = create_cliente_ie(req, db)
    print("Respuesta CREATE:", res)
    new_id = res["id"]
    
    # Verificar en BD
    db.expire_all()
    c = db.query(ClienteIE).filter(ClienteIE.id == new_id).first()
    print("PO en DB después de CREATE:", c.po)

    print("\nProbando UPDATE...")
    req_update = ClienteIESchema(
        id=new_id,
        nombre_legal="TEST PO CLIENT",
        pais="PERU",
        po="TAG1,TAG2,TAG3"
    )
    res_update = update_cliente_ie(new_id, req_update, db)
    print("Respuesta UPDATE:", res_update)
    
    db.expire_all()
    c = db.query(ClienteIE).filter(ClienteIE.id == new_id).first()
    print("PO en DB después de UPDATE:", c.po)

except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
