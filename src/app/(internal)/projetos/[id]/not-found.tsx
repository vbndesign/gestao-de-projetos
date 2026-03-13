import Link from 'next/link'

export default function ProjetoNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
      <p className="text-muted-foreground">O projeto que você procura não existe ou foi removido.</p>
      <Link href="/projetos" className="text-primary underline">Voltar para projetos</Link>
    </div>
  )
}
