# Next Platform — Arquitetura-Alvo

**Status:** Referência arquitetural oficial  
**Escopo:** plataforma Next  
**Data:** 2026-09-06  
**Importante:** este documento descreve o **desenho final (target architecture)**. Ele não representa o primeiro incremento de implementação.

---

## 1. Objetivo

Este documento estabelece a arquitetura-alvo da plataforma Next e deve ser usado como referência para futuras decisões de autenticação, identidade, integração entre produtos e MCP.

A plataforma é composta por quatro produtos de domínio/experiência independentes e por uma camada central de identidade:

- **Next ID** — identidade e autenticação global;
- **NextSM** — Service Desk / ITSM;
- **Next RH** — produto de Recursos Humanos;
- **Next Intranet** — portal/intranet corporativa;
- **Next AI** — camada de inteligência conversacional e integração com os produtos.

Cada produto possui código e Supabase próprios. O Next ID também possui Supabase próprio.

---

## 2. Arquitetura-alvo

```text
┌─────────────────────┐
│       Next ID       │
│ Supabase próprio    │
│ Auth, MFA, Sessões, │
│ Identidade global   │
└──────────┬──────────┘
           │ JWT / identidade
           │
           │  ↓ para os 4 produtos
           │
┌──────────┼──────────────┬──────────────┐
▼          ▼              ▼              ▼
NextSM   Next RH      Intranet       Next AI
Supabase Supabase     Supabase       Supabase
   │         │             │              │
   └─────────┴────── MCP/API ─────────────┘
                 ▲
                 │
        Next AI como cliente MCP
        dos 3 produtos de domínio
```

### Regra estrutural

**Nenhum dos quatro produtos fica fora da validação central de identidade do Next ID.**

O Next AI não é uma exceção. Ele deve validar o JWT emitido pelo Next ID e operar associado à identidade real do usuário que iniciou a interação.

---

## 3. Next ID — identidade central

O **Next ID** é a autoridade central de identidade da plataforma.

Responsabilidades-alvo:

- autenticação;
- identidade global do usuário;
- MFA;
- sessões;
- recuperação de acesso;
- emissão/validação do contexto de identidade por JWT;
- atributos globais de identidade que não pertencem a um produto específico.

Os produtos não devem criar uma segunda identidade global paralela nem exigir que o usuário mantenha credenciais independentes para cada produto.

Cada produto mantém apenas os dados de domínio e autorização específicos necessários ao seu próprio contexto.

---

## 4. Os quatro consumidores do Next ID

O JWT/identidade do Next ID deve descer para:

1. **NextSM**
2. **Next RH**
3. **Next Intranet**
4. **Next AI**

Isso é uma regra da arquitetura-alvo, e não uma decisão opcional de implementação.

### Consequência para o Next AI

O Next AI precisa saber **qual usuário está conversando** para que as chamadas aos produtos respeitem o contexto e as permissões daquele usuário.

Não é permitido tratar o Next AI como uma aplicação anônima ou como um cliente que substitui a identidade do usuário por um token genérico da aplicação quando acessar funcionalidades protegidas dos produtos.

---

## 5. Next AI — papel arquitetural

O Next AI é um produto independente, com Supabase próprio, mas atua também como **cliente MCP** dos produtos de domínio.

Na arquitetura final, o Next AI terá integração MCP com:

- **NextSM**;
- **Next RH**;
- **Next Intranet**.

O Next AI não é dono dos dados de domínio desses produtos.

### Princípio de autorização

A autenticação do usuário começa no Next ID. Ao chamar um servidor MCP de um produto, o Next AI deve preservar/propagar a identidade real do usuário de forma verificável, para que o servidor MCP do produto possa aplicar suas próprias regras de autorização.

A autorização de uma operação de domínio permanece no produto proprietário daquele domínio.

Exemplo:

- Next AI recebe uma solicitação do usuário;
- Next AI identifica/autentica o usuário através do Next ID;
- Next AI chama o MCP do NextSM com contexto de identidade verificável;
- NextSM valida a identidade e as permissões aplicáveis;
- NextSM executa ou recusa a operação segundo suas próprias regras.

O Next AI **não deve receber autoridade implícita para ultrapassar as permissões do produto de domínio**.

---

## 6. MCP — arquitetura final

### Servidores MCP de domínio

Cada produto de domínio deve expor seu próprio servidor MCP conforme sua evolução:

- NextSM → MCP já existente;
- Next RH → MCP a ser implementado;
- Next Intranet → MCP a ser implementado.

O Next AI será cliente desses três servidores.

### Regra de evolução

O padrão utilizado no NextSM deve servir como referência para os futuros servidores MCP, mas os contratos devem ser definidos de forma semântica e estável, evitando acoplamento desnecessário à estrutura física das tabelas.

O servidor MCP deve ser responsável por:

