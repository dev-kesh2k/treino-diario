# Contribuindo

Sugestões e correções são bem-vindas. Mantenha cada pull request pequeno e com um assunto só.

## Antes de enviar

```bash
node --test backend/test/*.test.js        # testes do backend (sem banco)
(cd backend && npx --yes eslint@9 .)      # variável usada sem declarar/importar
```

O GitHub Actions roda os mesmos passos (workflow **Testes**) em cada push e pull request.

## Situação do app

Este repositório **não tem deploy automático**: o app ainda não está publicado no Central Apps Hub. Para publicar, o Hub cria o workflow de deploy e prepara o servidor.

## Padrões

- Código, mensagens e textos da tela em português do Brasil.
- Regra nova vai num módulo puro (sem Prisma/banco), com teste em `backend/test/`.
- Nunca coloque senha, token ou chave no código ou no `.env.example` (o repositório é público). Sem `SEED_ADMIN_PASSWORD` no `.env`, o admin inicial não é criado.

## Commits em dupla

Os envios feitos pelo Central Apps Hub levam a linha `Co-Authored-By` do Claude, que participou da mudança.
