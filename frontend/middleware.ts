import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificamos si la variable de entorno de mantenimiento esta encendida (true)
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  // Si esta en mantenimiento y NO esta en la pagina de mantenimiento, lo redirigimos
  if (isMaintenanceMode && request.nextUrl.pathname !== '/maintenance') {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // Si NO esta en mantenimiento y trata de entrar a la pagina de mantenimiento, lo devolvemos al inicio
  if (!isMaintenanceMode && request.nextUrl.pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Le decimos al middleware que aplique a todas las rutas EXCEPTO archivos estaticos, imagenes y la API interna
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
