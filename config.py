# Cấu hình MySQL
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',      # Thay bằng user của bạn
    'password': '',      # Thay bằng password của bạn
    'database': 'ppe_db'
}

# Giữ nguyên các cấu hình cũ
MODEL_PATH = 'weights/best.pt'
WINDOW_TITLE = "Hệ thống Giám sát An toàn Lao động (PPE)"
WINDOW_SIZE = "1100x750"

CLASSES = ['Vest', 'Gloves', 'Shoes', 'Person', 'Helmet']