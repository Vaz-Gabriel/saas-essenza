// #region VARIÁVEIS E INICIALIZAÇÃO
const supabaseUrl = 'https://midlkoozyzhngzzvjisc.supabase.co';
const supabaseKey = 'sb_publishable_pnAQ_uv8V_3IZ5nr2Klyxw_gFE0f-Vt';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

let listaGlobalProdutos = []; let listaGlobalProcedimentos = []; let listaGlobalClientes = []; let listaGlobalProfissionais = [];
let dadosEstoqueGlobais = []; let ordemAtual = { coluna: 'codigo', ascendente: true };
let ordemClienteAtual = { coluna: 'nome', ascendente: true };
let listaGlobalAgendamentos = [];

// Declaração explícita de variáveis de filtro
let filtroAgendaAtual = 'Agendado';
let filtroClienteAtual = 'Todos';

async function inicializarSistema() {
    if(localStorage.getItem('essenza_logo')) document.getElementById('logo-img').src = localStorage.getItem('essenza_logo');
    document.getElementById('filtro-data-agenda').value = new Date().toISOString().split('T')[0];
    
    const selectMesNiver = document.getElementById('filtro-mes-aniversario');
    if(selectMesNiver && !selectMesNiver.dataset.initialized) {
        selectMesNiver.value = String(new Date().getMonth() + 1).padStart(2, '0');
        selectMesNiver.dataset.initialized = "true";
    }

    testarLigacao(); await carregarProcedimentos(); carregarEstoque(); carregarListasProdutos(); carregarHistoricoMovimentacoes(); carregarClientes(); carregarProfissionais(); carregarAgenda();
}

async function testarLigacao() {
    const statusDb = document.getElementById('status-db'); const statusDot = document.getElementById('status-dot');
    try {
        const { error } = await clienteSupabase.from('produtos').select('codigo').limit(1);
        statusDot.classList.remove('animate-pulse'); if(error) throw error;
        statusDot.classList.replace('bg-yellow-400', 'bg-emerald-500'); statusDot.classList.replace('shadow-[0_0_8px_rgba(250,204,21,0.6)]', 'shadow-[0_0_8px_rgba(16,185,129,0.6)]');
        statusDb.innerHTML = "Conectado à Base"; statusDb.classList.replace("text-gray-500", "text-emerald-600");
    } catch(e) {
        statusDot.classList.replace('bg-yellow-400', 'bg-red-500'); statusDot.classList.replace('shadow-[0_0_8px_rgba(250,204,21,0.6)]', 'shadow-[0_0_8px_rgba(239,68,68,0.6)]');
        statusDb.innerHTML = "Falha na Conexão"; statusDb.classList.replace("text-gray-500", "text-red-500");
    }
}
// #endregion VARIÁVEIS E INICIALIZAÇÃO

// #region GESTÃO DE TELAS E TEMAS
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
}

function alterarLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('logo-img').src = e.target.result; localStorage.setItem('essenza_logo', e.target.result); };
        reader.readAsDataURL(file);
    }
}

function mudarTela(idTela) {
    document.querySelectorAll('.tela-conteudo').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('bg-nude-50', 'dark:bg-slate-800/50', 'text-nude-700', 'dark:text-nude-300', 'border-nude-100', 'dark:border-slate-700');
        btn.classList.add('text-gray-500', 'dark:text-gray-400', 'border-transparent');
    });
    const telaDestino = document.getElementById('tela-' + idTela); if(telaDestino) telaDestino.classList.remove('hidden');
    const btnAtivo = document.getElementById('btn-' + idTela);
    if(btnAtivo) {
        btnAtivo.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-transparent');
        btnAtivo.classList.add('bg-nude-50', 'dark:bg-slate-800/50', 'text-nude-700', 'dark:text-nude-300', 'border-nude-100', 'dark:border-slate-700');
    }
    
    // Gatilhos de carregamento ao trocar de tela
    if(idTela === 'agenda') carregarAgenda();
    if(idTela === 'compras') renderizarListaCompras();
    if(idTela === 'relatorios') gerarRelatorioFidelizacao();
    if(idTela === 'curva') gerarCurvaABC();
}
// #endregion GESTÃO DE TELAS E TEMAS

// #region UTILIDADES E ALERTAS
function mostrarAlerta(titulo, mensagem, tipo = 'aviso') {
    const modal = document.getElementById('modal-alerta'); const content = document.getElementById('modal-alerta-content'); const icone = document.getElementById('alerta-icone'); const btn = document.getElementById('alerta-btn');
    document.getElementById('alerta-titulo').innerText = titulo; document.getElementById('alerta-mensagem').innerText = mensagem;
    
    if (tipo === 'sucesso') {
        icone.innerHTML = '✨'; icone.className = 'mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 text-4xl';
        btn.className = 'w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-md font-medium transition'; btn.innerText = 'Excelente!';
    } else if (tipo === 'erro') {
        icone.innerHTML = '✖'; icone.className = 'mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 text-4xl font-bold';
        btn.className = 'w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3.5 rounded-xl shadow-md font-medium transition'; btn.innerText = 'Entendi';
    } else {
        icone.innerHTML = '💡'; icone.className = 'mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-nude-50 dark:bg-slate-700/50 text-nude-500 text-4xl';
        btn.className = 'w-full bg-nude-500 hover:bg-nude-600 text-white px-6 py-3.5 rounded-xl shadow-md font-medium transition'; btn.innerText = 'OK';
    }
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
}

function fecharAlerta() {
    const modal = document.getElementById('modal-alerta'); const content = document.getElementById('modal-alerta-content');
    content.classList.remove('scale-100', 'opacity-100'); content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
}

let resolverConfirmacao;
function mostrarConfirmacao(titulo, mensagem) {
    return new Promise((resolve) => {
        document.getElementById('confirmacao-titulo').innerText = titulo; document.getElementById('confirmacao-mensagem').innerText = mensagem;
        const modal = document.getElementById('modal-confirmacao'); const content = document.getElementById('modal-confirmacao-content');
        modal.classList.remove('hidden'); modal.classList.add('flex');
        setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
        resolverConfirmacao = resolve;
    });
}

function responderConfirmacao(resposta) {
    const modal = document.getElementById('modal-confirmacao'); const content = document.getElementById('modal-confirmacao-content');
    content.classList.remove('scale-100', 'opacity-100'); content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); resolverConfirmacao(resposta); }, 300);
}

function setCarregando(idBotao, isLoading, textoOriginal) {
    const btn = document.getElementById(idBotao); if(!btn) return;
    if(isLoading) { 
        btn.disabled = true; 
        btn.dataset.textoOriginal = btn.innerHTML; 
        btn.innerHTML = '<span class="animate-pulse">Aguarde...</span>'; 
        btn.classList.add('opacity-70', 'cursor-not-allowed'); 
    } else { 
        btn.disabled = false; 
        btn.innerHTML = btn.dataset.textoOriginal || textoOriginal; 
        btn.classList.remove('opacity-70', 'cursor-not-allowed'); 
    }
}
// #endregion UTILIDADES E ALERTAS

// #region MÓDULO: SERVIÇOS
function abrirModalServicos() { 
    document.getElementById('modal_novo_servico_nome').value = ''; 
    document.getElementById('modal_novo_servico_valor').value = ''; 
    document.getElementById('modal_novo_servico_tempo').value = ''; 
    document.getElementById('modal-servicos').classList.remove('hidden'); 
    document.getElementById('modal-servicos').classList.add('flex'); 
    carregarProcedimentos(); 
}

function fecharModalServicos() { 
    document.getElementById('modal-servicos').classList.add('hidden'); 
    document.getElementById('modal-servicos').classList.remove('flex'); 
}

async function carregarProcedimentos() {
    const { data } = await clienteSupabase.from('procedimentos').select('*').eq('apagado', false).order('nome');
    if (data) {
        listaGlobalProcedimentos = data;
        
        const formatarOpcao = (p) => {
            const preco = p.valor_base ? ` - R$ ${parseFloat(p.valor_base).toFixed(2)}` : '';
            const tempo = p.tempo_estimado_minutos ? ` (${p.tempo_estimado_minutos} min)` : '';
            return `${p.nome}${preco}${tempo}`;
        };

        const selAgenda = document.getElementById('agenda_servico'); 
        if(selAgenda) { 
            selAgenda.innerHTML = '<option value="">Selecione o Serviço...</option>'; 
            data.forEach(p => selAgenda.innerHTML += `<option value="${p.id}">${formatarOpcao(p)}</option>`); 
        }
        
        const selBaixa = document.getElementById('atendimento_procedimento'); 
        if(selBaixa) { 
            selBaixa.innerHTML = '<option value="">Selecione a opção...</option>'; 
            selBaixa.innerHTML += '<option value="venda_direta" class="font-bold text-emerald-600">🛍️ Venda de Produto (Sem Serviço)</option>';
            data.forEach(p => selBaixa.innerHTML += `<option value="${p.id}">${formatarOpcao(p)}</option>`); 
        }
        
        const ul = document.getElementById('modal_lista_servicos'); 
        if(ul) { 
            ul.innerHTML = ''; 
            data.forEach(p => { 
                const details = `<span class="text-xs text-gray-400 block">R$ ${parseFloat(p.valor_base||0).toFixed(2)} | ${p.tempo_estimado_minutos||60} min</span>`;
                ul.innerHTML += `<li class="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"><div><span class="text-sm font-bold text-gray-700 dark:text-gray-200">${p.nome}</span>${details}</div><button onclick="excluirProcedimento(${p.id}, '${p.nome.replace(/'/g, "\\'")}')" class="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-bold text-xl leading-none transition" title="Excluir">&times;</button></li>`; 
            }); 
        }
    }
}

