import csv
import matplotlib.pyplot as plt

RSSI_FRACO = -70  # dBm

# Lê o CSV de logs e retorna uma lista de eventos
def ler_logs_csv(nome_arquivo):
    eventos = []
    with open(nome_arquivo, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            eventos.append(row)
    return eventos

# Analisa RSSI, handovers e desconexões
def analisar_conectividade(eventos, dispositivo_id):
    rssi_por_roteador = {}
    tempos = set()
    handovers = []
    desconexoes = []
    ultimo_conectado = None
    ultimo_rssi = {}
    for ev in eventos:
        if ev['dispositivo'] == dispositivo_id and ev['evento'] == 'scan' and 'Nenhum' not in ev['detalhes']:
            r_id, rssi_val, x, y = ev['detalhes'].split(',')
            rssi_val = float(rssi_val)
            rssi_por_roteador.setdefault(r_id, []).append((float(ev['tempo']), rssi_val, float(x), float(y)))
            tempos.add(float(ev['tempo']))
            # Handover: troca de roteador dominante
            if ultimo_conectado is None or rssi_val > ultimo_rssi.get(ultimo_conectado, -999):
                if ultimo_conectado != r_id:
                    handovers.append((float(ev['tempo']), r_id, rssi_val, float(x), float(y)))
                    ultimo_conectado = r_id
            ultimo_rssi[r_id] = rssi_val
        elif ev['dispositivo'] == dispositivo_id and ev['evento'] == 'scan' and 'Nenhum' in ev['detalhes']:
            desconexoes.append((float(ev['tempo']), float(ev['tempo'])))
    return rssi_por_roteador, sorted(list(tempos)), handovers, desconexoes

# Gera gráfico com destaques
def plotar_analise(rssi_por_roteador, handovers, desconexoes, dispositivo_id):
    plt.figure(figsize=(10,5))
    for r_id, valores in rssi_por_roteador.items():
        tempos, rssis, xs, ys = zip(*valores)
        plt.plot(tempos, rssis, marker='o', label=f'{r_id}')
        # Destacar zonas de sinal fraco
        plt.fill_between(tempos, rssis, RSSI_FRACO, where=[r <= RSSI_FRACO for r in rssis], color='red', alpha=0.2)
    # Destacar handovers
    for t, r_id, rssi, x, y in handovers:
        plt.axvline(t, color='orange', linestyle='--', alpha=0.5)
        plt.text(t, rssi, f'Handover→{r_id}', rotation=90, va='bottom', ha='right', fontsize=8, color='orange')
    plt.title(f'RSSI e Handovers de {dispositivo_id}')
    plt.xlabel('Tempo (s)')
    plt.ylabel('RSSI (dBm)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

# Gera relatório em texto
def gerar_relatorio(rssi_por_roteador, handovers, desconexoes, nome_arquivo):
    with open(nome_arquivo, 'w') as f:
        f.write('=== Relatório de Análise de Conectividade ===\n')
        total_pontos = sum(len(v) for v in rssi_por_roteador.values())
        f.write(f'Total de pontos de escaneamento: {total_pontos}\n')
        for r_id, valores in rssi_por_roteador.items():
            rssis = [r for _, r, _, _ in valores]
            f.write(f'\nRoteador {r_id}:\n')
            f.write(f'  Média RSSI: {sum(rssis)/len(rssis):.1f} dBm\n')
            f.write(f'  Sinal mais forte: {max(rssis):.1f} dBm\n')
            f.write(f'  Sinal mais fraco: {min(rssis):.1f} dBm\n')
            fracos = sum(1 for r in rssis if r <= RSSI_FRACO)
            f.write(f'  Pontos de sinal fraco (≤{RSSI_FRACO} dBm): {fracos}\n')
        f.write(f'\nTotal de handovers: {len(handovers)}\n')
        for t, r_id, rssi, x, y in handovers:
            f.write(f'  Handover para {r_id} em t={t:.1f}s, RSSI={rssi:.1f} dBm, pos=({x},{y})\n')
        f.write(f'\nTotal de períodos de desconexão: {len(desconexoes)}\n')
        for t0, t1 in desconexoes:
            f.write(f'  Desconexão em t={t0:.1f}s\n')
        f.write('\nSugestão: Posicione roteadores para minimizar zonas de sinal fraco e reduzir handovers/desconexões.\n')
    print(f'Relatório salvo em {nome_arquivo}')

if __name__ == '__main__':
    # Analisa logs do cenário 2 por padrão
    arquivo = 'logs_cenario2.csv'
    dispositivo = 'rasp-car'
    eventos = ler_logs_csv(arquivo)
    rssi_por_roteador, tempos, handovers, desconexoes = analisar_conectividade(eventos, dispositivo)
    plotar_analise(rssi_por_roteador, handovers, desconexoes, dispositivo)
    gerar_relatorio(rssi_por_roteador, handovers, desconexoes, 'analise_cenario2.txt') 