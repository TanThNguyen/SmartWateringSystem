import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
import numpy as np

DATA_PATH = '../data/data.csv'
MODEL_DIR = '../models_trained'
SCALER_PATH = os.path.join(MODEL_DIR, 'pump_scaler.joblib')
LR_MODEL_PATH = os.path.join(MODEL_DIR, 'pump_logistic_regression.joblib')
RF_MODEL_PATH = os.path.join(MODEL_DIR, 'pump_random_forest.joblib')
RANDOM_STATE = 42
TEST_SIZE = 0.2

os.makedirs(MODEL_DIR, exist_ok=True)

def load_data(path):
    try:
        df = pd.read_csv(path)
        print(f"Tải dữ liệu thành công từ: {path} ({df.shape[0]} dòng, {df.shape[1]} cột)")
        print("\n--- 10 dòng dữ liệu đầu tiên ---")
        print(df.head(10))
        return df
    except FileNotFoundError:
        print(f"LỖI: Không tìm thấy file dữ liệu tại '{path}'.")
        return None
    except Exception as e:
        print(f"Lỗi khi tải dữ liệu: {e}")
        return None

def preprocess_data(df):
    if df is None:
        return None, None, None, None, None, None

    # Thông tin cơ bản
    print("\n--- Bắt đầu tiền xử lý & Phân tích dữ liệu ---")
    print("\n--- Thông tin dữ liệu (dtypes, non-null counts) ---")
    df.info()

    # Xử lý giá trị vô hạn
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Kiểm tra và xử lý giá trị thiếu
    print("\n--- Kiểm tra giá trị thiếu ---")
    missing_values = df.isnull().sum()
    if missing_values.sum() > 0:
        print("\nCẢNH BÁO: Có giá trị thiếu. Đang xóa các hàng có giá trị thiếu.")
        print(missing_values[missing_values > 0]) # In ra cột nào bị thiếu
        original_rows = df.shape[0]
        df.dropna(inplace=True)
        print(f"Đã xóa {original_rows - df.shape[0]} hàng.")
    else:
        print("Không tìm thấy giá trị thiếu.")

    # Biến đổi Soil Moisture
    print("\n--- Chia giá trị 'Soil Moisture' cho 10 ---")
    if 'Soil Moisture' in df.columns:
        df['Soil Moisture'] = df['Soil Moisture'] / 12.0
        print("'Soil Moisture' đã được chia cho 10.")
    else:
        print("CẢNH BÁO: Không tìm thấy cột 'Soil Moisture' để chia.")

    # Thống kê mô tả sau khi biến đổi Soil Moisture
    print("\n--- Thống kê mô tả (Soil Moisture đã chia 10) ---")
    print(df.describe().round(2))

    # Phân bổ biến mục tiêu
    print("\n--- Phân bổ biến mục tiêu (Pump Data) ---")
    target_counts = df['Pump Data'].value_counts(normalize=True) * 100
    print(target_counts)
    if abs(target_counts.iloc[0] - target_counts.iloc[1]) > 20:
        print("CẢNH BÁO: Dữ liệu có vẻ mất cân bằng.")

    # --- BỔ SUNG: Trực quan hóa & Phân tích tương quan ---
    features = ['Soil Moisture', 'Temperature', 'Air Humidity']
    target = 'Pump Data'

    # 1. Trực quan hóa phân phối của các features
    print("\n--- Trực quan hóa phân phối Features (trước Standard Scaling) ---")
    plt.figure(figsize=(18, 5))
    for i, col in enumerate(features):
        plt.subplot(1, len(features), i + 1)
        sns.histplot(df[col], kde=True, bins=30)
        plt.title(f'Phân phối {col}')
    plt.tight_layout()
    plt.show() # Hiển thị đồ thị

    # 2. Tính toán và trực quan hóa ma trận tương quan
    print("\n--- Tính toán và trực quan hóa ma trận tương quan ---")
    # Chọn các cột số để tính tương quan (bao gồm cả target)
    cols_for_corr = features + [target]
    correlation_matrix = df[cols_for_corr].corr()
    plt.figure(figsize=(8, 6))
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=.5)
    plt.title('Ma trận tương quan các biến')
    plt.show() # Hiển thị đồ thị

    # 3. Phân tích tương quan với biến mục tiêu
    print("\n--- Phân tích tương quan giữa Features và Target (Pump Data) ---")
    target_correlation = correlation_matrix[target].drop(target).sort_values(ascending=False)
    print(target_correlation)
    # Nhận xét nhanh:
    strong_corr_threshold = 0.5 # Ngưỡng ví dụ cho tương quan mạnh
    neg_corr_threshold = -0.5
    high_corr_features = target_correlation[abs(target_correlation) >= strong_corr_threshold].index.tolist()
    if high_corr_features:
         print(f"Lưu ý: Các feature có tương quan mạnh (|corr| >= {strong_corr_threshold}) với target: {high_corr_features}")
         if 'Soil Moisture' in high_corr_features and target_correlation['Soil Moisture'] < neg_corr_threshold :
             print(" -> Soil Moisture có tương quan nghịch mạnh, phù hợp với logic: độ ẩm thấp -> bơm bật (target=1)")
    else:
        print(f"Không có feature nào có tương quan tuyệt đối >= {strong_corr_threshold} với target.")

    # 4. Trực quan hóa mối quan hệ giữa Feature quan trọng và Target (ví dụ: Soil Moisture)
    if 'Soil Moisture' in features:
        print("\n--- Trực quan hóa Soil Moisture vs Pump Data ---")
        plt.figure(figsize=(10, 6))
        sns.boxplot(data=df, x=target, y='Soil Moisture')
        plt.title('Phân phối Soil Moisture theo Pump Data')
        plt.xlabel('Pump Data (0: Off, 1: On)')
        plt.ylabel('Soil Moisture (đã chia 10)')
        plt.show() # Hiển thị đồ thị

        # Scatter plot ví dụ (có thể thêm nếu muốn)
        # plt.figure(figsize=(10, 6))
        # sns.scatterplot(data=df, x='Soil Moisture', y='Temperature', hue=target, alpha=0.6, palette='viridis')
        # plt.title('Soil Moisture vs Temperature (Màu theo Pump Data)')
        # plt.show()


    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print("\n--- Kích thước các tập sau khi chia ---")
    print(f"X_train: {X_train.shape}, X_test: {X_test.shape}")
    print(f"y_train: {y_train.shape}, y_test: {y_test.shape}")

    print("\n--- Chuẩn hóa dữ liệu (Scaling) ---")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("\n--- Tiền xử lý hoàn tất (sau khi phân tích/trực quan hóa) ---")
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, features

