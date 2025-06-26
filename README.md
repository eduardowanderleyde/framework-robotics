# Simulador de Mesh Wi-Fi com SimPy

Este projeto simula cenários de redes mesh Wi-Fi usando Python e SimPy, focando em situações realistas de movimentação de dispositivos (Raspberry Pi, carros com roteador embarcado) e escaneamento de sinais Wi-Fi de roteadores mesh.

## Funcionalidades

- Simulação de movimento de dispositivos móveis (Raspberry Pi, RaspCarRout)
- Roteadores mesh interconectados (tecnologia mesh)
- Modem principal fixo (recebe internet por cabo)
- Escaneamento de sinal Wi-Fi (RSSI) em tempo real
- Logs detalhados de cada passo da simulação
- Dois cenários prontos para rodar e estudar
- Fácil de expandir para novos cenários, dispositivos e trajetórias

## Estrutura dos Arquivos

- `simulador_mesh_cenarios.py`: Script principal com cenários prontos para simulação
- `simulador_mesh.py`: Exemplo de simulação customizável
- `simulador_simpy.py`: Exemplo didático de simulação de conexões e movimento

## Como rodar na sua máquina

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
pip install simpy
```

### 4. Rode o simulador de cenários prontos

```bash
python simulador_mesh_cenarios.py
```

Você verá um menu para escolher o cenário:

- **1:** Raspberry móvel escaneando mesh
- **2:** RaspCarRout (carro+roteador) móvel

Digite o número desejado e acompanhe os logs da simulação no terminal.

---

## Explicação dos Cenários

### Cenário 1: Raspberry móvel escaneando mesh

- 1 modem principal (fixo)
- 2 roteadores mesh (fixos, interconectados)
- 1 Raspberry Pi móvel, que se move por um caminho definido e escaneia o sinal dos roteadores
- Log mostra a cada passo o RSSI dos roteadores ao alcance

### Cenário 2: RaspCarRout (carro+roteador) móvel

- 1 modem principal (fixo)
- 2 roteadores mesh (fixos)
- 1 carro com roteador e Raspberry embarcados, ambos se movem juntos
- O carro escaneia o sinal dos roteadores e o roteador embarcado conecta/desconecta da mesh conforme a posição
- Log mostra o RSSI e eventos de conexão/desconexão do roteador embarcado

---

## Como personalizar e criar novos cenários

- Edite ou crie novas funções no arquivo `simulador_mesh_cenarios.py` (ex: `cenario3()`)
- Adicione mais dispositivos, roteadores, caminhos e regras conforme desejar
- Para importar trajetórias reais, basta ler um arquivo CSV/JSON e passar como `path` dos dispositivos
- Modifique o alcance, modelo de RSSI, intervalos de tempo, etc., para simular diferentes realidades

---

## Exemplo de expansão

```python
# Adicionando um novo Raspberry Pi
rasp2 = RaspberryPi(env, 'rasp2', [(0,5), (5,5), (10,5), (15,5), (20,5)])
# Inclua rasp2 na lista de dispositivos a serem escaneados
env.process(escanear_periodicamente(env, [rasp, rasp2], roteadores))
```

---

## Dúvidas ou sugestões?

Abra uma issue ou entre em contato pelo GitHub!

---

**Desenvolvido por Eduardo Wanderley e colaboradores.**
