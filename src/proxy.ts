/**
 * Proxy (in Next.js 16 il "middleware" si chiama così — vedi
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 *
 * Due compiti, limitati all'area /admin (il `matcher` in fondo tiene fuori
 * tutto il sito ospite, così le pagine pubbliche restano statiche/ISR):
 *  1. Rinfresca la sessione Supabase, riscrivendo i cookie aggiornati sulla
 *     risposta (necessario con @supabase/ssr per non perdere il login).
 *  2. Controllo "ottimistico" di accesso: chi non è loggato viene mandato al
 *     login; chi è loggato e va sul login viene mandato alla dashboard.
 *
 * NON è l'unica linea di difesa: ogni pagina/azione admin ricontrolla la
 * sessione lato server (src/lib/auth.ts) e la RLS protegge comunque i dati.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANTE: getUser() rivalida il token lato server e va chiamato subito,
  // senza logica in mezzo, per evitare logout casuali (guida @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Solo l'area admin: il sito ospite non passa dal proxy.
  matcher: ["/admin/:path*"],
};
