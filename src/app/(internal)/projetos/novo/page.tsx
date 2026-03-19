import { getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetoForm } from './_components/projeto-form'

export default async function NovoProjetoPage() {
  const clientes = await getClientesParaSelect()
  return <ProjetoForm clientes={clientes} />
}
