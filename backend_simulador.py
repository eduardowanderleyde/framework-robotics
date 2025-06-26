from flask import Flask, request, jsonify
import subprocess
import tempfile
import os

app = Flask(__name__)

@app.route('/simular', methods=['POST'])
def simular():
    dados = request.json
    # Salva o cenário recebido em um arquivo temporário
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json', mode='w') as f:
        import json
        json.dump(dados, f)
        temp_json = f.name

    # Chama o script Python de simulação, passando o arquivo como argumento
    # Exemplo: python simulador_simpy.py temp_json
    try:
        resultado = subprocess.check_output(['python', 'simulador_simpy.py', temp_json], stderr=subprocess.STDOUT, text=True, timeout=30)
    except subprocess.CalledProcessError as e:
        resultado = e.output
    except Exception as e:
        resultado = str(e)

    # Remove o arquivo temporário
    os.remove(temp_json)
    return jsonify({'log': resultado})

if __name__ == '__main__':
    app.run(port=5000, debug=True) 