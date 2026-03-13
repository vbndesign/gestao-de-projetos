'use client'

export default function ProjetoError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar o projeto.</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
