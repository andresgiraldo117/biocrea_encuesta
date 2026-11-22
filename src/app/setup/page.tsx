import { Logo } from "@/components/Logo";

export default function SetupPage() {
  return (
    <main className="grain mx-auto min-h-dvh max-w-md px-5 py-8">
      <Logo className="mb-4 h-12 w-12 text-forest" />
      <h1 className="font-display text-4xl font-semibold">Listo para recibir respuestas</h1>
      <p className="mt-4 text-ink-soft">
        Las encuestas se guardan en el servidor. Ya no hace falta crear tablas en Supabase.
      </p>
      <a href="/" className="cta mt-6 flex h-[3.35rem] items-center justify-center rounded-full font-semibold">
        Ir a la encuesta
      </a>
    </main>
  );
}
