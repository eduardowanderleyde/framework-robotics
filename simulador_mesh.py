import simpy
import math

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
    def __init__(self, env, id, x, y, connected_to=None, movel=False, path=None):
        self.env = env
        self.id = id
        self.x = x
        self.y = y
        self.connected_to = connected_to
        self.movel = movel
        self.path = path or [(x, y)]
        self.idx = 0
        if movel:
            env.process(self.mover())

    def mover(self):
        while self.idx < len(self.path):
            self.x, self.y = self.path[self.idx]
            print(f'[{self.env.now:05.1f}] {self.id} (roteador móvel) moveu para ({self.x},{self.y})')
            self.idx += 1
            yield self.env.timeout(2)

class RaspberryPi:
    def __init__(self, env, id, path):
        self.env = env
        self.id = id
        self.path = path
        self.x, self.y = path[0]
        self.idx = 0
        env.process(self.mover())

    def mover(self):
        while self.idx < len(self.path):
            self.x, self.y = self.path[self.idx]
            print(f'[{self.env.now:05.1f}] {self.id} moveu para ({self.x},{self.y})')
            self.idx += 1
            yield self.env.timeout(2)

    def escanear(self, roteadores):
        for r in roteadores:
            dist = math.hypot(self.x - r.x, self.y - r.y)
            sinal = rssi(dist)
            if sinal is not None:
                print(f'[{self.env.now:05.1f}] {self.id}: Scan -> Encontrou {r.id} a {sinal:.1f} dBm')
            else:
                print(f'[{self.env.now:05.1f}] {self.id}: Scan -> {r.id} fora de alcance')

class RaspCarRout(RaspberryPi):
    pass  # Mesmo comportamento, mas pode ser expandido

def simular():
    env = simpy.Environment()
    # Configuração do cenário pelo "usuário"
    modem = Modem(env, 'modem1', 0, 0)
    router2 = RouterMesh(env, 'router2', 10, 5, connected_to='modem1')
    router3 = RouterMesh(env, 'router3', 20, 10, connected_to='router2', movel=True, path=[(20,10), (25,15), (30,20)])
    roteadores = [router2, router3]

    rasp1 = RaspberryPi(env, 'rasp1', [(1,1), (2,2), (3,3), (10,5), (20,10)])
    car = RaspCarRout(env, 'car1', [(5,5), (10,10), (15,15), (20,10)])
    dispositivos_moveis = [rasp1, car]

    def escanear_periodicamente(env, dispositivos, roteadores):
        while True:
            for d in dispositivos:
                d.escanear(roteadores)
            yield env.timeout(2)

    print("=== Simulação de Mesh Wi-Fi ===")
    print("Cenário configurado pelo usuário:")
    print("- Modem fixo em (0,0)")
    print("- Router2 fixo em (10,5), conectado ao modem")
    print("- Router3 móvel, começa em (20,10), conectado ao router2")
    print("- RaspberryPi (rasp1) e Carro (car1) com caminhos definidos")
    print("Iniciando simulação...\n")

    env.process(escanear_periodicamente(env, dispositivos_moveis, roteadores))
    env.run(until=20)

if __name__ == '__main__':
    simular() 