async function salvarProcedimentoCentral() {
    const nome = document.getElementById('modal_novo_servico_nome').value.trim(); 
    const valor = parseFloat(document.getElementById('modal_novo_servico_valor').value) || 0; 
    const tempo = parseInt(document.getElementById('modal_novo_servico_tempo').value) || 60; 
    
    if(!nome) return mostrarAlerta('Falta algo!', 'Digite o nome do serviço para adicionar.', 'aviso');
    
    setCarregando('btn-modal-add-servico', true, 'Adicionar ao Catálogo');
    try { 
        await clienteSupabase.from('procedimentos').insert([{ nome: nome, valor_base: valor, tempo_estimado_minutos: tempo }]); 
        document.getElementById('modal_novo_servico_nome').value = ''; 
        document.getElementById('modal_novo_servico_valor').value = ''; 
        document.getElementById('modal_novo_servico_tempo').value = ''; 
        carregarProcedimentos(); 
    } 
    catch(err) { mostrarAlerta('Erro', 'Houve um problema ao salvar serviço.', 'erro'); } 
    finally { setCarregando('btn-modal-add-servico', false, 'Adicionar ao Catálogo'); }
}

async function excluirProcedimento(id, nome) { const conf = await mostrarConfirmacao("Excluir Serviço", `Apagar o serviço "${nome}" definitivamente?`); if(!conf) return; await clienteSupabase.from('procedimentos').update({ apagado: true }).eq('id', id); carregarProcedimentos(); }
// #endregion MÓDULO: SERVIÇOS

// #region MÓDULO: CLIENTES E WHATSAPP
function alterarFiltroCliente(status) {
    filtroClienteAtual = status; 
    const btnTodos = document.getElementById('btn-filtro-cli-todos'); 
    const btnNiver = document.getElementById('btn-filtro-cli-aniversarios');
    const selectMes = document.getElementById('filtro-mes-aniversario');

    if(status === 'Todos') { 
        btnTodos.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all"; 
        btnNiver.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all flex items-center gap-2"; 
        selectMes.classList.add('hidden');
    } else { 
        btnNiver.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all flex items-center gap-2"; 
        btnTodos.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all"; 
        selectMes.classList.remove('hidden');
    }
    renderizarListaClientes();
}

async function carregarClientes() { 
    const tbody = document.getElementById('tabela-clientes');
    if(tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-gray-400 font-medium animate-pulse">A carregar clientes...</td></tr>';
    
    const { data } = await clienteSupabase.from('clientes').select('*').eq('apagado', false); 
    if(data) { 
        listaGlobalClientes = data; 
        ordenarClientes('nome', true); 
    } 
}

function ordenarClientes(coluna, forcarAscendente = null) {
    if (forcarAscendente !== null) ordemClienteAtual.ascendente = forcarAscendente; 
    else { if (ordemClienteAtual.coluna === coluna) ordemClienteAtual.ascendente = !ordemClienteAtual.ascendente; else ordemClienteAtual.ascendente = true; }
    ordemClienteAtual.coluna = coluna;

    listaGlobalClientes.sort((a, b) => { 
        let valorA = a[coluna] ? a[coluna].toString().toLowerCase() : ''; 
        let valorB = b[coluna] ? b[coluna].toString().toLowerCase() : ''; 
        if (valorA < valorB) return ordemClienteAtual.ascendente ? -1 : 1; 
        if (valorA > valorB) return ordemClienteAtual.ascendente ? 1 : -1; 
        return 0; 
    });

    document.querySelectorAll('[id^="icone-ordem-cli-"]').forEach(icone => icone.innerHTML = ''); 
    const iconeAtivo = document.getElementById('icone-ordem-cli-' + coluna); 
    if (iconeAtivo) iconeAtivo.innerHTML = ordemClienteAtual.ascendente ? '↑' : '↓'; 
    
    renderizarListaClientes();
}

function renderizarListaClientes() {
    const tbody = document.getElementById('tabela-clientes'); 
    const avisoSemNiver = document.getElementById('aviso-sem-aniversario'); 
    if(!tbody) return; tbody.innerHTML = '';
    
    const mesReal = String(new Date().getMonth() + 1).padStart(2, '0');
    const mesSelecionado = document.getElementById('filtro-mes-aniversario').value; 
    const termoBusca = document.getElementById('busca-cliente').value.toLowerCase();
    let temAniversariantes = false;

    listaGlobalClientes.forEach(c => {
        if (termoBusca && !(`${c.nome} ${c.telefone}`.toLowerCase().includes(termoBusca))) return;

        let isAniversario = false; let dataFormatada = '-'; 
        if(c.data_nascimento) { 
            const [ano, mes, dia] = c.data_nascimento.split('-'); 
            dataFormatada = `${dia}/${mes}/${ano}`; 
            
            if (filtroClienteAtual === 'Todos') {
                if (mes === mesReal) isAniversario = true;
            } else {
                if (mes === mesSelecionado) isAniversario = true;
            }
        }

        if(filtroClienteAtual === 'Aniversariantes' && !isAniversario) return; 
        if(isAniversario) temAniversariantes = true;

        let btnAcoes = `
            <button onclick="abrirModalEditarCliente(${c.id}, '${c.nome.replace(/'/g, "\\'")}', '${c.telefone || ''}', '${c.data_nascimento || ''}')" class="text-blue-400 hover:text-blue-600 font-bold text-lg transition mr-2" title="Editar">✏️</button>
            <button onclick="apagarSimples('clientes', ${c.id}, '${c.nome.replace(/'/g, "\\'")}')" class="text-gray-300 hover:text-red-500 font-bold text-xl transition" title="Excluir">&times;</button>
        `;
        
        if(filtroClienteAtual === 'Aniversariantes') {
            btnAcoes = `<button onclick="enviarWhatsappAniversario('${c.nome.replace(/'/g, "\\'")}', '${c.telefone}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1 mx-auto">💬 Enviar Cupom</button>`;
        }

        tbody.innerHTML += `<tr class="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 border-b border-gray-100/50 dark:border-slate-700/50"><td class="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">${c.nome} ${isAniversario ? '🎂' : ''}</td><td class="px-6 py-4 text-sm text-gray-500">${c.telefone || '-'}</td><td class="px-6 py-4 text-sm text-gray-500">${dataFormatada}</td><td class="px-6 py-4 text-center">${btnAcoes}</td></tr>`;
    });
    
    if(filtroClienteAtual === 'Aniversariantes' && !temAniversariantes) avisoSemNiver.classList.remove('hidden'); else avisoSemNiver.classList.add('hidden');
}

function enviarWhatsappAniversario(nome, telefone) {
    if(!telefone || telefone === 'null') return mostrarAlerta('Falta Telefone', 'Este cliente não tem telefone cadastrado.', 'aviso');
    const msg = `Olá ${nome}! 🎉\n\nAqui é do Studio Essenza. Vimos que o seu aniversário está chegando! 🎂\n\nPara comemorar com você, preparamos um presente especial: um cupom de desconto exclusivo! ✨\n\nGostaria de agendar um horário para ficar ainda mais maravilhosa no seu dia?`;
    const telLimpo = telefone.replace(/\D/g, ''); 
    const link = `https://api.whatsapp.com/send?phone=55${telLimpo}&text=${encodeURIComponent(msg)}`; 
    window.open(link, '_blank');
}

function abrirModalCliente() {
    document.getElementById('formSimples').reset(); document.getElementById('modal-simples-tipo').value = 'cliente'; 
    document.getElementById('modal-simples-titulo').innerText = 'Novo Cliente'; document.getElementById('simples_label_extra').innerText = 'Telefone (Apenas números)'; 
    document.getElementById('simples_extra').placeholder = 'Ex: 11999999999'; document.getElementById('container-simples-data').classList.remove('hidden'); 
    document.getElementById('modal-cadastro-simples').classList.remove('hidden'); document.getElementById('modal-cadastro-simples').classList.add('flex');
}

function abrirModalEditarCliente(id, nome, telefone, data_nasc) {
    document.getElementById('edit_cli_id').value = id;
    document.getElementById('edit_cli_nome').value = nome;
    document.getElementById('edit_cli_telefone').value = telefone === 'null' || telefone === 'undefined' ? '' : telefone;
    document.getElementById('edit_cli_data_nasc').value = data_nasc === 'null' || data_nasc === 'undefined' ? '' : data_nasc;
    document.getElementById('modal-editar-cliente').classList.remove('hidden'); document.getElementById('modal-editar-cliente').classList.add('flex');
}

function fecharModalEditarCliente() { document.getElementById('modal-editar-cliente').classList.add('hidden'); document.getElementById('modal-editar-cliente').classList.remove('flex'); }
// #endregion MÓDULO: CLIENTES E WHATSAPP

// #region MÓDULO: EQUIPE E PROFISSIONAIS
function abrirModalProfissional() {
    document.getElementById('formSimples').reset(); document.getElementById('modal-simples-tipo').value = 'profissional'; 
    document.getElementById('modal-simples-titulo').innerText = 'Novo Profissional'; document.getElementById('simples_label_extra').innerText = 'Especialidade'; 
    document.getElementById('simples_extra').placeholder = 'Ex: Cabelo, Unhas'; document.getElementById('container-simples-data').classList.add('hidden'); 
    document.getElementById('modal-cadastro-simples').classList.remove('hidden'); document.getElementById('modal-cadastro-simples').classList.add('flex');
}

function fecharModalSimples() { document.getElementById('modal-cadastro-simples').classList.add('hidden'); document.getElementById('modal-cadastro-simples').classList.remove('flex'); }

async function carregarProfissionais() {
    const tbody = document.getElementById('tabela-equipe');
    if(tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-10 text-gray-400 font-medium animate-pulse">A carregar equipa...</td></tr>';

    const { data } = await clienteSupabase.from('profissionais').select('*').eq('apagado', false).order('nome');
    if(data) {
        listaGlobalProfissionais = data; 
        if(tbody) {
            tbody.innerHTML = '';
            data.forEach(p => { tbody.innerHTML += `<tr class="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 border-b border-gray-100/50 dark:border-slate-700/50"><td class="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">${p.nome}</td><td class="px-6 py-4 text-sm text-gray-500"><span class="bg-nude-50 dark:bg-slate-700 text-nude-600 dark:text-nude-300 px-3 py-1 rounded-full text-xs font-bold">${p.especialidade || 'Geral'}</span></td><td class="px-6 py-4 text-center"><button onclick="apagarSimples('profissionais', ${p.id}, '${p.nome.replace(/'/g, "\\'")}')" class="text-gray-300 hover:text-red-500 font-bold text-xl">&times;</button></td></tr>`; });
        }
    }
}

async function apagarSimples(tabela, id, nome) { const conf = await mostrarConfirmacao("Remover", `Apagar permanentemente "${nome}"?`); if(!conf) return; try { await clienteSupabase.from(tabela).update({ apagado: true }).eq('id', id); if(tabela === 'clientes') carregarClientes(); else carregarProfissionais(); } catch(e) { mostrarAlerta('Erro', 'Ocorreu um erro ao excluir.', 'erro'); } }
// #endregion MÓDULO: EQUIPE E PROFISSIONAIS

// #region MÓDULO: AGENDA E EXPORTAÇÃO
function alterarFiltroAgenda(status) {
    filtroAgendaAtual = status; const btnPendente = document.getElementById('btn-filtro-pendente'); const btnFinalizado = document.getElementById('btn-filtro-finalizado');
    if(status === 'Agendado') {
        btnPendente.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all";
        btnFinalizado.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all";
    } else {
        btnFinalizado.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all";
        btnPendente.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all";
    }
    carregarAgenda();
}

async function exportarFechamentoDia() {
    const dataEscolhida = document.getElementById('filtro-data-agenda').value; if(!dataEscolhida) return mostrarAlerta('Atenção', 'Selecione uma data para o fechamento.', 'aviso');
    setCarregando('btn-fechamento', true, '<span>📊</span> Fechamento');
    try {
        const inicioDia = `${dataEscolhida}T00:00:00`; const fimDia = `${dataEscolhida}T23:59:59`;
        const { data, error } = await clienteSupabase.from('agendamentos').select('data_hora, valor, desconto_valor, desconto_motivo, servicos_adicionais, clientes(nome), profissionais(nome), procedimentos(nome, valor_base)').eq('apagado', false).eq('status', 'Concluído').gte('data_hora', inicioDia).lte('data_hora', fimDia).order('data_hora', { ascending: true });
        if(error) throw error; if(!data || data.length === 0) return mostrarAlerta('Caixa Vazio', 'Não há procedimentos concluídos nesta data para exportar.', 'aviso');

        let csvContent = '\uFEFF'; csvContent += "Horário;Cliente;Procedimentos;Profissional;Valor Base (R$);Desconto (R$);Motivo Desconto;Valor Cobrado (R$)\n";
        let totalCaixa = 0; let totalDescontos = 0;

        data.forEach(ag => {
            const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}); const cliente = ag.clientes ? ag.clientes.nome : '-'; 
            const procedimentoBase = ag.procedimentos ? ag.procedimentos.nome : '-';
            const procedimentosFinais = ag.servicos_adicionais ? `${procedimentoBase} + ${ag.servicos_adicionais}` : procedimentoBase;
            const prof = ag.profissionais ? ag.profissionais.nome : '-';
            const valorBase = ag.procedimentos && ag.procedimentos.valor_base ? parseFloat(ag.procedimentos.valor_base) : 0; const desconto = ag.desconto_valor ? parseFloat(ag.desconto_valor) : 0; const motivoDesc = ag.desconto_motivo || '-'; const valorCobrado = ag.valor ? parseFloat(ag.valor) : 0;
            totalCaixa += valorCobrado; totalDescontos += desconto;
            csvContent += `${hora};${cliente};${procedimentosFinais};${prof};${valorBase.toFixed(2).replace('.', ',')};${desconto.toFixed(2).replace('.', ',')};${motivoDesc};${valorCobrado.toFixed(2).replace('.', ',')}\n`;
        });

        csvContent += `\nTOTAL DO DIA;;;;;R$ ${totalDescontos.toFixed(2).replace('.', ',')};;R$ ${totalCaixa.toFixed(2).replace('.', ',')}\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url);
        const dataFormatada = dataEscolhida.split('-').reverse().join('-'); link.setAttribute("download", `Fechamento_Essenza_${dataFormatada}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        mostrarAlerta('Sucesso!', 'Relatório baixado com sucesso!', 'sucesso');
    } catch (err) { mostrarAlerta('Erro', 'Ocorreu um erro ao gerar o relatório.', 'erro'); } 
    finally { setCarregando('btn-fechamento', false, '<span>📊</span> Fechamento'); }
}

