# Validação executada

Data: 22/11/2026. Exemplos e capturas usam somente dados fictícios. Ambiente local: Node.js 24.12.0 e navegador Chromium, com execução local.

## Núcleo

Dez testes do domínio passaram com `npm test`. `npm run check` verifica a sintaxe dos dois módulos. A primeira execução dos testes, antes do núcleo existir, falhou por módulo ausente; após implementar, os dez passaram. Uma chamada posterior feita fora da raiz do repositório falhou por ausência de package.json; foi corrigido o diretório de execução, sem tratar isso como falha do produto.

Os casos cobrem representação brasileira de moeda e limites, propostas que ainda não gravam, receita e meta distintas, mensagens ambíguas e datas impossíveis, IDs duplicados, totais mensais em centavos, aportes separados do extrato, importação integral e armazenamento recusado. O teste de erro de armazenamento é uma unidade com adaptador que lança erro; não é simulação de quota em navegador real.

## Interface no navegador

- Receita de R$ 3.000 e gasto de R$ 35,90: saldo observado R$ 2.964,10.
- Meta Reserva de emergência de R$ 5.000 criada por conversa: apareceu no componente e persistiu ao recarregar. Aporte de R$ 200 mudou a meta e preservou o saldo.
- Cancelar uma proposta manteve o JSON local idêntico, verificado antes/depois.
- Filtro de despesas mostrou somente o gasto e preservou o total do mês.
- Mensagem com duas quantias foi recusada, sem abrir confirmação nem gravar.
- Texto com aparência de HTML foi salvo como texto: zero imagens criadas no extrato e conversa. O registro sintético do teste foi depois removido pelo fluxo normal de exclusão.
- Gasto adicional de R$ 850 em aluguel e R$ 24 em ônibus: entradas R$ 3.000, saídas R$ 909,90, saldo R$ 2.090,10, três categorias.
- Exportação real gerou JSON com quatro lançamentos e uma meta. Arquivo inválido foi recusado, preservando os quatro lançamentos. Importação do backup real, após prévia e confirmação, produziu estado serializado idêntico.
- Uma segunda aba gravou um lançamento sintético: a primeira recebeu o evento de mudança, fechou a revisão aberta e bloqueou também a tentativa de exclusão. O backup anterior foi restaurado pelo fluxo normal. Isso verifica o bloqueio observado, não garante atomicidade geral entre abas.
- Fonte Montserrat local com estado `loaded`. Desktop revisado em 1440×1080 e mobile em 390×844, área útil 375 px. Após corrigir dois pontos de overflow, largura do documento e área útil foram ambas 375 px. Diálogo ficou entre x18 e x357, dentro da área útil. Movimento reduzido ativo foi detectado.
- Escape cancelou o diálogo; foco inicial e rótulos foram observados. Não foi executada auditoria completa com leitor de tela.

## Limites

Não houve entrevistas, conta bancária, produção, sincronização ou teste de carga. Não se afirma segurança absoluta. O domínio usa regras explícitas; o histórico de conversa é temporário, mas os lançamentos e metas são persistidos localmente.
