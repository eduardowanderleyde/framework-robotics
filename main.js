const canvas = document.getElementById('cenario');
const ctx = canvas.getContext('2d');
const painel = document.getElementById('painel');
const lixeiraContainer = document.getElementById('lixeira-container');

const imagens = {
  'router': 'imgs/router.jpeg',
  'pi': 'imgs/raspberry.jpeg',
  'car-router': 'imgs/car-router.jpeg',
  'car-router-pi': 'imgs/rasp-car-rout.jpeg',
  'internet': 'imgs/internet.png',
};

class Componente {
  constructor(tipo, x, y) {
    this.tipo = tipo;
    this.x = x;
    this.y = y;
    this.largura = 100;
    this.altura = 100;
    this.img = new window.Image();
    this.img.src = imagens[tipo];
  }
  desenhar(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.largura, this.altura);
  }
  contemPonto(x, y) {
    return (
      x >= this.x && x <= this.x + this.largura &&
      y >= this.y && y <= this.y + this.altura
    );
  }
}

const componentes = [];
let componenteSelecionado = null;
let indiceSelecionado = -1;
let offsetX = 0;
let offsetY = 0;
let tipoArrastando = null;
let arrastando = false;

// Referências aos novos elementos
const btnAddRouter = document.getElementById('add-router');
const btnAddPi = document.getElementById('add-pi');
const btnAddCarRouter = document.getElementById('add-car-router');
const btnAddCarRouterPi = document.getElementById('add-car-router-pi');
const btnLimpar = document.getElementById('limpar');
const btnExportar = document.getElementById('exportar');
const btnImportar = document.getElementById('importar');
const inputImportar = document.getElementById('importar-arquivo');
const mensagem = document.getElementById('mensagem');

// Conexões: cada item é [índice1, índice2]
let conexoes = [];
let primeiroParaConectar = null;

// Adicionar ponto fixo de internet
const pontoInternet = {
  nome: 'Internet',
  tipo: 'internet',
  x: 20,
  y: 20,
  largura: 60,
  altura: 60
};

function exibirMensagem(msg) {
  mensagem.textContent = msg;
  setTimeout(() => { mensagem.textContent = ''; }, 2000);
}

function salvarCenario() {
  const dados = {
    componentes: componentes.map(c => ({ tipo: c.tipo, x: c.x, y: c.y, nome: c.nome || '' })),
    conexoes: conexoes.map(([a, b]) => {
      return {
        origem: a === 'internet' ? 'internet' : componentes[a]?.nome || '',
        destino: b === 'internet' ? 'internet' : componentes[b]?.nome || ''
      };
    })
  };
  localStorage.setItem('cenario', JSON.stringify(dados));
}

function adicionarComponente(tipo) {
  const novo = new Componente(tipo, 100 + Math.random()*400, 100 + Math.random()*300);
  componentes.push(novo);
  desenharTudo();
  salvarCenario();
  exibirMensagem('Dispositivo adicionado: ' + tipo);
}

btnAddRouter.onclick = () => adicionarComponente('router');
btnAddPi.onclick = () => adicionarComponente('pi');
btnAddCarRouter.onclick = () => adicionarComponente('car-router');
btnAddCarRouterPi.onclick = () => adicionarComponente('car-router-pi');

btnLimpar.onclick = () => {
  if (window.confirm('Limpar todo o cenário?')) {
    componentes.length = 0;
    conexoes.length = 0;
    desenharTudo();
    exibirMensagem('Cenário limpo');
  }
};

btnExportar.onclick = () => {
  const dados = {
    componentes: componentes.map(c => ({ tipo: c.tipo, x: c.x, y: c.y, nome: c.nome || '' })),
    conexoes: conexoes.map(([a, b]) => {
      return { origem: componentes[a]?.nome || '', destino: componentes[b]?.nome || '' };
    })
  };
  localStorage.setItem('cenario', JSON.stringify(dados));
  const blob = new Blob([JSON.stringify(dados, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cenario.json';
  a.click();
  URL.revokeObjectURL(url);
  exibirMensagem('Cenário exportado para JSON');
};

btnImportar.onclick = () => inputImportar.click();
inputImportar.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const dados = JSON.parse(evt.target.result);
      componentes.length = 0;
      conexoes.length = 0;
      (dados.componentes || []).forEach(c => {
        const novo = new Componente(c.tipo, c.x, c.y);
        if (c.nome) novo.nome = c.nome;
        componentes.push(novo);
      });
      // Reconstruir conexões usando nomes
      (dados.conexoes || []).forEach(conn => {
        const idx1 = componentes.findIndex(c => c.nome === conn.origem);
        const idx2 = componentes.findIndex(c => c.nome === conn.destino);
        if (idx1 !== -1 && idx2 !== -1) conexoes.push([idx1, idx2]);
      });
      desenharTudo();
      exibirMensagem('Cenário importado com sucesso');
      localStorage.setItem('cenario', JSON.stringify(dados));
    } catch {
      exibirMensagem('Erro ao importar JSON');
    }
  };
  reader.readAsText(file);
};

