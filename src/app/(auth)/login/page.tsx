import { LoginButton } from './login-button'

type Props = {
  searchParams?: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = params?.error

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Gestão de Projetos</h1>
        <p className="text-muted-foreground">
          Faça login para acessar o painel
        </p>
      </div>

      <LoginButton />

      {error && (
        <p className="text-sm text-destructive">
          Erro ao fazer login. Tente novamente.
        </p>
      )}
    </main>
  )
}