function abrirModalAgendamento() {
    document.getElementById('formAgendamento').reset(); document.getElementById('toggle-novo-cliente').checked = false; alternarModoCliente(); document.getElementById('toggle-novo-profissional').checked = false; alternarModoProfissional();
    const selCliente = document.getElementById('agenda_cliente_existente'); selCliente.innerHTML = '<option value="">Selecione o Cliente...</option>'; listaGlobalClientes.forEach(c => selCliente.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    const selProf = document.getElementById('agenda_profissional_existente'); selProf.innerHTML = '<option value="">Selecione o Profissional...</option>'; listaGlobalProfissionais.forEach(p => selProf.innerHTML += `<option value="${p.id}">${p.nome} (${p.especialidade || 'Geral'})</option>`);
    const dataFiltro = document.getElementById('filtro-data-agenda').value; if(dataFiltro) document.getElementById('agenda_data').value = dataFiltro;
    document.getElementById('modal-agendamento').classList.remove('hidden'); document.getElementById('modal-agendamento').classList.add('flex');
}

function fecharModalAgendamento() { document.getElementById('modal-agendamento').classList.add('hidden'); document.getElementById('modal-agendamento').classList.remove('flex'); }

function alternarModoCliente() { const isNovo = document.getElementById('toggle-novo-cliente').checked; if(isNovo) { document.getElementById('agenda_cliente_existente').classList.add('hidden'); document.getElementById('agenda_cliente_existente').required = false; document.getElementById('agenda_campos_novo_cliente').classList.remove('hidden'); document.getElementById('agenda_novo_nome').required = true; } else { document.getElementById('agenda_cliente_existente').classList.remove('hidden'); document.getElementById('agenda_cliente_existente').required = true; document.getElementById('agenda_campos_novo_cliente').classList.add('hidden'); document.getElementById('agenda_novo_nome').required = false; } }
function alternarModoProfissional() { const isNovo = document.getElementById('toggle-novo-profissional').checked; if(isNovo) { document.getElementById('agenda_profissional_existente').classList.add('hidden'); document.getElementById('agenda_profissional_existente').required = false; document.getElementById('agenda_campos_novo_profissional').classList.remove('hidden'); document.getElementById('agenda_novo_prof_nome').required = true; } else { document.getElementById('agenda_profissional_existente').classList.remove('hidden'); document.getElementById('agenda_profissional_existente').required = true; document.getElementById('agenda_campos_novo_profissional').classList.add('hidden'); document.getElementById('agenda_novo_prof_nome').required = false; } }

async function carregarAgenda() {
    const dataEscolhida = document.getElementById('filtro-data-agenda').value; if(!dataEscolhida) return;
    const inicioDia = `${dataEscolhida}T00:00:00`; const fimDia = `${dataEscolhida}T23:59:59`;
    
    const container = document.getElementById('container-agenda'); const avisoVazio = document.getElementById('agenda-vazia'); 
    
    avisoVazio.classList.add('hidden');
    container.innerHTML = '<div class="w-full text-center py-20 flex flex-col items-center justify-center"><div class="w-10 h-10 border-4 border-nude-200 border-t-nude-600 rounded-full animate-spin mb-4"></div><p class="text-gray-400 font-medium animate-pulse">A carregar dados da agenda...</p></div>';

    let query = clienteSupabase.from('agendamentos').select('id, data_hora, status, valor, desconto_valor, desconto_motivo, servicos_adicionais, clientes(nome, telefone, data_nascimento), profissionais(nome), procedimentos(nome, valor_base, tempo_estimado_minutos)').eq('apagado', false).gte('data_hora', inicioDia).lte('data_hora', fimDia).order('data_hora', { ascending: true });
    if(filtroAgendaAtual === 'Agendado') query = query.eq('status', 'Agendado'); else query = query.in('status', ['Concluído', 'Cancelado']);

    const { data, error } = await query;
    container.innerHTML = ''; 

    if(error || !data || data.length === 0) { 
        avisoVazio.classList.remove('hidden'); 
    } else {
        avisoVazio.classList.add('hidden'); const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
        listaGlobalAgendamentos = data;

        const agendaPorProfissional = {};
        data.forEach(ag => {
            const profNome = ag.profissionais ? ag.profissionais.nome : 'Sem Profissional';
            if(!agendaPorProfissional[profNome]) agendaPorProfissional[profNome] = [];
            agendaPorProfissional[profNome].push(ag);
        });

        Object.keys(agendaPorProfissional).sort().forEach(profNome => {
            let colunaHTML = `
                <div class="min-w-[320px] max-w-[320px] bg-gray-50/50 dark:bg-slate-800/30 rounded-[2rem] p-5 border border-gray-100 dark:border-slate-700/50 flex flex-col h-max">
                    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
                        <div class="w-10 h-10 rounded-full bg-nude-100 dark:bg-slate-700 flex items-center justify-center text-xl shadow-inner">✂️</div>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white truncate">${profNome}</h3>
                        <span class="ml-auto bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">${agendaPorProfissional[profNome].length}</span>
                    </div>
                    <div class="space-y-4">
            `;

            agendaPorProfissional[profNome].forEach(ag => {
                const horaFormatada = new Date(ag.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                let corCard = 'bg-white border-gray-100 dark:border-slate-700'; let corHora = 'text-nude-500 bg-nude-50 dark:bg-slate-900';
                
                let infoValor = '';
                if(ag.desconto_valor && ag.desconto_valor > 0) infoValor = ` <span class="text-emerald-500 ml-1">(R$ ${parseFloat(ag.valor).toFixed(2)} - Desc.)</span>`;
                else if(ag.valor) infoValor = ` <span class="text-gray-500 ml-1">(R$ ${parseFloat(ag.valor).toFixed(2)})</span>`;

                let badgeStatus = `<span class="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-500 uppercase tracking-widest">Agendado</span>`;
                if(ag.status === 'Concluído') { corCard = 'bg-gray-50 opacity-70'; corHora = 'text-emerald-500 bg-emerald-50'; badgeStatus = `<span class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-600 uppercase tracking-widest flex items-center">Concluído ${infoValor}</span>`; } 
                else if (ag.status === 'Cancelado') { corCard = 'bg-red-50/30 opacity-50'; corHora = 'text-red-400 bg-red-50'; badgeStatus = `<span class="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-500 uppercase tracking-widest">Cancelado</span>`; }

                let badgeAniversario = '';
                if (ag.clientes && ag.clientes.data_nascimento) { const [ano, mesNasc, diaNasc] = ag.clientes.data_nascimento.split('-'); if (mesNasc === mesAtual) badgeAniversario = `<span title="Aniversariante do Mês!" class="ml-1 text-base cursor-help animate-bounce inline-block">🎂</span>`; }

                const valorBaseSafe = ag.procedimentos && ag.procedimentos.valor_base ? parseFloat(ag.procedimentos.valor_base) : 0;
                const nomePrincipal = ag.procedimentos ? ag.procedimentos.nome : '-';
                const servicosDisplay = ag.servicos_adicionais ? `${nomePrincipal} <span class="text-[10px] text-purple-500 font-bold block">+ ${ag.servicos_adicionais}</span>` : nomePrincipal;

                colunaHTML += `
                    <div class="${corCard} p-4 rounded-2xl border shadow-sm dark:bg-slate-800 transition-all flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-3">
                                <div class="${corHora} font-bold text-lg px-3 py-1 rounded-xl shadow-inner">${horaFormatada}</div>
                                ${badgeStatus}
                            </div>
                            <h4 class="font-bold text-gray-800 dark:text-white text-base mb-1 flex items-center">${ag.clientes ? ag.clientes.nome : 'Desconhecido'} ${badgeAniversario}</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400"><span>✨</span> ${servicosDisplay}</p>
                        </div>
                        ${ag.status === 'Agendado' ? `
                        <div class="mt-4 flex gap-2 border-t border-gray-100 dark:border-slate-700 pt-3">
                            <button onclick="abrirModalFinalizarAgendamento(${ag.id}, '${ag.clientes ? ag.clientes.nome.replace(/'/g, "\\'") : 'Cliente'}', '${ag.procedimentos ? ag.procedimentos.nome.replace(/'/g, "\\'") : 'Serviço'}', ${valorBaseSafe})" class="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2 rounded-xl text-xs font-semibold transition shadow-sm">✓ Concluir</button>
                            <button onclick="mudarStatusAgenda(${ag.id}, 'Cancelado')" class="flex-none bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-xl text-xs font-semibold transition" title="Cancelar">✕</button>
                        </div>
                        ` : `
                        <div class="mt-4 border-t border-gray-100 dark:border-slate-700 pt-3 flex gap-2">
                            <button onclick="abrirModalDetalhesAgendamento(${ag.id})" class="flex-1 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 py-2 rounded-xl text-xs font-semibold transition shadow-sm">Ver Detalhes</button>
                        </div>
                        `}
                    </div>
                `;
            });
            colunaHTML += `</div></div>`; container.innerHTML += colunaHTML;
        });
    }
}

