# 🐛 TICKET: Ajustes UI y Paginación en Clientes IE
**Estado:** PENDIENTE
**Módulo:** Maestros -> Clientes IE
**Responsable:** Programador

## 🎯 Objetivo
Perfeccionar la interfaz de usuario del catálogo de Clientes IE para emparejarlo en calidad con el resto del sistema, incluyendo una paginación que faltó en la tabla base, alineación de layout de modal, y re-arquitectura de UX en el fitosanitario.

---

## 🛠 Tareas - Frontend (`frontend/app/maestros/clientes-ie/...`)

### Tarea 1: Paginación de la Tabla Principal
**Archivo:** `frontend/app/maestros/clientes-ie/page.tsx`
1. Declara la variable de estado para páginas: `const [currentPage, setCurrentPage] = useState(1);` y ajusta ítems por página (ej. 10).
2. De la variable que ya tienes `filtered`, extrae:
```typescript
   const indexOfLastItem = currentPage * 10;
   const indexOfFirstItem = indexOfLastItem - 10;
   const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
   const totalPages = Math.ceil(filtered.length / 10);
```
3. Reemplaza el `filtered.map` actual del JSX por `currentItems.map`.
4. Añade un componente de numeración (`<nav>`) debidamente alineado debajo del bloque de la tabla (`<div className="overflow-x-auto">`), utilizando los mismos botones redondeados de clase `bg-white border-slate-100 hover:text-emerald-500` ya utilizados en otras tablas del proyecto.

### Tarea 2: Redimensionamiento Modal (Cajas dispares)
**Archivo:** `frontend/components/cliente-ie-modal.tsx`
1. Ve a la línea aprox ~250 y ~280 dentro del viewport de `TabsContent value="bl"`.
2. Encontrarás dos grupos de Grid (`<div className="grid grid-cols-1 md:grid-cols-4...">` y un `grid-cols-1 md:grid-cols-1` para país).
3. Elimina ese `grid` intermedio para País/Destino y súbelos todos a la primera fila fusionada:
```tsx
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* 1. Div de Nombre Cliente */}
      {/* 2. Div de Cultivo */}
      {/* 3. Div de País */}
      {/* 4. Div de P. Destino */}
  </div>
```
De esta manera las cajas dejarán de mutar en ancho total y las 4 gozarán de un simétrico 25% superior.

### Tarea 3: Modificación Profunda UX Fitosanitario (Sin Interrupciones)
**Archivo:** `frontend/components/cliente-ie-modal.tsx`
1. Cambia el componente `<SearchableField />` por una arquitectura dual para que el usuario escriba libre si quiere crear uno nuevo.
2. Interfaz sugerida:
```tsx
 <div className="space-y-4">
   <div className="flex items-center justify-between">
      <label>Consignatario (Fito)</label>
      <button>🔎 Buscar Registrado</button> {/* <-- Lanza un popover / dialog independiente */}
   </div>
   <div className="flex gap-2 relative">
      <input type="text" ... />
      {formData.fitosanitario.id && (
         <button onClick={() => Desvincular}>❌ Desvincular</button>
      )}
   </div>
 </div>
```
3. Este diseño permitirá tipear sin miedo a ser "atajado" por sugerencias emergentes agresivas en cada pulsación. Si te equivocas seleccionando, el botón ❌ vuelve la variable `id: null` dejándote libre.

> ⚠️ No ejecutar hasta tener luz verde del Arquitecto / Inge Daniel sobre el modo de abordaje de la Tarea 3.