- autenticar/verificar o contexto recebido;
- aplicar autorização do produto;
- executar regras de negócio do próprio domínio;
- retornar somente os dados permitidos ao contexto autenticado.

O cliente Next AI deve consumir essas capacidades sem duplicar a regra de negócio dos produtos.

---

## 7. Ordem de implementação — não confundir com arquitetura final

A arquitetura-alvo possui três integrações MCP do Next AI, mas elas **não precisam ser implementadas simultaneamente**.

### Fase inicial

**Next AI → NextSM (MCP)**

Esta é a primeira etapa porque o NextSM já possui servidor MCP funcional. O objetivo é validar ponta a ponta:

```text
Usuário
  ↓
Next ID
  ↓ JWT / identidade
Next AI
  ↓ identidade verificável
MCP NextSM
  ↓
Regras de autorização NextSM
  ↓
Dados/ações NextSM
```

Essa integração inicial é uma **decisão de ordem de execução**.

### Fases seguintes

Depois da validação do fluxo Next AI ↔ NextSM:

1. implementar/estabilizar o servidor MCP do **Next RH**;
2. integrar **Next AI ↔ Next RH** seguindo o mesmo padrão de identidade e autorização;
3. implementar/estabilizar o servidor MCP da **Next Intranet**;
4. integrar **Next AI ↔ Next Intranet** seguindo o mesmo padrão;
5. consolidar a experiência multi-produto no Next AI.

Portanto:

> **Integração inicial somente com NextSM ≠ arquitetura final restrita ao NextSM.**

---

## 8. Limites de responsabilidade

### Next ID

Dono de identidade e autenticação global.

### NextSM

Dono do domínio Service Desk/ITSM e de suas regras, dados, permissões e MCP.

### Next RH

Dono do domínio de RH e de suas regras, dados, permissões e futuro MCP.

### Next Intranet

Dono do domínio da intranet e de suas regras, dados, permissões e futuro MCP.

### Next AI

Dono da experiência e capacidades de inteligência artificial, conversação e orquestração de chamadas aos produtos. Não é dono dos dados de domínio dos outros produtos.

---

## 9. Regras de arquitetura que passam a ser obrigatórias

1. **Todo produto deve validar a identidade central do Next ID**, incluindo o Next AI.
2. **Next AI não pode operar sem autenticação de usuário** quando o contexto exigir identidade/permissões.
3. **Next AI deve manter conexão MCP com os três produtos de domínio na arquitetura final:** NextSM, Next RH e Next Intranet.
4. **A integração inicial somente com NextSM é roadmap, não arquitetura final.**
5. **Autorização permanece no produto dono do domínio.**
6. **Next AI não deve duplicar dados de domínio apenas para executar MCP.**
7. **MCP é a fronteira de integração**, enquanto regras de negócio continuam nos produtos de domínio.
8. **Cada produto mantém seu próprio Supabase**, incluindo Next AI e Next ID.
9. **Nenhuma decisão futura de auth ou MCP deve remover um dos quatro consumidores do Next ID.**

---

## 10. Critério de desvio arquitetural

Qualquer desenho, implementação ou decisão futura que faça uma das seguintes coisas deve ser explicitamente sinalizada como **desvio da arquitetura-alvo**:

- excluir o Next AI da validação do Next ID;
- permitir que o Next AI opere como usuário anônimo quando a operação depende de permissões do usuário;
- usar token genérico da aplicação no lugar da identidade real do usuário ao acessar produtos protegidos;
- tratar NextSM como único destino definitivo do Next AI;
- eliminar da arquitetura final a integração MCP com Next RH ou Next Intranet;
- mover regras de autorização de domínio para o Next AI;
- transformar o Next AI em proprietário dos dados de domínio de NextSM, Next RH ou Intranet.

Quando um desses pontos aparecer durante a análise ou implementação, deve ser identificado como **desvio**, e não incorporado silenciosamente à arquitetura.

---

## 11. Relação com o desenvolvimento atual do NextSM

O NextSM continua sendo desenvolvido e auditado de forma independente.

A arquitetura-alvo da plataforma **não implica alteração imediata do banco atual do NextSM**.

A reconstrução definitiva do banco e a adaptação do NextSM para consumir a identidade do Next ID devem ocorrer posteriormente, seguindo a ordem geral:

**Arquitetura → fronteiras → Next ID → produtos → bancos definitivos.**

O banco atual do NextSM (`byuvcguynctqftnoylno`) permanece como baseline durante a fase de auditoria e planejamento, sem alterações estruturais não aprovadas.

---

## 12. Referência oficial

A partir desta versão, este documento é a referência para:

- decisões de autenticação;
- desenho de identidade;
- integração MCP;
- evolução do Next AI;
- integração futura com Next RH;
- integração futura com Next Intranet;
- definição das fronteiras entre produtos.

Qualquer alteração dessa arquitetura deve ser documentada explicitamente como nova versão da arquitetura-alvo.
