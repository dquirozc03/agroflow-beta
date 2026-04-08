import sys

file_path = r'd:\PROJECTS\BETA\BETA LogiCapture 1.0\frontend\app\operaciones\instrucciones\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Función para limpiar el anidamiento en las secciones conflictivas
def fix_page():
    # 1. Buscar Section 1 (Logistica)
    # Buscamos por el texto de la planta
    target_text = 'Planta de Llenado / Empaque'
    for i, line in enumerate(lines):
        if target_text in line:
            # Encontramos la sección. Ahora vamos a reconstruir sus cierres.
            # i+1: label
            # i+2: div flex open
            # i+3: input planta
            # i+4: input direccion
            # i+5: div flex close
            # i+6: div space-y-2 close (planta)
            # i+7: div grid-cols-2 close (operador/planta)
            # i+8: div grid-cols-2 close (fila 3)
            # i+9: div bg-white close (container)
            # i+10: div space-y-8 close (section)
            
            new_closures = [
                '                                  </div>\n', # flex gap-3
                '                                </div>\n',   # space-y-2
                '                              </div>\n',     # grid col 2 (planta/operador)
                '                            </div>\n',       # grid col 2 (fila 3)
                '                          </div>\n',         # bg-white
                '                        </div>\n'            # space-y-8
            ]
            
            # Reemplazar desde i+5 en adelante hasta encontrar la Sección 2
            found_s2 = -1
            for j in range(i+5, len(lines)):
                if 'SECCION 2: CONSIGNATARIO' in lines[j]:
                    found_s2 = j
                    break
            
            if found_s2 != -1:
                # Reemplazamos el bloque intermedio
                lines[i+5:found_s2] = new_closures + ['\n']
                break

    # 2. Buscar Section 2 (Consignatario)
    target_s2 = 'Dirección Notify'
    for i, line in enumerate(lines):
        if target_s2 in line:
            # i+1: textarea
            # i+2: div close (direccion)
            # i+3: div close (col 2)
            # i+4: div close (grid s2)
            # i+5: div close (section s2)
            
            new_closures_s2 = [
                '                               </div>\n', # div close direccion
                '                             </div>\n',   # div close col 2
                '                           </div>\n',     # div close grid s2
                '                        </div>\n'         # div close section s2
            ]
            
            # Buscar Section 3
            found_s3 = -1
            for j in range(i+2, len(lines)):
                if 'SECCION 3: PESOS Y CONDICIONES' in lines[j]:
                    found_s3 = j
                    break
            
            if found_s3 != -1:
                lines[i+2:found_s3] = new_closures_s2 + ['\n']
                break

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Corrección completada exitosamente.")

if __name__ == "__main__":
    fix_page()