async function mudarStatusAgenda(id, novoStatus) {
    if(novoStatus === 'Cancelado') { const conf = await mostrarConfirmacao("Cancelar Agendamento", "Tem certeza que deseja cancelar este horário?"); if(!conf) return; }
    await clienteSupabase.from('agendamentos').update({ status: novoStatus }).eq('id', id); carregarAgenda();
}

function abrirModalDetalhesAgendamento(id) {
    const ag = listaGlobalAgendamentos.find(item => item.id === id);
    if(!ag) return;

    const dataObj = new Date(ag.data_hora);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    
    document.getElementById('detalhe_cliente').innerText = ag.clientes ? ag.clientes.nome : 'Desconhecido';
    document.getElementById('detalhe_profissional').innerText = ag.profissionais ? ag.profissionais.nome : '-';
    document.getElementById('detalhe_datahora').innerText = `${dataFormatada} às ${horaFormatada}`;
    
    const servPrincipal = ag.procedimentos ? ag.procedimentos.nome : '-';
    const servAdicionais = ag.servicos_adicionais ? `<br><span class="text-[10px] text-purple-500 font-bold uppercase tracking-widest">+ Extras: ${ag.servicos_adicionais}</span>` : '';
    document.getElementById('detalhe_servico').innerHTML = servPrincipal + servAdicionais;
    
    const valorFinal = ag.valor ? parseFloat(ag.valor) : 0;
    const desconto = ag.desconto_valor ? parseFloat(ag.desconto_valor) : 0;
    
    document.getElementById('detalhe_valor_final').innerText = `R$ ${valorFinal.toFixed(2).replace('.', ',')}`;
    
    if(desconto > 0) {
        document.getElementById('detalhe_desconto').innerText = `R$ ${desconto.toFixed(2).replace('.', ',')}`;
        if(ag.desconto_motivo) {
            document.getElementById('container_motivo_desconto').classList.remove('hidden');
            document.getElementById('detalhe_motivo_desconto').innerText = ag.desconto_motivo;
        } else { document.getElementById('container_motivo_desconto').classList.add('hidden'); }
    } else {
        document.getElementById('detalhe_desconto').innerText = '-';
        document.getElementById('container_motivo_desconto').classList.add('hidden');
    }

    document.getElementById('modal-detalhes-agendamento').classList.remove('hidden'); document.getElementById('modal-detalhes-agendamento').classList.add('flex');
}

function fecharModalDetalhesAgendamento() { document.getElementById('modal-detalhes-agendamento').classList.add('hidden'); document.getElementById('modal-detalhes-agendamento').classList.remove('flex'); }

function abrirModalFinalizarAgendamento(id, clienteNome, servicoNome, valorBase) {
    document.getElementById('finalizar_id_agendamento').value = id; 
    document.getElementById('finalizar_nome_servico').value = servicoNome; 
    document.getElementById('finalizar_resumo').innerText = `Cliente: ${clienteNome} | Serviço: ${servicoNome}`;
    
    document.getElementById('finalizar_valor_principal_oculto').value = valorBase > 0 ? valorBase : 0;
    document.getElementById('finalizar_desconto').value = ''; 
    document.getElementById('finalizar_motivo_desconto').value = '';
    
    document.getElementById('finalizar_lista_servicos_extras').innerHTML = '';
    atualizarValorBaseFinalizar(); 
    
    document.getElementById('finalizar_lista_consumo').innerHTML = ''; 
    document.getElementById('finalizar_lista_venda').innerHTML = '';
    
    document.getElementById('modal-finalizar-agenda').classList.remove('hidden'); document.getElementById('modal-finalizar-agenda').classList.add('flex');
}

function fecharModalFinalizarAgenda() { document.getElementById('modal-finalizar-agenda').classList.add('hidden'); document.getElementById('modal-finalizar-agenda').classList.remove('flex'); }

function adicionarLinhaServicoExtra() {
    const container = document.getElementById('finalizar_lista_servicos_extras'); const div = document.createElement('div'); div.className = "flex gap-2 items-center linha-servico-extra";
    let options = '<option value="">Selecione o serviço extra...</option>'; 
    listaGlobalProcedimentos.forEach(p => {
        const preco = p.valor_base ? ` (+ R$ ${parseFloat(p.valor_base).toFixed(2)})` : '';
        options += `<option value="${p.id}">${p.nome}${preco}</option>`;
    });
    div.innerHTML = `<select class="select-servico-extra flex-1 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 p-2.5 outline-none text-gray-700 dark:text-white text-sm shadow-sm" onchange="atualizarValorBaseFinalizar()">${options}</select><button type="button" onclick="this.parentElement.remove(); atualizarValorBaseFinalizar();" class="text-gray-400 hover:text-red-500 font-bold px-2 text-lg">&times;</button>`;
    container.appendChild(div);
}

function atualizarValorBaseFinalizar() {
    let totalBase = parseFloat(document.getElementById('finalizar_valor_principal_oculto').value) || 0;
    const selectsExtras = document.querySelectorAll('.select-servico-extra');
    selectsExtras.forEach(sel => {
        if(sel.value) {
            const proc = listaGlobalProcedimentos.find(p => p.id == sel.value);
            if(proc && proc.valor_base) totalBase += parseFloat(proc.valor_base);
        }
    });
    document.getElementById('finalizar_valor_base').value = totalBase.toFixed(2);
    calcularValorFinalCheckout();
}

function calcularValorFinalCheckout() {
    const base = parseFloat(document.getElementById('finalizar_valor_base').value) || 0; 
    const desc = parseFloat(document.getElementById('finalizar_desconto').value) || 0; 
    const final = Math.max(0, base - desc);
    document.getElementById('finalizar_valor_final_display').innerText = final.toFixed(2).replace('.', ','); 
    document.getElementById('finalizar_valor_final_calculado').value = final;
}

function adicionarLinhaConsumoFinalizar() {
    const container = document.getElementById('finalizar_lista_consumo'); const div = document.createElement('div'); div.className = "flex gap-2 items-center linha-consumo";
    let options = '<option value="">Produto consumido...</option>'; listaGlobalProdutos.forEach(p => options += `<option value="${p.codigo}">${p.nome} (Estoque: ${parseFloat(p.estoque_atual)})</option>`);
    div.innerHTML = `<select class="select-produto flex-1 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2.5 outline-none text-gray-700 dark:text-white text-sm shadow-sm">${options}</select><input type="number" step="0.01" min="0.01" placeholder="Qtd" class="input-qtd w-20 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2.5 text-center outline-none text-gray-700 dark:text-white shadow-sm"><button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 font-bold px-1">&times;</button>`;
    container.appendChild(div);
}
function adicionarLinhaVendaFinalizar() {
    const container = document.getElementById('finalizar_lista_venda'); const div = document.createElement('div'); div.className = "flex gap-2 items-center linha-venda";
    let options = '<option value="">Produto vendido...</option>'; listaGlobalProdutos.forEach(p => options += `<option value="${p.codigo}">${p.nome} (Estoque: ${parseFloat(p.estoque_atual)})</option>`);
    div.innerHTML = `<select class="select-produto flex-1 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2.5 outline-none text-gray-700 dark:text-white text-sm shadow-sm">${options}</select><input type="number" step="0.01" min="0.01" placeholder="Qtd" class="input-qtd w-20 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2.5 text-center outline-none text-gray-700 dark:text-white shadow-sm"><button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 font-bold px-1">&times;</button>`;
    container.appendChild(div);
}

