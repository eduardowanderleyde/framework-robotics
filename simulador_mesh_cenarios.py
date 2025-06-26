import simpy
import math
import csv
import matplotlib.pyplot as plt
import json
from analise_logs import ler_logs_csv, analisar_conectividade, plotar_analise, gerar_relatorio

ALCANCE_WIFI = 100  # alcance dos roteadores em metros

# Função para simular RSSI baseado na distância
def rssi(dist):
    if dist > ALCANCE_WIFI:
        return None
    return -30 - 0.5 * dist  # Exemplo: -30dBm próximo, -80dBm no limite

class Modem:
    def __init__(self, env, id, x, y):
        self.env = env
        self.id = id
        self.x = x
        self.y = y

class RouterMesh:
    def __init__(self, env, id, x, y, connected_to=None):
        self.env = env
        self.id = id
        self.x = x
        self.y = y
        self.connected_to = connected_to
        self.conectado = False

    def conectar(self, outro):
        self.connected_to = outro.id
        self.conectado = True

class RaspberryPi:
    def __init__(self, env, id, path, logs):
        self.env = env
        self.id = id
        self.path = path
        self.x, self.y = path[0]
        self.idx = 0
        self.logs = logs
        env.process(self.mover())

    def mover(self):
        while self.idx < len(self.path):
            self.x, self.y = self.path[self.idx]
            self.logs.append([self.env.now, self.id, 'move', f'{self.x},{self.y}'])
            self.idx += 1
            yield self.env.timeout(2)

    def escanear(self, roteadores):
        sinais = []
        for r in roteadores:
            dist = math.hypot(self.x - r.x, self.y - r.y)
            sinal = rssi(dist)
            if sinal is not None:
                sinais.append(f'{r.id} ({sinal:.1f} dBm)')
                self.logs.append([self.env.now, self.id, 'scan', f'{r.id},{sinal:.1f},{self.x},{self.y}'])
        if not sinais:
            self.logs.append([self.env.now, self.id, 'scan', 'Nenhum roteador ao alcance'])

class RaspCarRout:
    def __init__(self, env, id, path, logs):
        self.env = env
        self.id = id
        self.path = path
        self.x, self.y = path[0]
        self.idx = 0
        self.roteador = RouterMesh(env, id + '_rout', self.x, self.y)
        self.logs = logs
        env.process(self.mover())

    def mover(self):
        while self.idx < len(self.path):
            self.x, self.y = self.path[self.idx]
            self.roteador.x, self.roteador.y = self.x, self.y
            self.logs.append([self.env.now, self.id, 'move', f'{self.x},{self.y}'])
            self.idx += 1
            yield self.env.timeout(2)

    def escanear(self, roteadores):
        sinais = []
        for r in roteadores:
            dist = math.hypot(self.x - r.x, self.y - r.y)
            sinal = rssi(dist)
            if sinal is not None:
                sinais.append(f'{r.id} ({sinal:.1f} dBm)')
                self.logs.append([self.env.now, self.id, 'scan', f'{r.id},{sinal:.1f},{self.x},{self.y}'])
        if not sinais:
            self.logs.append([self.env.now, self.id, 'scan', 'Nenhum roteador ao alcance'])

    def conectar_mesh(self, roteadores):
        for r in roteadores:
            dist = math.hypot(self.roteador.x - r.x, self.roteador.y - r.y)
            if dist <= ALCANCE_WIFI:
                if not self.roteador.conectado or self.roteador.connected_to != r.id:
                    self.roteador.conectar(r)
                    self.logs.append([self.env.now, self.id, 'mesh_connect', f'Conectou à mesh via {r.id}'])
                return
        if self.roteador.conectado:
            self.logs.append([self.env.now, self.id, 'mesh_disconnect', 'Perdeu conexão mesh'])
            self.roteador.conectado = False
            self.roteador.connected_to = None

def exportar_logs_csv(logs, nome_arquivo):
    with open(nome_arquivo, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['tempo', 'dispositivo', 'evento', 'detalhes'])
        writer.writerows(logs)
    print(f'Logs exportados para {nome_arquivo}')

