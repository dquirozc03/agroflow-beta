import { NextResponse } from "next/server";

export const runtime = "nodejs"; // importante: evita edge raros

function getTargetBase() {
  const target = process.env.API_PROXY_TARGET;
  if (!target) {
    throw new Error("API_PROXY_TARGET no está definido en el entorno del frontend.");
  }
  return target.replace(/\/$/, "");
}

async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetBase = getTargetBase();

  // Reconstituimos la URL destino: {TARGET}/api/v1/... + querystring
  const incomingUrl = new URL(req.url);
  const dest = new URL(`${targetBase}/api/v1/${path.join("/")}`);
  dest.search = incomingUrl.search;

  // Copiamos headers, pero evitamos romper host/encoding
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Para GET/HEAD no enviamos body
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(dest.toString(), {
      method,
      headers,
      body,
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { detail: "No se pudo conectar al backend. ¿Está en marcha en el puerto 8000?" },
      { status: 503 }
    );
  }

  // Devolvemos la respuesta tal cual (content-type incluido)
  const resHeaders = new Headers(upstream.headers);

  // Para evitar problemas de compresión cruzada
  resHeaders.delete("content-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export async function GET(req: Request, ctx: any) { return handler(req, ctx); }
export async function POST(req: Request, ctx: any) { return handler(req, ctx); }
export async function PATCH(req: Request, ctx: any) { return handler(req, ctx); }
export async function PUT(req: Request, ctx: any) { return handler(req, ctx); }
export async function DELETE(req: Request, ctx: any) { return handler(req, ctx); }
export async function OPTIONS(req: Request, ctx: any) { return handler(req, ctx); }
