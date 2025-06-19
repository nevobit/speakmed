import type { Metadata } from "next";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prooving.com'),
  title: {
    default: 'Prooving - PC Gamers, Componentes y Periféricos Para Gamers',
    template:
      '%s | Prooving - PC Gamers, Componentes y Periféricos Para Gamers',
  },
  description:
    'Construye computadoras extraordinarias con Prooving. PC para juegos premium, PC para juegos personalizados, software y otros productos relacionados con PC, todo para la comunidad gamer y de PC.',
  applicationName: 'Prooving',
  keywords: ['PC', 'Gamers', 'Componentes', 'Periféricos', 'Gaming'],
  authors: [{ name: 'Nevobit', url: 'https://nevobit.com' }],
  creator: 'Nevobit Software',
  publisher: 'Nevobit Software',
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/es-ES',
    },
  },
  openGraph: {
    title: 'Prooving - PC Gamers, Componentes y Periféricos Para Gamers',
    description:
      'Construye computadoras extraordinarias con Prooving. PC para juegos premium, PC para juegos personalizados, software y otros productos relacionados con PC, todo para la comunidad gamer y de PC.',
    url: 'https://prooving.com',
    siteName: 'Prooving',
    type: 'website',
    locale: 'es-ES',
  },
  twitter: {
    title: 'Prooving',
    description:
      'Construye computadoras extraordinarias con Prooving. PC para juegos premium, PC para juegos personalizados, software y otros productos relacionados con PC, todo para la comunidad gamer y de PC.',
    creator: '@nevobitsoftware',
    site: 'Prooving',
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
