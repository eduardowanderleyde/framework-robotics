import simpy
import math
import random

ALCANCE_WIFI = 120  # alcance do roteador

class Componente:
    def __init__(self, env, nome, tipo, x, y):
        self.env = env
        self.nome = nome
        self.tipo = tipo
        self.x = x
        self.y = y

    def distancia(self, outro):
        return math.hypot(self.x - outro.x, self.y - outro.y)

    def __repr__(self):
        return f"{self.nome} ({self.tipo}) em ({self.x:.1f}, {self.y:.1f})"

def mover_carro(env, carro, dx, dy, intervalo):
    while True:
        carro.x += dx
        carro.y += dy
        print(f"[{env.now}s] {carro.nome} moveu para ({carro.x:.1f}, {carro.y:.1f})")
        yield env.timeout(intervalo)

def checar_conexoes(env, componentes, estado_conexoes):
    while True:
        for c1 in componentes:
            for c2 in componentes:
                if c1 != c2 and (c1.tipo.startswith('car') or c2.tipo.startswith('car')):
                    dist = c1.distancia(c2)
                    conectado = dist <= ALCANCE_WIFI
                    chave = tuple(sorted([c1.nome, c2.nome]))
                    if estado_conexoes.get(chave) != conectado:
                        status = 'Conectou' if conectado else 'Desconectou'
                        print(f"[{env.now}s] {c1.nome} ↔ {c2.nome}: {status} (dist={dist:.1f})")
                        estado_conexoes[chave] = conectado
        yield env.timeout(1)

def enviar_pacote(env, origem, destino, delay=2, perda=0.1):
    yield env.timeout(delay)
    if random.random() < perda:
        print(f"[{env.now}s] Pacote de {origem.nome} para {destino.nome} PERDIDO")
    else:
        print(f"[{env.now}s] Pacote de {origem.nome} para {destino.nome} ENTREGUE")

def main():
    env = simpy.Environment()
    # Componentes do cenário
    roteador1 = Componente(env, "roteador1", "router", 0, 0)
    carro1 = Componente(env, "carro1", "car-router", 50, 0)
    carro2 = Componente(env, "carro2", "car-router-pi", 200, 0)
    pi1 = Componente(env, "raspberry1", "pi", 100, 100)
    componentes = [roteador1, carro1, carro2, pi1]
    estado_conexoes = {}

    # Movimento dos carros
    env.process(mover_carro(env, carro1, 10, 0, 2))  # carro1 move para a direita
    env.process(mover_carro(env, carro2, -5, 5, 3))  # carro2 faz diagonal

    # Checagem de conexões
    env.process(checar_conexoes(env, componentes, estado_conexoes))

    # Simulação de envio de pacotes
    env.process(enviar_pacote(env, carro1, roteador1, delay=3, perda=0.2))
    env.process(enviar_pacote(env, carro2, pi1, delay=5, perda=0.1))

    env.run(until=30)

if __name__ == "__main__":
    main() 