import mysql.connector
from datetime import datetime
from config import MYSQL_CONFIG

class ViolationDB:
    def __init__(self):
        try:
            self.conn = mysql.connector.connect(**MYSQL_CONFIG)
            self.cursor = self.conn.cursor()
            self.create_table()
        except mysql.connector.Error as err:
            print(f"Lỗi kết nối MySQL: {err}")

    def create_table(self):
        # Tạo bảng lưu trữ vi phạm nếu chưa tồn tại
        query = """
        CREATE TABLE IF NOT EXISTS violations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME,
            violation_type VARCHAR(255),
            image_path VARCHAR(255),
            status VARCHAR(50)
        )
        """
        self.cursor.execute(query)
        self.conn.commit()

    def log_violation(self, v_type, img_path):
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        query = "INSERT INTO violations (timestamp, violation_type, image_path, status) VALUES (%s, %s, %s, %s)"
        values = (now, v_type, img_path, "DANGER")
        try:
            self.cursor.execute(query, values)
            self.conn.commit()
        except mysql.connector.Error as err:
            print(f"Lỗi khi lưu dữ liệu vào MySQL: {err}")