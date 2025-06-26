# Simulador de Mesh Wi-Fi e Robótica

Este projeto simula cenários de redes mesh Wi-Fi e montagem de cenários de robótica, com foco em situações realistas de movimentação de dispositivos (Raspberry Pi, carros com roteador embarcado) e análise de conectividade. Inclui tanto uma interface web interativa para montagem de cenários quanto simulação discreta em Python usando SimPy.

## Funcionalidades

- Interface web para montagem visual de cenários (drag & drop, conexões, visualização)
- Simulação de movimento de dispositivos móveis (Raspberry Pi, RaspCarRout)
- Roteadores mesh interconectados (tecnologia mesh)
- Modem principal fixo (recebe internet por cabo)
- Escaneamento de sinal Wi-Fi (RSSI) em tempo real
- Logs detalhados de cada passo da simulação
- Geração automática de gráficos e relatórios
- Cenários prontos e expansíveis
- Fácil de expandir para novos cenários, dispositivos e trajetórias

## Estrutura dos Arquivos

- `index.html`, `main.js`, `style.css`, `conexoes.html`, `visualizacao.html`: Interface web para montagem, conexão e visualização de cenários
- `imgs/`: Imagens dos componentes (roteador, Raspberry Pi, carro, etc.)
- `simulador_mesh_cenarios.py`: Script principal com cenários prontos para simulação e análise automática
- `simulador_mesh.py`: Exemplo de simulação customizável (usuário define o cenário)
- `simulador_simpy.py`: Exemplo didático de simulação de conexões, movimento e envio de pacotes
- `analise_logs.py`: Script de análise automática de logs, geração de gráficos e relatórios
- `logs_cenario1.csv`, `logs_cenario2.csv`: Exemplos de logs gerados automaticamente
- `analise_cenario1.txt`: Exemplo de relatório automático

## Como rodar a simulação Python

### 1. Clone o repositório

```bash
git clone git@github.com:eduardowanderleyde/framework-robotics.git
cd framework-robotics
```

### 2. Crie e ative um ambiente virtual (recomendado)

```bash
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 3. Instale as dependências

```bash
pip install simpy matplotlib
```

### 4. Rode o simulador de cenários prontos

```bash
python simulador_mesh_cenarios.py
```

Você verá um menu para escolher o cenário:

- **1:** Raspberry móvel escaneando mesh
- **2:** RaspCarRout (carro+roteador) móvel
- **3:** Ler cenário via JSON (arquivo: cenario.json)

Digite o número desejado e acompanhe os logs da simulação no terminal. Logs, gráficos e relatórios serão gerados automaticamente.

---

## Explicação dos Cenários

### Cenário 1: Raspberry móvel escaneando mesh

- 1 modem principal (fixo)
- 2 roteadores mesh (fixos, interconectados)
- 1 Raspberry Pi móvel, que se move por um caminho definido e escaneia o sinal dos roteadores
- Log mostra a cada passo o RSSI dos roteadores ao alcance
- Geração automática de CSV, gráfico e relatório

### Cenário 2: RaspCarRout (carro+roteador) móvel

- 1 modem principal (fixo)
- 2 roteadores mesh (fixos)
- 1 carro com roteador e Raspberry embarcados, ambos se movem juntos
- O carro escaneia o sinal dos roteadores e o roteador embarcado conecta/desconecta da mesh conforme a posição
- Log mostra o RSSI e eventos de conexão/desconexão do roteador embarcado
- Geração automática de CSV, gráfico e relatório

---

## Exemplo de logs e relatório gerados

**Exemplo de log CSV:**

```
tempo,dispositivo,evento,detalhes
0,rasp1,move,"0,0"
0,rasp1,scan,"router1,-35.0,0,0"
...
```

**Exemplo de relatório:**

```
=== Relatório de Análise de Conectividade ===
Total de pontos de escaneamento: 16

Roteador router1:
  Média RSSI: -34.7 dBm
  Sinal mais forte: -30.0 dBm
  Sinal mais fraco: -37.5 dBm
  Pontos de sinal fraco (≤-70 dBm): 0
...
```

---

## Como personalizar e criar novos cenários

- Edite ou crie novas funções no arquivo `simulador_mesh_cenarios.py` (ex: `cenario3()`)
- Adicione mais dispositivos, roteadores, caminhos e regras conforme desejar
- Para importar trajetórias reais, basta ler um arquivo CSV/JSON e passar como `path` dos dispositivos
- Modifique o alcance, modelo de RSSI, intervalos de tempo, etc., para simular diferentes realidades

---

## Interface Web (Frontend)

A interface web permite montar cenários de robótica arrastando componentes, conectando-os e visualizando a topologia.

- **index.html**: Montagem visual (drag & drop) de roteadores, Raspberry Pi e carros
- **conexoes.html**: Criação de conexões entre componentes
- **visualizacao.html**: Visualização gráfica dos componentes e conexões
- **main.js**: Lógica de interação, seleção, remoção e navegação
- **style.css**: Visual moderno e responsivo
- **imgs/**: Imagens dos componentes

**Como usar:**

1. Abra o `index.html` em seu navegador
2. Monte o cenário arrastando os componentes
3. Clique em "Próximo" para definir conexões
4. Clique em "Próximo" novamente para visualizar a topologia

> **Obs:** O frontend é estático, não depende de backend ou Node.js.

---

## Dependências

- Python 3.8+
- [SimPy](https://simpy.readthedocs.io/) (simulação discreta)
- [matplotlib](https://matplotlib.org/) (gráficos)

Instale com:

```bash
pip install simpy matplotlib
```

---

## Dúvidas ou sugestões?

Abra uma issue ou entre em contato pelo GitHub!

---

**Desenvolvido por Eduardo Wanderley e colaboradores.**
