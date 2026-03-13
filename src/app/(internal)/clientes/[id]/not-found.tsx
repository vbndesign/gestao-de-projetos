import Link from 'next/link'

export default function ClienteNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Cliente não encontrado</h2>
      <p className="text-muted-foreground">O cliente que você procura não existe ou foi removido.</p>
      <Link href="/clientes" className="text-primary underline">Voltar para clientes</Link>
    </div>
  )
}
