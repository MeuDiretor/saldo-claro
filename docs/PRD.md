# Saldo Claro — PRD

## Instrução final

```text
Crie o Saldo Claro, um organizador financeiro pessoal local em português do Brasil.

Problema: registrar gastos e entender o mês exige passos demais. O público é
quem está começando e precisa de uma interação curta, legível e reversível.

Entregue um aplicativo estático em HTML, CSS e JavaScript, sem dependências de
execução, conta, serviços externos ou conexão bancária. Use somente dados
fictícios nos exemplos. Nunca diga que algo foi salvo antes da gravação real.

Funcionalidades:
1. Registrar receita ou despesa por frase simples, com um valor por mensagem.
2. Sugerir uma categoria e abrir revisão editável antes de confirmar.
3. Criar metas pela conversa, persistindo o objetivo e o valor; registrar
   aportes por ação explícita, sem duplicá-los no saldo do extrato.
4. Mostrar receitas, despesas, saldo, categorias e extrato do mês selecionado.
5. Exportar JSON e importar somente após validar todos os registros e pedir
   confirmação para substituir os dados existentes.

Formatos aceitos: Gastei 35,90 no mercado; Recebi 3.000 de salário;
Criar meta Viagem de R$ 1.200. O reconhecimento pode usar regras locais;
não simule compreensão geral. Recuse várias quantias ou datas inexistentes.

Calcule em centavos inteiros. Valide valores, tipos, categorias e IDs únicos.
Preserve dados anteriores se o armazenamento falhar. Limite o tamanho do
arquivo e a quantidade de registros. Trate texto do usuário como texto,
nunca HTML. Nenhuma mensagem deve ser enviada a servidores.

Interface: marfim e verde-petróleo, Montserrat local com licença preservada,
números destacados, espaço entre áreas, navegação por teclado, rótulos,
confirmação em diálogo, estado anunciado e respeito a movimento reduzido.
No celular, não gere rolagem horizontal da página; o extrato pode rolar
dentro de seu próprio contêiner.

Entregue telas funcionais, testes do domínio, exemplos, instruções locais,
capturas próprias, resultados observados e limites explícitos. Não invente
entrevistas, usuários, integração, segurança de produção ou retorno financeiro.
```

## Critérios de aceitação

- Cancelar a revisão não grava nada; confirmar uma receita e uma despesa atualiza os totais exatos.
- Uma meta criada pela frase aparece na lista e permanece depois de recarregar.
- Um aporte muda a meta, sem alterar receita, despesa ou saldo do mês.
- Dados inválidos são recusados integralmente; exportar/importar uma cópia válida preserva o estado.
- Falha de persistência não muda a memória nem produz mensagem de sucesso.
- A interface mostra o formato aceito e explica o alcance limitado do reconhecimento.

## Validação futura com pessoas

Proposta ainda não executada: pedir a participantes voluntários que registrem uma entrada, um gasto e uma meta, encontrem um lançamento e recuperem uma cópia. Medir conclusão sem ajuda, erros de categoria e entendimento da confirmação. Não houve recrutamento, coleta pessoal ou alegação de aprovação por usuários.
