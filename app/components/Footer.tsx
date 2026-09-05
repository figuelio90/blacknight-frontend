import Link from "next/link";
import { FaInstagram, FaFacebook, FaXTwitter, FaWhatsapp } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-[#060606] border-t border-neutral-900 mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-14">

        {/* Col 1: Logo + tagline */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <span className="text-2xl">🌙</span>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Black</span>
              <span className="text-violet-500">Night</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed">
            Viví los mejores eventos.<br />
            Donde la noche cobra vida.
          </p>
        </div>

        {/* Col 2: Navegación */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            Navegación
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-violet-400 transition-colors">
                Eventos
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            Legal
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/terminos" className="text-gray-500 hover:text-violet-400 transition-colors">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="text-gray-500 hover:text-violet-400 transition-colors">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/reembolsos" className="text-gray-500 hover:text-violet-400 transition-colors">
                Política de reembolsos
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-gray-500 hover:text-violet-400 transition-colors">
                Cookies
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Contacto */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            Contacto
          </p>
          <a
            href="mailto:hola@blacknight.com"
            className="text-sm text-gray-500 hover:text-violet-400 transition-colors block mb-5"
          >
            hola@blacknight.com
          </a>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-gray-500 hover:text-violet-400 transition-colors"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="text-gray-500 hover:text-violet-400 transition-colors"
            >
              <FaFacebook size={18} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className="text-gray-500 hover:text-violet-400 transition-colors"
            >
              <FaXTwitter size={18} />
            </a>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="text-gray-500 hover:text-violet-400 transition-colors"
            >
              <FaWhatsapp size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-900">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} BlackNight. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-700">Hecho con 🌙 en Argentina</p>
        </div>
      </div>
    </footer>
  );
}
