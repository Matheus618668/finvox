# FinVox

App de finanças pessoais com entrada por voz. Desenvolvido com Next.js, Supabase e Gemini.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (banco de dados + autenticação)
- **Gemini 2.5 Flash** (transcrição e parsing de voz)
- **Tailwind CSS**
- **Vercel** (hospedagem)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## Deploy na Vercel

1. Suba o código pro GitHub
2. Importe o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!