// Drag & drop do painel para o canvas
painel.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('miniatura')) {
    tipoArrastando = e.target.getAttribute('data-type');
  }
});

painel.addEventListener('dragend', () => {
  tipoArrastando = null;
});

canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  if (tipoArrastando) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const novo = new Componente(tipoArrastando, mouseX - 50, mouseY - 50);
    componentes.push(novo);
    desenharTudo();
    tipoArrastando = null;
  }
});

function mostrarLixeiraSobreComponente(comp) {
  // Posição do canvas na tela
  const rect = canvas.getBoundingClientRect();
  // Posição da lixeira: canto superior direito do componente
  const left = rect.left + window.scrollX + comp.x + comp.largura - 14;
  const top = rect.top + window.scrollY + comp.y - 14;
  lixeiraContainer.style.left = `${left}px`;
  lixeiraContainer.style.top = `${top}px`;
  lixeiraContainer.style.display = 'block';
  lixeiraContainer.innerHTML = `<button class='lixeira-btn' title='Remover'>&#128465;</button>`;
}

function esconderLixeira() {
  console.log('Escondendo lixeira');
  lixeiraContainer.style.display = 'none';
  lixeiraContainer.innerHTML = '';
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  // Se clicar no ponto de internet
  const distInternet = Math.sqrt(Math.pow(mouseX - (pontoInternet.x + pontoInternet.largura/2), 2) + Math.pow(mouseY - (pontoInternet.y + pontoInternet.altura/2), 2));
  if (distInternet < pontoInternet.largura/2) {
    if (primeiroParaConectar && primeiroParaConectar.tipo === 'router') {
      // Conectar roteador à internet
      const idx = componentes.indexOf(primeiroParaConectar);
      if (!conexoes.some(([a, b]) => (a === 'internet' && b === idx) || (a === idx && b === 'internet'))) {
        conexoes.push(['internet', idx]);
        exibirMensagem('Roteador conectado à Internet');
      } else {
        exibirMensagem('Já conectado à Internet');
      }
      primeiroParaConectar = null;
      desenharTudo();
      salvarCenario();
      return;
    } else {
      // Seleciona internet para conectar depois
      primeiroParaConectar = pontoInternet;
      return;
    }
  }
  let selecionou = false;
  for (let i = componentes.length - 1; i >= 0; i--) {
    if (componentes[i].contemPonto(mouseX, mouseY)) {
      if (primeiroParaConectar && primeiroParaConectar !== componentes[i]) {
        // Conectar dois diferentes
        const idx1 = componentes.indexOf(primeiroParaConectar);
        const idx2 = i;
        if (!conexoes.some(([a, b]) => (a === idx1 && b === idx2) || (a === idx2 && b === idx1))) {
          conexoes.push([idx1, idx2]);
          exibirMensagem('Conexão criada');
        } else {
          exibirMensagem('Esses dispositivos já estão conectados');
        }
        primeiroParaConectar = null;
        desenharTudo();
        salvarCenario();
        return;
      }
      componenteSelecionado = componentes[i];
      indiceSelecionado = i;
      primeiroParaConectar = componentes[i];
      desenharTudo();
      mostrarLixeiraSobreComponente(componenteSelecionado);
      selecionou = true;
      break;
    }
  }
  if (!selecionou) {
    componenteSelecionado = null;
    indiceSelecionado = -1;
    primeiroParaConectar = null;
    esconderLixeira();
    desenharTudo();
  }
  salvarCenario();
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  for (let i = 0; i < conexoes.length; i++) {
    const [a, b] = conexoes[i];
    const ca = componentes[a];
    const cb = componentes[b];
    // Checar se clicou próximo da linha
    const dist = distanciaPontoReta(mouseX, mouseY, ca.x+ca.largura/2, ca.y+ca.altura/2, cb.x+cb.largura/2, cb.y+cb.altura/2);
    if (dist < 10) {
      if (window.confirm('Remover esta conexão?')) {
        conexoes.splice(i, 1);
        desenharTudo();
        exibirMensagem('Conexão removida');
      }
      return;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (arrastando && componenteSelecionado) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    componenteSelecionado.x = mouseX - offsetX;
    componenteSelecionado.y = mouseY - offsetY;
    desenharTudo();
    mostrarLixeiraSobreComponente(componenteSelecionado);
  }
});

canvas.addEventListener('mouseup', () => {
  arrastando = false;
});

