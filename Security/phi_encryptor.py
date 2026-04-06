import numpy as np
import os

# Пути
INPUT_FILE = "../Geometry/Ultra-HD.npy"
OUTPUT_FILE = "../App_Prototype/WEB_READY_GIDEON.npy"

def encrypt():
    if not os.path.exists(INPUT_FILE):
        print(f"[-] Файл {INPUT_FILE} не найден в Geometry!")
        return

    # Загружаем 1.35 млн точек
    data = np.load(INPUT_FILE)
    phi = (1 + 5**0.5) / 2
    
    print(f"[+] Шифрование {len(data)} вокселей...")
    
    # Внедряем микро-смещение PHI (защитный слой)
    # Это создает уникальный "отпечаток" для каждого адреса
    indices = np.arange(len(data)).reshape(-1, 1)
    noise = np.sin(indices * phi) * 0.001
    encrypted_data = data + noise
    
    # Сохраняем готовую модель прямо в папку приложения
    np.save(OUTPUT_FILE, encrypted_data.astype(np.float32))
    print(f"[+] Готово! Файл для веба создан: {OUTPUT_FILE}")

if __name__ == "__main__":
    encrypt()