async function salvarFinalizacaoAgendamento() {
    const idAgendamento = document.getElementById('finalizar_id_agendamento').value; 
    const nomeServicoPrincipal = document.getElementById('finalizar_nome_servico').value;
    
    const valorCalculadoStr = document.getElementById('finalizar_valor_final_calculado').value; const valorFinal = valorCalculadoStr ? parseFloat(valorCalculadoStr) : 0;
    const descontoDigitado = document.getElementById('finalizar_desconto').value; const valorDesconto = descontoDigitado ? parseFloat(descontoDigitado) : 0; 
    const motivoDesconto = document.getElementById('finalizar_motivo_desconto').value.trim();
    
    const selectsExtras = document.querySelectorAll('.select-servico-extra');
    let arrayExtras = [];
    selectsExtras.forEach(sel => {
        if(sel.value) { arrayExtras.push(sel.options[sel.selectedIndex].text.split(' - R$')[0]); }
    });
    const stringExtrasFinal = arrayExtras.length > 0 ? arrayExtras.join(', ') : null;

    const linhasConsumo = document.querySelectorAll('.linha-consumo'); const linhasVenda = document.querySelectorAll('.linha-venda'); const movimentacoesLote = [];
    
    for (let linha of linhasConsumo) {
        const cod = linha.querySelector('.select-produto').value; const qtd = parseFloat(linha.querySelector('.input-qtd').value);
        if (cod && (!qtd || qtd <= 0)) return mostrarAlerta('Atenção', 'Coloque a quantidade no produto consumido.', 'aviso');
        if (cod && qtd > 0) {
            const prodInfo = listaGlobalProdutos.find(p => p.codigo == cod);
            if (prodInfo) { if (prodInfo.estoque_atual == 0) return mostrarAlerta('Sem Estoque', `O produto "${prodInfo.nome}" está zerado.`, 'erro'); else if (qtd > prodInfo.estoque_atual) return mostrarAlerta('Falta Produto', `Falta estoque de "${prodInfo.nome}". Só tem ${parseFloat(prodInfo.estoque_atual)}.`, 'erro'); }
            movimentacoesLote.push({ produto_codigo: cod, tipo: 'Saída', quantidade: qtd, motivo: `Consumo (Agenda): ${nomeServicoPrincipal}` });
        }
    }

    for (let linha of linhasVenda) {
        const cod = linha.querySelector('.select-produto').value; const qtd = parseFloat(linha.querySelector('.input-qtd').value);
        if (cod && (!qtd || qtd <= 0)) return mostrarAlerta('Atenção', 'Coloque a quantidade no produto vendido.', 'aviso');
        if (cod && qtd > 0) {
            const prodInfo = listaGlobalProdutos.find(p => p.codigo == cod);
            if (prodInfo) { if (prodInfo.estoque_atual == 0) return mostrarAlerta('Sem Estoque', `O produto "${prodInfo.nome}" está zerado. Não dá para vender.`, 'erro'); else if (qtd > prodInfo.estoque_atual) return mostrarAlerta('Falta Produto', `Você está vendendo mais do que tem de "${prodInfo.nome}".`, 'erro'); }
            movimentacoesLote.push({ produto_codigo: cod, tipo: 'Saída', quantidade: qtd, motivo: `Venda Extra (Agenda)` });
        }
    }

    setCarregando('btn-salvar-finalizar', true, 'Concluir & Salvar');
    try {
        if (movimentacoesLote.length > 0) { const { error: errMov } = await clienteSupabase.from('movimentacoes').insert(movimentacoesLote); if (errMov) throw new Error("Erro nas movimentações"); }
        
        const { error: errAge } = await clienteSupabase.from('agendamentos').update({ 
            status: 'Concluído', 
            valor: valorFinal, 
            desconto_valor: valorDesconto, 
            desconto_motivo: motivoDesconto || null,
            servicos_adicionais: stringExtrasFinal
        }).eq('id', idAgendamento);
        
        if (errAge) throw new Error("Erro ao atualizar agenda");
        
        fecharModalFinalizarAgenda(); mostrarAlerta("Perfeito!", "Atendimento finalizado com sucesso! Valores e estoque registrados.", "sucesso");
        await carregarEstoque(); await carregarListasProdutos(); carregarHistoricoMovimentacoes(); carregarAgenda(); 
    } catch(err) { mostrarAlerta('Erro', 'Ocorreu um problema ao finalizar o atendimento.', 'erro'); } finally { setCarregando('btn-salvar-finalizar', false, 'Concluir & Salvar'); }
}
// #endregion MÓDULO: AGENDA E EXPORTAÇÃO

// #region MÓDULO: ESTOQUE E PRODUTOS
function abrirModalProduto(origem) {
    document.getElementById('modal-produto').classList.remove('hidden'); document.getElementById('modal-produto').classList.add('flex'); document.getElementById('nome_produto').value = '';
    if (origem === 'painel') { document.getElementById('container-estoque-inicial').classList.remove('hidden'); document.getElementById('aviso-estoque-zero').classList.add('hidden'); document.getElementById('aviso-normal').classList.remove('hidden'); document.getElementById('estoque_inicial').value = ''; } 
    else { document.getElementById('container-estoque-inicial').classList.add('hidden'); document.getElementById('aviso-estoque-zero').classList.remove('hidden'); document.getElementById('aviso-normal').classList.add('hidden'); document.getElementById('estoque_inicial').value = '0'; }
}
function fecharModalProduto() { document.getElementById('modal-produto').classList.add('hidden'); document.getElementById('modal-produto').classList.remove('flex'); document.getElementById('formProduto').reset(); }

async function carregarEstoque() { 
    const tbody = document.getElementById('tabela-estoque');
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-gray-400 font-medium animate-pulse">A carregar stock...</td></tr>';

    const { data } = await clienteSupabase.from('vw_painel_estoque').select('*'); 
    if (data) { 
        dadosEstoqueGlobais = data; 
        ordenarDados('codigo', true); 
        
        // Mantém a Lista de Compras sempre atualizada em tempo real!
        if(typeof renderizarListaCompras === 'function') renderizarListaCompras();
    } 
}

