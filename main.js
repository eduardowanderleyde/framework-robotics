const canvas = document.getElementById('cenario');
const ctx = canvas.getContext('2d');
const painel = document.getElementById('painel');
const lixeiraContainer = document.getElementById('lixeira-container');

const imagens = {
  'router': 'imgs/router.jpeg',
  'pi': 'imgs/raspberry.jpeg',
  'car-router': 'imgs/car-router.jpeg',
  'car-router-pi': 'imgs/rasp-car-rout.jpeg',
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
  console.log('click no canvas');
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  let selecionou = false;
  for (let i = componentes.length - 1; i >= 0; i--) {
    if (componentes[i].contemPonto(mouseX, mouseY)) {
      componenteSelecionado = componentes[i];
      indiceSelecionado = componentes.indexOf(componenteSelecionado);
      console.log('Selecionou componente:', componenteSelecionado, 'índice:', indiceSelecionado);
      desenharTudo();
      mostrarLixeiraSobreComponente(componenteSelecionado);
      selecionou = true;
      break;
    }
  }
  if (!selecionou) {
    console.log('Nenhum componente selecionado');
    componenteSelecionado = null;
    indiceSelecionado = -1;
    esconderLixeira();
  }
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  for (let i = componentes.length - 1; i >= 0; i--) {
    if (componentes[i].contemPonto(mouseX, mouseY)) {
      componenteSelecionado = componentes[i];
      indiceSelecionado = componentes.indexOf(componenteSelecionado);
      offsetX = mouseX - componenteSelecionado.x;
      offsetY = mouseY - componenteSelecionado.y;
      arrastando = true;
      break;
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
});

function desenharTudo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  componentes.forEach(c => c.desenhar(ctx));
}

desenharTudo(); 