// Remover componente ao clicar na lixeira
lixeiraContainer.addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('Clique na lixeira detectado');
  console.log('componenteSelecionado:', componenteSelecionado);
  console.log('indiceSelecionado:', indiceSelecionado);
  console.log('Array de componentes antes:', componentes);
  if (e.target.classList.contains('lixeira-btn') && componenteSelecionado) {
    if (window.confirm('Você tem certeza que deseja excluir este componente?')) {
      const idx = componentes.indexOf(componenteSelecionado);
      console.log('Tentando remover componente:', componenteSelecionado, 'índice:', idx);
      if (idx !== -1) {
        componentes.splice(idx, 1);
        desenharTudo();
        console.log('Componente removido com sucesso');
        console.log('Array de componentes depois:', componentes);
      } else {
        console.log('Componente não encontrado para remoção');
      }
      componenteSelecionado = null;
      indiceSelecionado = -1;
      esconderLixeira();
    } else {
      console.log('Remoção cancelada pelo usuário');
    }
  } else {
    console.log('Condições para remoção não atendidas');
  }
  salvarCenario();
});

// Duplo clique para editar nome/tipo
canvas.addEventListener('dblclick', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  for (let i = componentes.length - 1; i >= 0; i--) {
    if (componentes[i].contemPonto(mouseX, mouseY)) {
      const novoNome = prompt('Nome do dispositivo:', componentes[i].nome || '');
      if (novoNome !== null) componentes[i].nome = novoNome;
      const novoTipo = prompt('Tipo (router, pi, car-router, car-router-pi):', componentes[i].tipo);
      if (novoTipo && imagens[novoTipo]) {
        componentes[i].tipo = novoTipo;
        componentes[i].img.src = imagens[novoTipo];
      }
      desenharTudo();
      exibirMensagem('Dispositivo editado');
      salvarCenario();
      break;
    }
  }
});

// Atalhos de teclado
window.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && componenteSelecionado) {
    const idx = componentes.indexOf(componenteSelecionado);
    if (idx !== -1) {
      componentes.splice(idx, 1);
      // Remover conexões relacionadas
      conexoes = conexoes.filter(([a, b]) => a !== idx && b !== idx);
      desenharTudo();
      exibirMensagem('Dispositivo removido');
      componenteSelecionado = null;
      indiceSelecionado = -1;
      esconderLixeira();
    }
  }
  if (e.key === 'Escape') {
    componenteSelecionado = null;
    indiceSelecionado = -1;
    primeiroParaConectar = null;
    esconderLixeira();
    desenharTudo();
  }
  // Movimento pelas setas do teclado
  if (componenteSelecionado) {
    let moved = false;
    if (e.key === 'ArrowUp') {
      componenteSelecionado.y -= 10;
      moved = true;
    }
    if (e.key === 'ArrowDown') {
      componenteSelecionado.y += 10;
      moved = true;
    }
    if (e.key === 'ArrowLeft') {
      componenteSelecionado.x -= 10;
      moved = true;
    }
    if (e.key === 'ArrowRight') {
      componenteSelecionado.x += 10;
      moved = true;
    }
    if (moved) {
      desenharTudo();
      mostrarLixeiraSobreComponente(componenteSelecionado);
      exibirMensagem('Dispositivo movido pelas setas');
    }
  }
  salvarCenario();
});

// Função utilitária para distância ponto-reta
function distanciaPontoReta(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Destacar componente selecionado
Componente.prototype.desenhar = function(ctx) {
  ctx.drawImage(this.img, this.x, this.y, this.largura, this.altura);
  if (componenteSelecionado === this) {
    ctx.save();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.x, this.y, this.largura, this.altura);
    ctx.restore();
  }
  // Nome
  if (this.nome) {
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(this.nome, this.x + this.largura/2, this.y + this.altura + 18);
    ctx.restore();
  }
};

// Desenhar conexões
function desenharTudo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Desenhar ponto de internet
  ctx.save();
  ctx.fillStyle = '#2196f3';
  ctx.beginPath();
  ctx.arc(pontoInternet.x + pontoInternet.largura/2, pontoInternet.y + pontoInternet.altura/2, pontoInternet.largura/2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Internet', pontoInternet.x + pontoInternet.largura/2, pontoInternet.y + pontoInternet.altura/2 + 5);
  ctx.restore();
  // Linhas de conexão
  conexoes.forEach(([a, b]) => {
    // Conexão com internet
    if (a === 'internet' || b === 'internet') {
      const idx = a === 'internet' ? b : a;
      if (componentes[idx]) {
        ctx.save();
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pontoInternet.x + pontoInternet.largura/2, pontoInternet.y + pontoInternet.altura/2);
        ctx.lineTo(componentes[idx].x+componentes[idx].largura/2, componentes[idx].y+componentes[idx].altura/2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (componentes[a] && componentes[b]) {
      ctx.save();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(componentes[a].x+componentes[a].largura/2, componentes[a].y+componentes[a].altura/2);
      ctx.lineTo(componentes[b].x+componentes[b].largura/2, componentes[b].y+componentes[b].altura/2);
      ctx.stroke();
      ctx.restore();
    }
  });
  componentes.forEach(c => c.desenhar(ctx));
  salvarCenario();
}

desenharTudo(); 