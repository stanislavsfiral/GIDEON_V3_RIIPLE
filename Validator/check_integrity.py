import numpy as np
import os

FILE_PATH = "../Geometry/Ultra-HD.npy"

def validate():
    if not os.path.exists(FILE_PATH):
        print(f"[-] Ошибка: Файл {FILE_PATH} не найден!")
        return

    data = np.load(FILE_PATH)
    total_pts = len(data)
    
    print("--- GIDEON INTEGRITY REPORT ---")
    print(f"[+] Всего точек: {total_pts}")
    
    # Проверка на соответствие Пента-процессору (5 рамок по 10 уровней)
    expected = 5 * 1023 * 264
    if total_pts == expected:
        print("[+] Статус: ULTRA-HD СТАНДАРТ ПОДТВЕРЖДЕН")
    else:
        print(f"[!] Внимание: Количество точек ({total_pts}) отличается от эталона ({expected})")

    # Проверка адресации (88-44-44-88)
    if total_pts % 264 == 0:
        print(f"[+] Адресация: OK (Обнаружено {total_pts // 264} блоков по 264 точки)")
    else:
        print("[!] Ошибка: Нарушена целостность блоков сфиралей!")

if __name__ == "__main__":
    validate()