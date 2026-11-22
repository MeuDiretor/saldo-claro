import test from 'node:test';
import assert from 'node:assert/strict';
import {money,parseMessage,emptyState,validateState,applyProposal,summary,addContribution,saveState} from '../core.js';

test('moeda brasileira sem perda de centavos',()=>{
  assert.equal(money('R$ 1.234,56'),123456); assert.equal(money('0,10'),10);
  for(const x of ['-10','1.23','1,234','Infinity','0','999999999999999999999']) assert.throws(()=>money(x));
});
test('frase gera proposta sem alterar estado',()=>{
  const s=emptyState(),p=parseMessage('Gastei R$ 35,90 no mercado','2026-11-22');
  assert.equal(p.type,'expense');assert.equal(p.cents,3590);assert.equal(p.category,'Alimentação');assert.equal(s.transactions.length,0);
});
test('receita e meta são ações distintas',()=>{
  assert.equal(parseMessage('Recebi 3.000 de salário','2026-11-22').type,'income');
  const p=parseMessage('Criar meta Reserva de emergência de R$ 5.000','2026-11-22');
  assert.equal(p.kind,'goal');assert.equal(p.name,'Reserva de emergência');assert.equal(p.target,500000);
});
test('ambiguidade e datas inexistentes são rejeitadas',()=>{
  for(const x of ['Gastei 20 e 30 no mercado','Qual investimento rende mais?','Gastei 0 no mercado','Gastei 35.90 no mercado'])assert.throws(()=>parseMessage(x,'2026-11-22'));
  assert.throws(()=>parseMessage('Gastei 20 no mercado','2026-02-30'));
});
test('confirmação idempotente e meta realmente persistida',()=>{
  const p=parseMessage('Criar meta Viagem de 1.200','2026-11-22');
  const s=applyProposal(emptyState(),p,'mesmo-id');
  assert.equal(s.goals[0].target,120000);assert.equal(s.goals[0].name,'Viagem');
  assert.throws(()=>applyProposal(s,p,'mesmo-id')); assert.equal(s.goals.length,1);
});
test('resumo separa mês, tipos e categorias com soma exata',()=>{
  let s=emptyState();
  for(const [id,msg,date] of [['a','Recebi 2.000 de salário','2026-11-01'],['b','Gastei 0,10 no mercado','2026-11-02'],['c','Gastei 0,20 no mercado','2026-11-03'],['d','Gastei 900 no aluguel','2026-10-01']])s=applyProposal(s,parseMessage(msg,date),id);
  const r=summary(s,'2026-11');assert.equal(r.income,200000);assert.equal(r.expense,30);assert.equal(r.balance,199970);assert.equal(r.categories['Alimentação'],30);
});
test('aporte atualiza somente a meta, sem inventar receita ou despesa',()=>{
  let s=applyProposal(emptyState(),parseMessage('Criar meta Viagem de 1.200','2026-11-22'),'g');
  s=addContribution(s,'g',5000);assert.equal(s.goals[0].saved,5000);assert.equal(summary(s,'2026-11').balance,0);
  assert.throws(()=>addContribution(s,'ausente',100));assert.throws(()=>addContribution(s,'g',-1));
});
test('importação valida todos os registros, IDs e limites',()=>{
  const s=applyProposal(emptyState(),parseMessage('Gastei 20 no mercado','2026-11-22'),'a');
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);
  assert.throws(()=>validateState({...s,transactions:[...s.transactions,...s.transactions]}));
  for(const patch of [{cents:NaN},{cents:-1},{date:'2026-13-01'},{type:'investment'},{category:'inexistente'}])assert.throws(()=>validateState({...s,transactions:[{...s.transactions[0],...patch}]}));
  assert.throws(()=>validateState({version:2,transactions:[],goals:[]}));
});
test('falha de armazenamento não altera estado anterior',()=>{
  const before=emptyState(),after=applyProposal(before,parseMessage('Gastei 20 no mercado','2026-11-22'),'a');
  assert.throws(()=>saveState({setItem(){throw new Error('quota');}},after));assert.equal(before.transactions.length,0);
});
test('gravação usa JSON íntegro e chave própria',()=>{
  let pair;saveState({setItem(k,v){pair=[k,v];}},emptyState());
  assert.equal(pair[0],'saldo-claro.v1');assert.deepEqual(JSON.parse(pair[1]),emptyState());
});