function renderizarListaCompras() {
    const tbody = document.getElementById('tabela-compras');
    const container = document.getElementById('container-compras');
    const avisoVazio = document.getElementById('compras-vazia');
    if(!tbody || !container || !avisoVazio) return; 
    
    tbody.innerHTML = '';
    
    // Filtra apenas produtos com estoque <= 1
    const produtosCriticos = dadosEstoqueGlobais.filter(p => parseFloat(p.estoque_atual) <= 1);
    
    if (produtosCriticos.length === 0) {
        container.classList.add('hidden'); avisoVazio.classList.remove('hidden');
    } else {
        container.classList.remove('hidden'); avisoVazio.classList.add('hidden');
        
        produtosCriticos.forEach(item => {
            let corEstoque = item.estoque_atual == 0 ? 'text-red-600 font-black' : 'text-yellow-600 font-bold';
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50/50 dark:bg-slate-700/30 transition border-b border-gray-100/50 dark:border-slate-700/50">
                    <td class="px-6 py-4 text-sm text-gray-400 font-medium">#${item.codigo}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">${item.nome}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${item.categoria}</td>
                    <td class="px-6 py-4 text-sm text-center text-lg ${corEstoque}">${parseFloat(item.estoque_atual)}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="irParaMovimentacao('${item.codigo}')" class="text-emerald-500 hover:text-emerald-600 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-700 px-4 py-2 rounded-xl transition shadow-sm">
                            + Dar Entrada
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}

function irParaMovimentacao(codigoProduto) {
    mudarTela('movimentacoes');
    document.getElementById('mov_tipo').value = 'Entrada';
    // Aguarda a tela renderizar e foca no produto
    setTimeout(() => {
        document.getElementById('mov_produto').value = codigoProduto;
        document.getElementById('mov_qtd').focus();
    }, 100);
}

function ordenarDados(coluna, forcarAscendente = null) {
    if (forcarAscendente !== null) ordemAtual.ascendente = forcarAscendente; else { if (ordemAtual.coluna === coluna) ordemAtual.ascendente = !ordemAtual.ascendente; else ordemAtual.ascendente = true; }
    ordemAtual.coluna = coluna;
    dadosEstoqueGlobais.sort((a, b) => { let valorA = a[coluna]; let valorB = b[coluna]; if (['codigo', 'estoque_inicial', 'estoque_atual'].includes(coluna)) { valorA = parseFloat(valorA) || 0; valorB = parseFloat(valorB) || 0; } else { valorA = valorA ? valorA.toString().toLowerCase() : ''; valorB = valorB ? valorB.toString().toLowerCase() : ''; } if (valorA < valorB) return ordemAtual.ascendente ? -1 : 1; if (valorA > valorB) return ordemAtual.ascendente ? 1 : -1; return 0; });
    document.querySelectorAll('.icone-ordem').forEach(icone => icone.innerHTML = ''); const iconeAtivo = document.getElementById('icone-ordem-' + coluna); if (iconeAtivo) iconeAtivo.innerHTML = ordemAtual.ascendente ? '↑' : '↓'; renderizarTabelaEstoque();
}

function filtrarEstoque() { renderizarTabelaEstoque(); }
function renderizarTabelaEstoque() {
    const tbody = document.getElementById('tabela-estoque'); tbody.innerHTML = ''; const termo = document.getElementById('busca-estoque').value.toLowerCase();
    dadosEstoqueGlobais.forEach(item => {
        if (termo && !(`${item.codigo} ${item.nome.toLowerCase()} ${item.categoria.toLowerCase()} ${item.status.toLowerCase()}`.includes(termo))) return; 
        let corStatus = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'; 
        if (item.status === 'Repor') corStatus = 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'; 
        if (item.status === 'Esgotado') corStatus = 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'; 
        tbody.innerHTML += `<tr class="hover:bg-gray-50/50 dark:bg-slate-700/30 transition border-b border-gray-100/50 dark:border-slate-700/50"><td class="px-6 py-4 text-sm text-gray-400 font-medium">#${item.codigo}</td><td class="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">${item.nome}</td><td class="px-6 py-4 text-sm text-gray-500">${item.categoria}</td><td class="px-6 py-4 text-sm text-center text-gray-400">${parseFloat(item.estoque_inicial)}</td><td class="px-6 py-4 text-sm text-center font-bold text-gray-800 dark:text-white text-base">${parseFloat(item.estoque_atual)}</td><td class="px-6 py-4 text-center"><span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full shadow-sm ${corStatus}">${item.status}</span></td><td class="px-6 py-4 text-center"><button onclick="excluirProduto('${item.codigo}', '${item.nome.replace(/'/g, "\\'")}')" class="text-gray-300 hover:text-red-500 p-2 rounded-full font-bold">&times;</button></td></tr>`;
    });
}
async function excluirProduto(codigo, nome) { const desejaApagar = await mostrarConfirmacao("Remover Produto", `Apagar "${nome}" do catálogo?`); if(!desejaApagar) return; try { await clienteSupabase.from('produtos').update({ apagado: true }).eq('codigo', codigo); await carregarEstoque(); await carregarListasProdutos(); document.getElementById('lista-produtos-gastos').innerHTML = ''; adicionarLinhaProdutoAvulso(); mostrarAlerta('Removido', 'Produto excluído.', 'sucesso'); } catch(err) { mostrarAlerta('Erro', 'Não foi possível excluir.', 'erro'); } }

async function carregarListasProdutos() {
    const { data } = await clienteSupabase.from('vw_painel_estoque').select('codigo, nome, estoque_atual').order('nome');
    if (data) { 
        listaGlobalProdutos = data; 
        
        const selectMov = document.getElementById('mov_produto'); 
        if(selectMov) {
            const valorAtualMov = selectMov.value;
            selectMov.innerHTML = '<option value="">Selecione o produto...</option>'; 
            data.forEach(p => selectMov.innerHTML += `<option value="${p.codigo}">${p.nome} (Disp: ${parseFloat(p.estoque_atual)})</option>`);
            selectMov.value = valorAtualMov; 
        }
        
        const dropdownsDinamicos = document.querySelectorAll('.select-produto');
        dropdownsDinamicos.forEach(select => {
            const valorAtual = select.value; 
            let placeholder = '<option value="">Selecione o produto...</option>';
            if(select.closest('#finalizar_lista_venda')) placeholder = '<option value="">Produto vendido...</option>';
            else if(select.closest('#finalizar_lista_consumo') || select.closest('#lista-produtos-gastos') || select.closest('#finalizar_lista_servicos_extras')) placeholder = '<option value="">Produto consumido...</option>';
            let options = placeholder; 
            data.forEach(p => options += `<option value="${p.codigo}">${p.nome} (Disp: ${parseFloat(p.estoque_atual)})</option>`);
            
            if(!select.classList.contains('select-servico-extra')) {
                select.innerHTML = options; select.value = valorAtual; 
            }
        });

        const cxAvulso = document.getElementById('lista-produtos-gastos');
        if (cxAvulso && cxAvulso.children.length === 0) {
            adicionarLinhaProdutoAvulso(); 
        }
    }
}
// #endregion MÓDULO: ESTOQUE E PRODUTOS

// #region MÓDULO: CAIXA AVULSO E MOVIMENTAÇÕES
function adicionarLinhaProdutoAvulso() {
    const container = document.getElementById('lista-produtos-gastos'); const div = document.createElement('div'); div.className = "flex gap-3 items-center linha-produto";
    let options = '<option value="">Produto consumido...</option>'; listaGlobalProdutos.forEach(p => options += `<option value="${p.codigo}">${p.nome} (Disp: ${parseFloat(p.estoque_atual)})</option>`);
    div.innerHTML = `<select class="select-produto flex-1 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 outline-none text-gray-700 dark:text-white text-sm shadow-sm">${options}</select><input type="number" step="0.01" min="0.01" placeholder="Qtd" class="input-qtd w-24 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 text-center outline-none text-gray-700 dark:text-white shadow-sm"><button type="button" onclick="this.parentElement.remove()" class="text-gray-300 hover:text-red-500 rounded-full h-8 w-8 font-bold text-2xl pb-1">&times;</button>`;
    container.appendChild(div);
}

async function salvarAtendimentoAvulso() {
    const selectProc = document.getElementById('atendimento_procedimento'); if (!selectProc.value) return mostrarAlerta('Falta algo!', 'Selecione o procedimento ou a Venda.', 'aviso');
    
    let nomeProc = selectProc.options[selectProc.selectedIndex].text.split(' - R$')[0]; 
    if(selectProc.value === 'venda_direta') nomeProc = 'Venda Direta de Produto';

    const obs = document.getElementById('atendimento_obs').value; const motivoFinal = `Caixa Avulso: ${nomeProc}` + (obs ? ` (${obs})` : '');
    const linhas = document.querySelectorAll('#lista-produtos-gastos .linha-produto'); const movimentacoesLote = [];
    for (let linha of linhas) {
        const cod = linha.querySelector('.select-produto').value; const qtd = parseFloat(linha.querySelector('.input-qtd').value);
        if (cod && (!qtd || qtd <= 0)) return mostrarAlerta('Atenção', 'Esqueceu a quantidade.', 'aviso');
        if (cod && qtd > 0) {
            const prodInfo = listaGlobalProdutos.find(p => p.codigo == cod);
            if (prodInfo && prodInfo.estoque_atual == 0) return mostrarAlerta('Zerado', `O produto "${prodInfo.nome}" está zerado.`, 'erro');
            if (prodInfo && qtd > prodInfo.estoque_atual) return mostrarAlerta('Falta', `Sem estoque suficiente de "${prodInfo.nome}".`, 'erro');
            movimentacoesLote.push({ produto_codigo: cod, tipo: 'Saída', quantidade: qtd, motivo: motivoFinal });
        }
    }
    if (movimentacoesLote.length === 0 && selectProc.value !== 'venda_direta') return mostrarAlerta('Atenção', 'Insira pelo menos um produto.', 'aviso');
    setCarregando('btn-finalizar-avulso', true, 'Descontar do Estoque');
    try { if(movimentacoesLote.length > 0) { await clienteSupabase.from('movimentacoes').insert(movimentacoesLote); } mostrarAlerta("Lindo!", "Baixa registrada!", "sucesso"); document.getElementById('atendimento_procedimento').value = ''; document.getElementById('atendimento_obs').value = ''; document.getElementById('lista-produtos-gastos').innerHTML = ''; await carregarEstoque(); await carregarListasProdutos(); document.getElementById('lista-produtos-gastos').innerHTML = ''; adicionarLinhaProdutoAvulso(); carregarHistoricoMovimentacoes(); } 
    catch(err) { mostrarAlerta('Erro', 'Erro ao finalizar.', 'erro'); } finally { setCarregando('btn-finalizar-avulso', false, 'Descontar do Estoque'); }
}

document.getElementById('formMovimentacao').addEventListener('submit', async function(e) {
    e.preventDefault(); const cod = document.getElementById('mov_produto').value; const tipo = document.getElementById('mov_tipo').value; const qtd = parseFloat(document.getElementById('mov_qtd').value); const motivo = document.getElementById('mov_motivo').value.trim();
    if(!cod || !qtd || !motivo) return mostrarAlerta('Atenção', 'Preencha todos os campos.', 'aviso');
    if (tipo === 'Saída') { const prodInfo = listaGlobalProdutos.find(p => p.codigo == cod); if (prodInfo) { if (prodInfo.estoque_atual == 0) return mostrarAlerta('Sem Estoque', `Produto zerado!`, 'erro'); else if (qtd > prodInfo.estoque_atual) return mostrarAlerta('Falta Produto', `O sistema só tem ${parseFloat(prodInfo.estoque_atual)}.`, 'erro'); } }
    setCarregando('btn-gravar-movimentacao', true, 'Gravar');
    try { await clienteSupabase.from('movimentacoes').insert([{ produto_codigo: cod, tipo: tipo, quantidade: qtd, motivo: motivo }]); document.getElementById('formMovimentacao').reset(); await carregarEstoque(); await carregarListasProdutos(); carregarHistoricoMovimentacoes(); mostrarAlerta('Registrado', 'Movimentação concluída.', 'sucesso'); } 
    catch(err) { mostrarAlerta('Erro', 'Erro ao gravar.', 'erro'); } finally { setCarregando('btn-gravar-movimentacao', false, 'Gravar'); }
});

async function excluirMovimentacao(id) { const conf = await mostrarConfirmacao("Desfazer Registro", "A quantidade será estornada do estoque."); if(!conf) return; try { await clienteSupabase.from('movimentacoes').update({ apagado: true }).eq('id', id); await carregarEstoque(); await carregarListasProdutos(); document.getElementById('lista-produtos-gastos').innerHTML = ''; adicionarLinhaProdutoAvulso(); carregarHistoricoMovimentacoes(); } catch(e) { mostrarAlerta("Opa!", "Erro ao desfazer.", "erro"); } }

async function carregarHistoricoMovimentacoes() {
    const tbody = document.getElementById('tabela-movimentacoes'); 
    if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-gray-400 font-medium animate-pulse">A carregar movimentações...</td></tr>';

    const { data } = await clienteSupabase.from('movimentacoes').select('id, data, tipo, quantidade, motivo, produtos(nome)').eq('apagado', false).order('data', { ascending: false }).order('id', { ascending: false }).limit(10);
    if (data) {
        if(tbody) {
            tbody.innerHTML = '';
            data.forEach(mov => {
                let corTipo = mov.tipo === 'Entrada' ? 'text-emerald-500' : 'text-nude-500';
                tbody.innerHTML += `<tr class="hover:bg-gray-50/50 dark:bg-slate-700/30 border-b border-gray-100/50 dark:border-slate-700/50"><td class="px-6 py-4 text-sm text-gray-400 font-medium">${new Date(mov.data).toLocaleDateString('pt-BR')}</td><td class="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">${mov.produtos.nome}</td><td class="px-6 py-4 text-sm text-center font-bold ${corTipo}">${mov.tipo}</td><td class="px-6 py-4 text-sm text-center font-bold text-gray-800 dark:text-white">${parseFloat(mov.quantidade)}</td><td class="px-6 py-4 text-sm text-gray-500">${mov.motivo}</td><td class="px-6 py-4 text-center"><button type="button" onclick="excluirMovimentacao(${mov.id})" class="text-gray-300 hover:text-red-500 p-2 rounded-full font-bold">&times;</button></td></tr>`;
            });
        }
    }
}
// #endregion MÓDULO: MOVIMENTAÇÕES AVULSAS

// #region MÓDULO: RELATÓRIOS E FIDELIZAÇÃO
async function gerarRelatorioFidelizacao() {
    const tbody = document.getElementById('tabela-fidelizacao');
    const container = document.getElementById('container-relatorios');
    const avisoVazio = document.getElementById('relatorios-vazio');
    
    if(!tbody || !container || !avisoVazio) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-gray-400 font-medium animate-pulse">A analisar histórico de clientes...</td></tr>';
    container.classList.remove('hidden'); avisoVazio.classList.add('hidden');

    const diasCorte = parseInt(document.getElementById('filtro-dias-fidelizacao').value);
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - diasCorte);

    // Traz todos os agendamentos concluídos ordenados do mais recente para o mais antigo
    const { data: agendamentos, error } = await clienteSupabase
        .from('agendamentos')
        .select('id, data_hora, clientes(id, nome, telefone), procedimentos(nome)')
        .eq('status', 'Concluído')
        .eq('apagado', false)
        .order('data_hora', { ascending: false });

    if(error || !agendamentos || agendamentos.length === 0) {
        container.classList.add('hidden'); avisoVazio.classList.remove('hidden'); return;
    }

    // Agrupa para encontrar apenas a ÚLTIMA VISITA absoluta de cada cliente
    const ultimaVisitaCliente = {};
    agendamentos.forEach(ag => {
        if(!ag.clientes) return;
        const cliId = ag.clientes.id;
        // O primeiro a aparecer no loop é o mais recente, pois a ordem é decrescente
        if(!ultimaVisitaCliente[cliId]) ultimaVisitaCliente[cliId] = ag;
    });

    // Filtra os clientes cuja última visita foi ANTES da data de corte (Ex: mais de 30 dias atrás)
    let clientesFiltrados = Object.values(ultimaVisitaCliente).filter(ag => {
        return new Date(ag.data_hora) <= dataCorte;
    });

    // Lê a lista de itens que você ocultou e subtrai eles da tela
    let ignorados = JSON.parse(localStorage.getItem('essenza_fidelizacao_ignorados') || '[]');
    clientesFiltrados = clientesFiltrados.filter(ag => !ignorados.includes(ag.id));

    if(clientesFiltrados.length === 0) {
        container.classList.add('hidden'); avisoVazio.classList.remove('hidden'); return;
    }

    tbody.innerHTML = '';
    clientesFiltrados.forEach(ag => {
        const dataFormatada = new Date(ag.data_hora).toLocaleDateString('pt-BR');
        const procNome = ag.procedimentos ? ag.procedimentos.nome : 'Serviço';
        const clienteNome = ag.clientes.nome;
        const clienteTel = ag.clientes.telefone;
        
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition border-b border-gray-100/50 dark:border-slate-700/50" id="linha-fidelizacao-${ag.id}">
                <td class="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">${clienteNome}</td>
                <td class="px-6 py-4 text-sm text-gray-500">✨ ${procNome}</td>
                <td class="px-6 py-4 text-sm text-center font-medium text-nude-600 dark:text-nude-400">${dataFormatada}</td>
                <td class="px-6 py-4 text-center flex justify-center gap-2">
                    <button onclick="enviarWhatsappFidelizacao('${clienteNome.replace(/'/g, "\\'")}', '${clienteTel}', '${procNome}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1">
                        💬 Enviar
                    </button>
                    <button onclick="ignorarClienteFidelizacao(${ag.id})" class="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition" title="Ocultar da lista">
                        ✕ Ocultar
                    </button>
                </td>
            </tr>
        `;
    });
}

function enviarWhatsappFidelizacao(nome, telefone, servico) {
    if(!telefone || telefone === 'null') return mostrarAlerta('Falta Telefone', 'Este cliente não tem telefone cadastrado.', 'aviso');
    const msg = `Olá ${nome}! Tudo bem? ✨\n\nAqui é do Studio Essenza. Notámos que já faz um tempinho desde a sua última visita para fazer ${servico}.\n\nEstávamos com saudades! Gostaria de agendar um novo horário para renovar o visual?`;
    const telLimpo = telefone.replace(/\D/g, ''); 
    const link = `https://api.whatsapp.com/send?phone=55${telLimpo}&text=${encodeURIComponent(msg)}`; 
    window.open(link, '_blank');
}

function ignorarClienteFidelizacao(agendamentoId) {
    let ignorados = JSON.parse(localStorage.getItem('essenza_fidelizacao_ignorados') || '[]');
    if(!ignorados.includes(agendamentoId)) {
        ignorados.push(agendamentoId);
        localStorage.setItem('essenza_fidelizacao_ignorados', JSON.stringify(ignorados));
    }
    
    // Animação de saída limpa
    const linha = document.getElementById(`linha-fidelizacao-${agendamentoId}`);
    if(linha) {
        linha.style.opacity = '0';
        linha.style.transform = 'translateX(20px)';
        linha.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            linha.remove();
            // Verifica se esvaziou a tabela para mostrar o "Tudo Limpo"
            const tbody = document.getElementById('tabela-fidelizacao');
            if(tbody && tbody.children.length === 0) {
                document.getElementById('container-relatorios').classList.add('hidden');
                document.getElementById('relatorios-vazio').classList.remove('hidden');
            }
        }, 300);
    }
}
// #endregion MÓDULO: RELATÓRIOS E FIDELIZAÇÃO

// #region MÓDULO: CURVA ABC
let dadosCurvaABC = { produtos: [], servicos: [] };
let abaAtualABC = 'servicos';

function mudarAbaABC(aba) {
    abaAtualABC = aba;
    const btnServicos = document.getElementById('btn-abc-servicos');
    const btnProdutos = document.getElementById('btn-abc-produtos');

    if(aba === 'servicos') {
        btnServicos.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all";
        btnProdutos.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all";
    } else {
        btnProdutos.className = "font-semibold text-nude-600 border-b-2 border-nude-600 px-2 py-1 transition-all";
        btnServicos.className = "font-semibold text-gray-400 border-b-2 border-transparent px-2 py-1 hover:text-gray-600 transition-all";
    }
    renderizarTabelaABC();
}

async function gerarCurvaABC() {
    const tbody = document.getElementById('tabela-abc');
    const container = document.getElementById('container-curva');
    const avisoVazio = document.getElementById('abc-vazio');
    
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-gray-400 font-medium animate-pulse">A calcular estatísticas de volume...</td></tr>';
    container.classList.remove('hidden'); avisoVazio.classList.add('hidden');

    try {
        // 1. Busca Serviços Concluídos
        const { data: agendamentos } = await clienteSupabase.from('agendamentos').select('procedimentos(nome)').eq('status', 'Concluído').eq('apagado', false);
        const contagemServicos = {};
        if(agendamentos) {
            agendamentos.forEach(ag => {
                const pNome = ag.procedimentos ? ag.procedimentos.nome : 'Serviço Sem Nome';
                contagemServicos[pNome] = (contagemServicos[pNome] || 0) + 1;
            });
        }
        const arrayServicos = Object.keys(contagemServicos).map(nome => ({ nome, qtd: contagemServicos[nome] }));

        // 2. Busca Produtos (Saídas)
        const { data: movimentacoes } = await clienteSupabase.from('movimentacoes').select('quantidade, produtos(nome)').eq('tipo', 'Saída').eq('apagado', false);
        const contagemProdutos = {};
        if(movimentacoes) {
            movimentacoes.forEach(mov => {
                const pNome = mov.produtos ? mov.produtos.nome : 'Produto Deletado';
                contagemProdutos[pNome] = (contagemProdutos[pNome] || 0) + parseFloat(mov.quantidade);
            });
        }
        const arrayProdutos = Object.keys(contagemProdutos).map(nome => ({ nome, qtd: contagemProdutos[nome] }));

        // 3. Calcula a matemática ABC
        dadosCurvaABC.servicos = aplicarMatematicaABC(arrayServicos);
        dadosCurvaABC.produtos = aplicarMatematicaABC(arrayProdutos);

        renderizarTabelaABC();
    } catch(err) {
        mostrarAlerta('Erro', 'Ocorreu um erro ao calcular a curva ABC.', 'erro');
    }
}

function aplicarMatematicaABC(lista) {
    // Ordena do que mais saiu para o que menos saiu
    lista.sort((a, b) => b.qtd - a.qtd);
    
    const totalGeral = lista.reduce((sum, item) => sum + item.qtd, 0);
    if(totalGeral === 0) return [];

    let acumulado = 0;
    return lista.map((item, index) => {
        const percentualItem = (item.qtd / totalGeral) * 100;
        acumulado += percentualItem;
        
        let classe = 'C';
        if (acumulado <= 80) classe = 'A';
        else if (acumulado <= 95) classe = 'B';
        else classe = 'C';

        // Garante que o primeiro item seja sempre 'A' mesmo que ele sozinho passe de 80% do salão
        if (index === 0) classe = 'A';

        return { ...item, acumulado, classe, rank: index + 1 };
    });
}

function renderizarTabelaABC() {
    const tbody = document.getElementById('tabela-abc');
    const container = document.getElementById('container-curva');
    const avisoVazio = document.getElementById('abc-vazio');
    const filtro = document.getElementById('filtro-classe-abc').value;

    let dadosAtuais = dadosCurvaABC[abaAtualABC] || [];
    
    // Filtra pela classe A, B ou C (se não for ALL)
    if (filtro !== 'ALL') {
        dadosAtuais = dadosAtuais.filter(item => item.classe === filtro);
    }

    if(dadosAtuais.length === 0) {
        container.classList.add('hidden'); avisoVazio.classList.remove('hidden'); return;
    }

    container.classList.remove('hidden'); avisoVazio.classList.add('hidden');
    tbody.innerHTML = '';

    dadosAtuais.forEach(item => {
        // Estilização dos Ranks e Classes
        let medalha = `<span class="text-gray-500 font-bold">${item.rank}º</span>`;
        if(item.rank === 1) medalha = `<span class="text-2xl" title="1º Lugar">🏆</span>`;
        if(item.rank === 2) medalha = `<span class="text-2xl" title="2º Lugar">🥈</span>`;
        if(item.rank === 3) medalha = `<span class="text-2xl" title="3º Lugar">🥉</span>`;

        let badgeClasse = '';
        if(item.classe === 'A') badgeClasse = `<span class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black shadow-sm tracking-widest">CURVA A</span>`;
        if(item.classe === 'B') badgeClasse = `<span class="bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-widest">CURVA B</span>`;
        if(item.classe === 'C') badgeClasse = `<span class="bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-semibold shadow-sm tracking-widest">CURVA C</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition border-b border-gray-100/50 dark:border-slate-700/50">
                <td class="px-6 py-4 text-center">${medalha}</td>
                <td class="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-base">${item.nome}</td>
                <td class="px-6 py-4 text-center font-bold text-nude-600 dark:text-nude-400 text-lg">${parseFloat(item.qtd).toFixed(item.qtd % 1 === 0 ? 0 : 2)}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-500">${item.acumulado.toFixed(1)}%</td>
                <td class="px-6 py-4 text-center">${badgeClasse}</td>
            </tr>
        `;
    });
}
// #endregion MÓDULO: CURVA ABC

// =========================================
// EVENTOS GLOBAIS DE PROTEÇÃO (NÃO APAGAR)
// =========================================
const formEditarCliente = document.getElementById('formEditarCliente');
if (formEditarCliente) {
    formEditarCliente.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('edit_cli_id').value;
        const nome = document.getElementById('edit_cli_nome').value.trim();
        const telefone = document.getElementById('edit_cli_telefone').value.trim();
        const data_nasc = document.getElementById('edit_cli_data_nasc').value;
        if(!nome) return mostrarAlerta('Atenção', 'O nome não pode ficar vazio.', 'aviso');
        
        setCarregando('btn-atualizar-cliente', true, 'Atualizar Dados');
        try {
            const { error } = await clienteSupabase.from('clientes').update({ nome: nome, telefone: telefone, data_nascimento: data_nasc || null }).eq('id', id);
            if(error) throw error;
            fecharModalEditarCliente(); await carregarClientes(); mostrarAlerta('Pronto!', 'Dados atualizados com sucesso.', 'sucesso');
        } catch(err) { mostrarAlerta('Erro', 'Houve um erro ao atualizar.', 'erro'); } 
        finally { setCarregando('btn-atualizar-cliente', false, 'Atualizar Dados'); }
    });
}

