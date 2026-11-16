# Segurança

## Como avisar sobre uma falha
Não abra uma issue pública. Use **Security → Report a vulnerability** neste repositório (aviso privado do GitHub). Inclua o passo a passo para reproduzir e o impacto que você percebeu.

Resposta em até 7 dias. Depois da correção publicada, o aviso pode ser divulgado com o seu crédito, se quiser.

## O que já é feito
- Nenhum segredo fica no repositório: senhas e chaves vão no `.env` do servidor (há só o `.env.example`).
- Senhas guardadas com hash (bcrypt) e sessões com token assinado.
- O app roda isolado em container, com usuário próprio no banco de dados.

## Versões
Só a versão da `main` recebe correções.
