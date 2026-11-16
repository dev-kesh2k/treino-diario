# Changelog

Mudanças do app, da mais nova para a mais antiga. Cada item é um pull request mesclado na `main`.

## 2026-11-16 — repositório próprio

- Segurança: senha mínima de 8 caracteres (antes 6), igual aos outros apps (#9)
- Testes: duração e calorias do treino (#8)
- Treino: duração e calorias em workout-calc.js (testáveis sem o banco) (#7)
- CI: roda os testes do backend (#6)
- Testes: datas no fuso do app (#5)
- Backend: funções de data em dates.js (testáveis sem o banco) (#4)
- CI: lint do backend no GitHub Actions (#3)
- Lint: eslint.config.js com no-undef no backend (pega import esquecido) (#2)
- SECURITY.md: como avisar sobre uma falha de forma privada (#1)
- Primeira versão no GitHub. Antes do envio, a senha padrão do admin foi tirada do código e do `.env.example` (o repositório é público).
