import type { Metadata } from 'next';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/newsreader/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'TutorIA — Mesa Personal de Estudio Interactivo y Repaso Espaciado',
  description:
    'Convierte tus propios apuntes de matemáticas, ciencias e idiomas en un plan de estudio con práctica interactiva, tarjetas y cuestionarios aprobados por ti, repaso espaciado transparente y progreso local sin rachas.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-419">
      <body>{children}</body>
    </html>
  );
}