const formAgendamento = document.getElementById('formAgendamento');
if (formAgendamento) {
    formAgendamento.addEventListener('submit', async function(e) {
        e.preventDefault();
        const cliNovo = document.getElementById('toggle-novo-cliente').checked; const profNovo = document.getElementById('toggle-novo-profissional').checked;
        if(!cliNovo && !document.getElementById('agenda_cliente_existente').value) return mostrarAlerta('Falta algo!', 'Selecione o Cliente na lista.', 'aviso');
        if(!profNovo && !document.getElementById('agenda_profissional_existente').value) return mostrarAlerta('Falta algo!', 'Selecione o Profissional.', 'aviso');
        const servId = document.getElementById('agenda_servico').value; if(!servId) return mostrarAlerta('Falta algo!', 'Selecione qual Serviço será realizado.', 'aviso');
        const data = document.getElementById('agenda_data').value; const hora = document.getElementById('agenda_hora').value; if(!data || !hora) return mostrarAlerta('Falta algo!', 'Defina data e horário.', 'aviso');

        setCarregando('btn-salvar-agenda', true, 'Agendar');
        try {
            if(!profNovo) {
                const idProfExistente = document.getElementById('agenda_profissional_existente').value;
                const servicoSelecionado = listaGlobalProcedimentos.find(p => p.id == servId);
                const tempoEstimadoNovo = servicoSelecionado && servicoSelecionado.tempo_estimado_minutos ? parseInt(servicoSelecionado.tempo_estimado_minutos) : 60;
                const novoInicio = new Date(`${data}T${hora}:00`).getTime(); const novoFim = novoInicio + (tempoEstimadoNovo * 60000); 

                const inicioDia = `${data}T00:00:00`; const fimDia = `${data}T23:59:59`;
                const { data: agendamentosProf } = await clienteSupabase.from('agendamentos').select('data_hora, procedimentos(nome, tempo_estimado_minutos)').eq('profissional_id', idProfExistente).eq('apagado', false).neq('status', 'Cancelado').gte('data_hora', inicioDia).lte('data_hora', fimDia);
                    
                if(agendamentosProf && agendamentosProf.length > 0) {
                    let conflito = false; let msgConflito = '';
                    for(let ag of agendamentosProf) {
                        const tempoEstimadoExistente = ag.procedimentos && ag.procedimentos.tempo_estimado_minutos ? parseInt(ag.procedimentos.tempo_estimado_minutos) : 60;
                        const agInicio = new Date(ag.data_hora).getTime(); const agFim = agInicio + (tempoEstimadoExistente * 60000);
                        
                        if(novoInicio < agFim && novoFim > agInicio) {
                            conflito = true;
                            const hIniFmt = new Date(agInicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}); const hFimFmt = new Date(agFim).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}); const nomeServ = ag.procedimentos ? ag.procedimentos.nome : 'um serviço';
                            msgConflito = `O profissional estará ocupado com "${nomeServ}" das ${hIniFmt} às ${hFimFmt}. O serviço atual requer ${tempoEstimadoNovo} min. Escolha outro horário!`;
                            break;
                        }
                    }
                    if(conflito) { setCarregando('btn-salvar-agenda', false, 'Agendar'); return mostrarAlerta('Horário Indisponível', msgConflito, 'erro'); }
                }
            }

            let idClienteFinal = null; let idProfFinal = null;
            if(cliNovo) {
                const nome = document.getElementById('agenda_novo_nome').value.trim(); const tel = document.getElementById('agenda_novo_telefone').value.trim(); const dataNasc = document.getElementById('agenda_nova_data_nasc').value;
                const { data: newCli, error: errCli } = await clienteSupabase.from('clientes').insert([{ nome: nome, telefone: tel, data_nascimento: dataNasc || null }]).select();
                if(errCli) throw new Error("Erro cliente"); idClienteFinal = newCli[0].id; await carregarClientes();
            } else { idClienteFinal = document.getElementById('agenda_cliente_existente').value; }

            if(profNovo) {
                const nomeProf = document.getElementById('agenda_novo_prof_nome').value.trim(); const esp = document.getElementById('agenda_novo_prof_esp').value.trim();
                const { data: newProf, error: errProf } = await clienteSupabase.from('profissionais').insert([{ nome: nomeProf, especialidade: esp }]).select();
                if(errProf) throw new Error("Erro profissional"); idProfFinal = newProf[0].id; await carregarProfissionais();
            } else { idProfFinal = document.getElementById('agenda_profissional_existente').value; }

            const dataHoraISO = `${data}T${hora}:00`;
            const { error: errAge } = await clienteSupabase.from('agendamentos').insert([{ cliente_id: idClienteFinal, profissional_id: idProfFinal, procedimento_id: servId, data_hora: dataHoraISO }]);
            if(errAge) throw new Error("Erro agenda");
            
            fecharModalAgendamento(); carregarAgenda(); mostrarAlerta('Sucesso', 'Horário reservado com sucesso.', 'sucesso');
        } catch(e) { mostrarAlerta('Erro do Sistema', e.message || 'Ocorreu um problema ao comunicar com o servidor. Tente novamente.', 'erro'); } 
        finally { setCarregando('btn-salvar-agenda', false, 'Agendar'); }
    });
}

