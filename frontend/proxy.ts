import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Giriş gerektirmeyen herkese açık sayfalar (Login, Register, Role Selection vs.)
const publicRoutes = ["/", "/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Sadece aktif uygulamanın yollarını kontrol et (statik dosyaları hariç tut)
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") ||
    pathname.includes(".") // .js, .css, resimler vb.
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Bu örnekte middleware üzerinden HTTP-Only cookie tabanlı bir koruma yapılamıyor 
  // çünkü local storage kullanıyoruz. Ancak sunucu tarafında en azından 
  // route yapısı için bir iskelet bırakmak Next.js App Router standartı açısından iyidir.
  // Gerçek auth kontrolü istemci tarafındaki useAuth ve Dashboard'lardaki useEffect ile yapıldı.
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
