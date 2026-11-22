import {CATEGORIES,money,parseMessage,emptyState,validateState,applyProposal,summary,addContribution,saveState} from './core.js';

const $=id=>document.getElementById(id);
const brl=cents=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let state=emptyState(),pending=null,rawBackup=null,locked=false;
$('date').value=localDate();$('month').value=localDate().slice(0,7);
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
try{rawBackup=localStorage.getItem('saldo-claro.v1');if(rawBackup)state=validateState(JSON.parse(rawBackup));}
catch{locked=true;status('Não foi possível ler os dados locais. Exporte a cópia original e importe um arquivo válido antes de salvar.',true);}
function commit(next){
  saveState(localStorage,next); // Só muda a memória depois de persistir com sucesso.
  state=next;locked=false;rawBackup=JSON.stringify(next);render();
}
function say(text,who='assistant'){
  const p=node('p',text,who);$('messages').append(p);
  while($('messages').children.length>24)$('messages').firstElementChild.remove();
  $('messages').scrollTop=$('messages').scrollHeight;
}
function field(label,type,value,id,options){
  const wrap=node('label',label);wrap.htmlFor=id;
  const input=node(options?'select':'input');input.id=id;input.name=id;input.required=true;
  if(options){for(const option of options){const el=node('option',option.text??option);el.value=option.value??option;input.append(el);}}
  else{input.type=type;input.maxLength=160;if(type==='text')input.autocomplete='off';}
  input.value=value;wrap.append(input);$('fields').append(wrap);return input;
}
function openReview(action){
  if(locked&&action.mode!=='import'){status('Recarregue a página ou importe uma cópia válida antes de alterar dados.',true);return;}
  pending=action;$('fields').replaceChildren();$('review-error').textContent='';$('confirm').disabled=false;
  $('review-heading').textContent='Revisar lançamento';$('review-description').textContent='Confira os detalhes. Você pode corrigir a categoria sugerida.';
  $('confirm').textContent='Confirmar e salvar';$('review-note').textContent='Só a confirmação grava os dados neste navegador.';
  if(action.mode==='proposal'){
    const p=action.proposal;
    if(p.kind==='goal'){$('review-heading').textContent='Criar uma meta';$('review-description').textContent='Confira o nome e o valor que você quer alcançar.';field('Nome da meta','text',p.name,'name');field('Valor da meta (R$)','text',(p.target/100).toFixed(2).replace('.',','),'value');}
    else{field('Descrição','text',p.description,'description');field('Valor (R$)','text',(p.cents/100).toFixed(2).replace('.',','),'value');field('Data','date',p.date,'entry-date');field('Movimento','',p.type,'type',[{text:'Receita',value:'income'},{text:'Despesa',value:'expense'}]);field('Categoria','',p.category,'category',CATEGORIES);}
  }else if(action.mode==='contribution'){
    $('review-heading').textContent='Adicionar um aporte';$('review-description').textContent=action.goal.name;
    field('Valor do aporte (R$)','text','','value');$('review-note').textContent='O aporte atualiza a meta; não cria receita nem despesa no extrato.';
  }else if(action.mode==='import'){
    $('review-heading').textContent='Substituir dados locais?';$('review-description').textContent=`O arquivo contém ${action.data.transactions.length} lançamento(s) e ${action.data.goals.length} meta(s). Os dados atuais serão substituídos. Exporte uma cópia antes de confirmar.`;$('confirm').textContent='Substituir meus dados';
  }else if(action.mode==='remove'){
    $('review-heading').textContent='Excluir lançamento?';$('review-description').textContent=`${action.entry.description} · ${brl(action.entry.cents)}. Esta ação retira o registro do extrato local.`;$('confirm').textContent='Excluir lançamento';
  }
  $('review').showModal();
}
function cancel(){pending=null;$('review').close();$('message').focus();}
$('cancel').addEventListener('click',cancel);$('cancel-x').addEventListener('click',cancel);
$('review').addEventListener('cancel',()=>{pending=null;});
$('chat-form').addEventListener('submit',e=>{
  e.preventDefault();if(locked){status('Importe uma cópia válida antes de gravar novos dados.',true);return;}
  const text=$('message').value.trim();if(!text)return;say(text,'user');
  try{const proposal=parseMessage(text,$('date').value);openReview({mode:'proposal',proposal,id:crypto.randomUUID()});}
  catch(error){say(error.message);}
});
$('review-form').addEventListener('submit',e=>{
  e.preventDefault();if(!pending)return;
  const action=pending;$('confirm').disabled=true;
  try{
    let next,feedback;
    if(action.mode==='proposal'){
      let p={...action.proposal};
      if(p.kind==='goal')p={...p,name:$('name').value.trim(),target:money($('value').value)};
      else p={...p,description:$('description').value.trim(),cents:money($('value').value),date:$('entry-date').value,type:$('type').value,category:$('category').value};
      next=applyProposal(state,p,action.id);feedback=p.kind==='goal'?`Meta “${p.name}” criada: ${brl(p.target)}. Ela já aparece em Minhas metas.`:`${p.type==='income'?'Receita':'Despesa'} salva: ${p.description}, ${brl(p.cents)}.`;
    }else if(action.mode==='contribution'){next=addContribution(state,action.goal.id,money($('value').value));feedback='Aporte salvo. O progresso da meta foi atualizado.';}
    else if(action.mode==='import'){next=validateState(action.data);feedback='Cópia importada. Os dados locais foram substituídos.';}
    else if(action.mode==='remove'){next=validateState({...state,transactions:state.transactions.filter(t=>t.id!==action.entry.id)});feedback='Lançamento excluído do extrato local.';}
    else throw new Error('Revisão desconhecida.');
    commit(next);pending=null;$('review').close();$('message').value='';say(feedback);status(feedback);$('message').focus();
  }catch(error){$('review-error').textContent=`Não foi salvo: ${error.message} Seus dados anteriores foram preservados.`;$('confirm').disabled=false;}
});
function render(){
  const r=summary(state,$('month').value);$('balance').textContent=brl(r.balance);$('income').textContent=brl(r.income);$('expense').textContent=brl(r.expense);
  const incomes=r.rows.filter(t=>t.type==='income').length,expenses=r.rows.length-incomes;
  $('income-count').textContent=`${incomes} ${incomes===1?'receita registrada':'receitas registradas'}`;$('expense-count').textContent=`${expenses} ${expenses===1?'despesa registrada':'despesas registradas'}`;
  $('categories').replaceChildren();const categories=Object.entries(r.categories).sort((a,b)=>b[1]-a[1]);
  if(!categories.length)$('categories').append(node('p','Nenhuma despesa neste mês. Registre um gasto para ver a distribuição.','fine'));
  for(const [name,cents] of categories){const item=node('div',undefined,'category'),label=node('div',undefined,'category-label');label.append(node('span',name),node('strong',brl(cents)));const bar=node('div',undefined,'track'),fill=node('span',undefined,'fill');fill.style.width=`${cents/r.expense*100}%`;bar.setAttribute('aria-hidden','true');bar.append(fill);item.append(label,bar);$('categories').append(item);}
  $('goals').replaceChildren();
  if(!state.goals.length)$('goals').append(node('p','Qual é seu próximo objetivo? Comece com uma meta pequena.','fine'));
  for(const goal of state.goals){
    const item=node('div',undefined,'goal'),progress=node('progress');progress.max=goal.target;progress.value=Math.min(goal.saved,goal.target);progress.setAttribute('aria-label',`Progresso da meta ${goal.name}`);
    const values=node('div',undefined,'goal-total');values.append(node('span',brl(goal.saved)),node('span',`de ${brl(goal.target)}`));
    const remaining=node('p',goal.saved>=goal.target?'Meta alcançada.':`Faltam ${brl(goal.target-goal.saved)}.`,'fine');
    const button=node('button','+ Registrar aporte','quiet');button.addEventListener('click',()=>{if(locked)return;openReview({mode:'contribution',goal});});item.append(node('h3',goal.name),values,progress,remaining,button);$('goals').append(item);
  }
  $('rows').replaceChildren();const filtered=r.rows.filter(t=>$('filter').value==='all'||t.type===$('filter').value).sort((a,b)=>b.date.localeCompare(a.date));
  for(const entry of filtered){
    const row=node('tr'),value=node('td',`${entry.type==='income'?'+':'−'} ${brl(entry.cents)}`,`amount ${entry.type==='income'?'in':'out'}`),button=node('button','×','remove');button.setAttribute('aria-label',`Excluir ${entry.description}`);button.addEventListener('click',()=>openReview({mode:'remove',entry}));const action=node('td');action.append(button);
    row.append(node('td',entry.description),node('td',entry.category),node('td',entry.date.split('-').reverse().join('/')),value,action);$('rows').append(row);
  }
  $('empty').hidden=filtered.length>0;$('demo').hidden=state.transactions.length>0||state.goals.length>0||locked;
  $('row-count').textContent=`${filtered.length} movimentos no filtro atual. Valores em reais. Metas são acompanhadas separadamente.`;
}
for(const button of document.querySelectorAll('[data-example]'))button.addEventListener('click',()=>{$('message').value=button.dataset.example;$('message').focus();});
$('new-goal').addEventListener('click',()=>{$('message').value='Criar meta Viagem de R$ 1.200';$('message').focus();$('chat-heading').scrollIntoView({block:'center'});});
$('month').addEventListener('change',()=>{try{render();}catch(error){status(error.message,true);}});$('filter').addEventListener('change',render);
$('demo').addEventListener('click',()=>{
  if(state.transactions.length||state.goals.length||locked)return;
  try{const date=localDate();let next=emptyState();for(const text of ['Recebi 3.200 de salário','Gastei 82,40 no mercado','Gastei 24 no transporte','Gastei 850 no aluguel','Criar meta Reserva de emergência de R$ 5.000'])next=applyProposal(next,parseMessage(text,date),crypto.randomUUID());next=addContribution(next,next.goals[0].id,40000);commit(next);$('month').value=date.slice(0,7);render();status('Exemplo fictício carregado. Nenhum dado representa suas finanças reais.');}
  catch(error){status(`Exemplo não salvo: ${error.message}`,true);}
});
$('export').addEventListener('click',()=>{
  const content=locked&&rawBackup!==null?rawBackup:JSON.stringify(state,null,2),url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=node('a');a.href=url;a.download=`saldo-claro-${localDate()}${locked?'-recuperacao':''}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Arquivo de cópia preparado. Guarde-o em um lugar seguro.');
});
$('import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>1_000_000)throw new Error('Arquivo maior que 1 MB.');const data=validateState(JSON.parse(await file.text()));openReview({mode:'import',data});}
  catch(error){status(`Importação recusada: ${error.message} Os dados anteriores foram preservados.`,true);}finally{e.target.value='';}
});
window.addEventListener('storage',event=>{if(event.key==='saldo-claro.v1'){locked=true;status('Os dados mudaram em outra aba. Recarregue esta página antes de salvar.',true);$('confirm').disabled=true;pending=null;if($('review').open)$('review').close();}});
render();