const formProduto = document.getElementById('formProduto');
if (formProduto) {
    formProduto.addEventListener('submit', async function(e) {
        e.preventDefault(); const nomeProduto = document.getElementById('nome_produto').value.trim();
        if(!nomeProduto) return mostrarAlerta('Atenção', 'Preencha o nome do produto.', 'aviso');
        setCarregando('btn-salvar-produto', true, 'Salvar');
        try {
            const valorEstoque = parseFloat(document.getElementById('estoque_inicial').value) || 0;
            const { error } = await clienteSupabase.from('produtos').insert([{ nome: nomeProduto, categoria: document.getElementById('categoria_produto').value, estoque_inicial: valorEstoque }]);
            if (error) throw error;
            fecharModalProduto(); carregarEstoque(); carregarListasProdutos(); 
            if (valorEstoque === 0) mostrarAlerta('Prontinho!', `O produto "${nomeProduto}" foi criado. Pode dar Entrada nele na aba ao lado.`, 'sucesso'); else mostrarAlerta('Sucesso', `Produto salvo no catálogo.`, 'sucesso');
        } catch(err) { mostrarAlerta('Erro', 'Ocorreu um erro ao salvar o produto.', 'erro'); } finally { setCarregando('btn-salvar-produto', false, 'Salvar'); }
    });
}

inicializarSistema();