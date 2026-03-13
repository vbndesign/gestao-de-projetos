import { getClientes } from '@/queries/cliente.queries'
import { ClientesListagem } from './_components/clientes-listagem'

export default async function ClientesPage() {
  const clientes = await getClientes()
  return <ClientesListagem clientes={clientes} />
}