def train_logistic_regression(X_train_scaled, y_train):
    model = LogisticRegression(random_state=RANDOM_STATE)
    model.fit(X_train_scaled, y_train)
    return model

def train_random_forest(X_train_scaled, y_train):
    model = RandomForestClassifier(
        random_state=RANDOM_STATE,
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=10,
    )
    model.fit(X_train_scaled, y_train)
    return model

def evaluate_model(model, model_name, X_test_scaled, y_test):
    print(f"\n--- Đánh giá mô hình: {model_name} ---")
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    return accuracy

def save_pipeline(model, scaler, model_path, scaler_path):
    try:
        joblib.dump(model, model_path)
        print(f"Đã lưu mô hình vào: {model_path}")
        joblib.dump(scaler, scaler_path)
        print(f"Đã lưu scaler vào: {scaler_path}")
    except Exception as e:
        print(f"Lỗi khi lưu mô hình/scaler: {e}")

if __name__ == "__main__":
    data_df = load_data(DATA_PATH)

    if data_df is not None:
        X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names = preprocess_data(data_df)

        if X_train_scaled is not None and scaler is not None:
            print("\nBắt đầu huấn luyện và đánh giá...")

            lr_model = train_logistic_regression(X_train_scaled, y_train)
            evaluate_model(lr_model, "Logistic Regression", X_test_scaled, y_test)
            save_pipeline(lr_model, scaler, LR_MODEL_PATH, SCALER_PATH)

            print("\n" + "="*50 + "\n")

            rf_model = train_random_forest(X_train_scaled, y_train)
            evaluate_model(rf_model, "Random Forest", X_test_scaled, y_test)
            save_pipeline(rf_model, scaler, RF_MODEL_PATH, SCALER_PATH)

            print("\n--- Quá trình huấn luyện và đánh giá hoàn tất ---")
        else:
            print("\n--- Dừng lại do lỗi ở bước tiền xử lý dữ liệu ---")
    else:
        print("\n--- Dừng lại do lỗi ở bước tải dữ liệu ---")