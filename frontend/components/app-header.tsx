"use client";

// El componente AppHeader ha sido simplificado a un espaciador invisible.
// Por requerimiento de UX, la información (título, hora, notificaciones) era redundante
// dado que el contenido principal ya tiene sus títulos, el OS tiene reloj y el sidebar
// ya identifica al usuario.
// Se mantiene este div para dar el "aire" (padding superior) necesario a las vistas
// sin que el contenido se sienta "pegado" al techo.

export function AppHeader() {
  return <div className="h-10 w-full shrink-0 bg-transparent" />;
}