def plotar_trajetoria_e_rssi(logs, dispositivo_id):
    xs, ys, ts = [], [], []
    rssi_dict = {}
    for row in logs:
        tempo, disp, evento, detalhes = row
        if disp == dispositivo_id and evento == 'move':
            x, y = map(float, detalhes.split(','))
            xs.append(x)
            ys.append(y)
            ts.append(tempo)
        if disp == dispositivo_id and evento == 'scan' and 'Nenhum' not in detalhes:
            r_id, rssi_val, x, y = detalhes.split(',')
            rssi_dict.setdefault(r_id, []).append((float(tempo), float(rssi_val)))
    # Trajetória
    plt.figure(figsize=(8,4))
    plt.subplot(1,2,1)
    plt.plot(xs, ys, marker='o')
    plt.title(f'Trajetória de {dispositivo_id}')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.grid(True)
    # RSSI
    plt.subplot(1,2,2)
    for r_id, valores in rssi_dict.items():
        tempos, rssis = zip(*valores)
        plt.plot(tempos, rssis, marker='x', label=r_id)
    plt.title(f'RSSI de {dispositivo_id}')
    plt.xlabel('Tempo (s)')
    plt.ylabel('RSSI (dBm)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

def ler_cenario_json(nome_arquivo):
    with open(nome_arquivo, 'r') as f:
        config = json.load(f)
    return config

def cenario1():
    print("\n=== CENÁRIO 1: Raspberry móvel escaneando mesh ===")
    logs = []
    env = simpy.Environment()
    modem = Modem(env, 'modem1', 0, 0)
    router1 = RouterMesh(env, 'router1', 10, 0, connected_to='modem1')
    router2 = RouterMesh(env, 'router2', 20, 0, connected_to='router1')
    roteadores = [router1, router2]
    rasp = RaspberryPi(env, 'rasp1', [(0,0), (5,0), (10,0), (15,0), (20,0), (25,0)], logs)

    def escanear_periodicamente(env, dispositivos, roteadores):
        while True:
            for d in dispositivos:
                d.escanear(roteadores)
            yield env.timeout(2)

    env.process(escanear_periodicamente(env, [rasp], roteadores))
    env.run(until=16)
    exportar_logs_csv(logs, 'logs_cenario1.csv')
    # Análise automática
    eventos = ler_logs_csv('logs_cenario1.csv')
    rssi_por_roteador, tempos, handovers, desconexoes = analisar_conectividade(eventos, 'rasp1')
    plotar_analise(rssi_por_roteador, handovers, desconexoes, 'rasp1')
    gerar_relatorio(rssi_por_roteador, handovers, desconexoes, 'analise_cenario1.txt')

def cenario2():
    print("\n=== CENÁRIO 2: RaspCarRout (carro+roteador) móvel ===")
    logs = []
    env = simpy.Environment()
    modem = Modem(env, 'modem1', 0, 0)
    router1 = RouterMesh(env, 'router1', 10, 0, connected_to='modem1')
    router2 = RouterMesh(env, 'router2', 20, 0, connected_to='router1')
    roteadores = [router1, router2]
    rasp_car = RaspCarRout(env, 'rasp-car', [(0,0), (5,0), (10,0), (15,0), (20,0), (25,0)], logs)

    def escanear_e_conectar(env, rasp_car, roteadores):
        while True:
            rasp_car.escanear(roteadores)
            rasp_car.conectar_mesh(roteadores)
            yield env.timeout(2)

    env.process(escanear_e_conectar(env, rasp_car, roteadores))
    env.run(until=16)
    exportar_logs_csv(logs, 'logs_cenario2.csv')
    # Análise automática
    eventos = ler_logs_csv('logs_cenario2.csv')
    rssi_por_roteador, tempos, handovers, desconexoes = analisar_conectividade(eventos, 'rasp-car')
    plotar_analise(rssi_por_roteador, handovers, desconexoes, 'rasp-car')
    gerar_relatorio(rssi_por_roteador, handovers, desconexoes, 'analise_cenario2.txt')

def cenario_json(nome_arquivo):
    print(f"\n=== CENÁRIO VIA JSON: {nome_arquivo} ===")
    logs = []
    config = ler_cenario_json(nome_arquivo)
    env = simpy.Environment()
    dispositivos = []
    roteadores = []
    for r in config['roteadores']:
        roteadores.append(RouterMesh(env, r['id'], r['x'], r['y'], connected_to=r.get('connected_to')))
    for d in config['dispositivos']:
        if d['tipo'] == 'raspberry':
            dispositivos.append(RaspberryPi(env, d['id'], d['path'], logs))
        elif d['tipo'] == 'rasp-car-rout':
            dispositivos.append(RaspCarRout(env, d['id'], d['path'], logs))
    def escanear_periodicamente(env, dispositivos, roteadores):
        while True:
            for d in dispositivos:
                if isinstance(d, RaspCarRout):
                    d.escanear(roteadores)
                    d.conectar_mesh(roteadores)
                else:
                    d.escanear(roteadores)
            yield env.timeout(2)
    env.process(escanear_periodicamente(env, dispositivos, roteadores))
    env.run(until=config.get('tempo', 16))
    exportar_logs_csv(logs, 'logs_cenario_json.csv')
    # Análise automática para cada dispositivo
    for d in dispositivos:
        eventos = ler_logs_csv('logs_cenario_json.csv')
        rssi_por_roteador, tempos, handovers, desconexoes = analisar_conectividade(eventos, d.id)
        plotar_analise(rssi_por_roteador, handovers, desconexoes, d.id)
        gerar_relatorio(rssi_por_roteador, handovers, desconexoes, f'analise_{d.id}.txt')

def main():
    print("Escolha o cenário para simular:")
    print("1 - Raspberry móvel escaneando mesh")
    print("2 - RaspCarRout (carro+roteador) móvel")
    print("3 - Ler cenário via JSON (arquivo: cenario.json)")
    escolha = input("Digite 1, 2 ou 3: ").strip()
    if escolha == '1':
        cenario1()
    elif escolha == '2':
        cenario2()
    elif escolha == '3':
        cenario_json('cenario.json')
    else:
        print("Opção inválida.")

if __name__ == '__main__':
    main() 