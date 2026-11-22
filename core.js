export const CATEGORIES=['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Renda','Outros'];
const LIMIT=900_000_000_000;
const fail=message=>{throw new Error(message);};
const integer=n=>Number.isSafeInteger(n)&&n>0&&n<=LIMIT;
const label=s=>typeof s==='string'&&s.trim().length>0&&s.length<=160;
const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function money(raw){
  const s=String(raw).trim().replace(/^R\$\s*/i,'');
  if(!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))fail('Use um valor positivo no formato 1.234,56.');
  const [whole,fraction='']=s.replaceAll('.','').split(',');
  const value=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!integer(value))fail('Valor fora do limite permitido.');
  return value;
}
export const emptyState=()=>({version:1,transactions:[],goals:[]});
function categoryFor(description){
  const s=description.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const rules=[['Alimentação',/mercado|almoco|jantar|cafe|restaurante|padaria/],['Moradia',/aluguel|condominio|energia|internet|agua/],['Transporte',/onibus|uber|combustivel|gasolina|metro/],['Saúde',/medic|farmacia|consulta/],['Educação',/livro|curso|escola/],['Lazer',/cinema|jogo|viagem|passeio/]];
  return rules.find(([,rx])=>rx.test(s))?.[0]??'Outros';
}
export function parseMessage(raw,date){
  if(!dateOK(date))fail('Escolha uma data válida.');
  if(typeof raw!=='string'||raw.length>300)fail('Use uma frase de até 300 caracteres.');
  const text=raw.trim(),amounts=[...text.matchAll(/(?:R\$\s*)?\d[\d.,]*/gi)];
  if(amounts.length!==1)fail('Informe uma ação com apenas um valor. Exemplo: Gastei 35,90 no mercado.');
  const amount=amounts[0],value=money(amount[0]);
  const before=text.slice(0,amount.index).trim(),after=text.slice(amount.index+amount[0].length).trim();
  if(/^criar (?:uma )?meta\s/i.test(text)){
    const name=before.replace(/^criar (?:uma )?meta\s*/i,'').replace(/\s+(?:no valor de|de)\s*$/i,'').trim();
    if(!label(name)||after)fail('Use: Criar meta Viagem de R$ 1.200.');
    return {kind:'goal',name,target:value};
  }
  const verb=text.match(/^(gastei|paguei|comprei|recebi)\s+/i)?.[1].toLowerCase();
  if(!verb)fail('Comece com Gastei, Paguei, Comprei, Recebi ou Criar meta.');
  const description=(before.replace(/^(gastei|paguei|comprei|recebi)\s*/i,'')+' '+after).trim().replace(/^(no|na|em|de|com)\s+/i,'');
  if(!label(description))fail('Diga também a descrição. Exemplo: Recebi 3.000 de salário.');
  const type=verb==='recebi'?'income':'expense';
  return {kind:'transaction',description,cents:value,date,type,category:type==='income'?'Renda':categoryFor(description)};
}
export function validateState(raw){
  if(!raw||raw.version!==1||!Array.isArray(raw.transactions)||!Array.isArray(raw.goals)||raw.transactions.length>1000||raw.goals.length>50)fail('Arquivo incompatível ou acima do limite (1.000 lançamentos / 50 metas).');
  const ids=new Set();
  const unique=id=>{if(!label(id)||ids.has(id))fail('Identificador inválido ou duplicado.');ids.add(id);};
  const transactions=raw.transactions.map(t=>{
    if(!t||!label(t.description)||!integer(t.cents)||!dateOK(t.date)||!['income','expense'].includes(t.type)||!CATEGORIES.includes(t.category))fail('Lançamento inválido.');
    unique(t.id);return{id:t.id,description:t.description,cents:t.cents,date:t.date,type:t.type,category:t.category};
  });
  const goals=raw.goals.map(g=>{
    if(!g||!label(g.name)||!integer(g.target)||!Number.isSafeInteger(g.saved)||g.saved<0||g.saved>LIMIT)fail('Meta inválida.');
    unique(g.id);return{id:g.id,name:g.name,target:g.target,saved:g.saved};
  });
  return {version:1,transactions,goals};
}
export function applyProposal(state,p,id){
  const next=validateState(state);
  if(p.kind==='goal')next.goals.push({id,name:p.name,target:p.target,saved:0});
  else if(p.kind==='transaction')next.transactions.push({id,description:p.description,cents:p.cents,date:p.date,type:p.type,category:p.category});
  else fail('Proposta desconhecida.');
  return validateState(next);
}
export function addContribution(state,id,cents){
  if(!integer(cents))fail('Informe um aporte positivo.');
  const next=validateState(state),goal=next.goals.find(g=>g.id===id);
  if(!goal)fail('Meta não encontrada.');
  goal.saved+=cents;return validateState(next);
}
export function summary(state,month){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))fail('Mês inválido.');
  const rows=validateState(state).transactions.filter(t=>t.date.startsWith(month));
  const result={income:0,expense:0,balance:0,categories:{},rows};
  for(const t of rows){result[t.type]+=t.cents;if(t.type==='expense')result.categories[t.category]=(result.categories[t.category]??0)+t.cents;}
  result.balance=result.income-result.expense;return result;
}
export function saveState(storage,state){storage.setItem('saldo-claro.v1',JSON.stringify(validateState(state)));}
