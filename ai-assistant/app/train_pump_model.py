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
        print(f"Tải dữ liệu thành công từ: {path}")
        print(f"Kích thước dữ liệu ban đầu: {df.shape}")
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

    print("\n--- Bắt đầu tiền xử lý ---")
    print("\n--- Thông tin dữ liệu (dtypes, non-null counts) ---")
    df.info()

    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    print("\n--- Kiểm tra giá trị thiếu ---")
    missing_values = df.isnull().sum()
    print(missing_values[missing_values > 0])
    if missing_values.sum() > 0:
        print("\nCẢNH BÁO: Có giá trị thiếu. Đang xóa các hàng có giá trị thiếu.")
        original_rows = df.shape[0]
        df.dropna(inplace=True)
        print(f"Đã xóa {original_rows - df.shape[0]} hàng.")
        print(f"Kích thước dữ liệu sau khi xóa NaN: {df.shape}")
    else:
        print("Không tìm thấy giá trị thiếu.")

    print("\n--- Thống kê mô tả (trước scaling) ---")
    print(df.describe().round(2))

    print("\n--- Phân bổ biến mục tiêu (Pump Data) ---")
    target_counts = df['Pump Data'].value_counts(normalize=True) * 100
    print(target_counts)
    if abs(target_counts.iloc[0] - target_counts.iloc[1]) > 20:
        print("CẢNH BÁO: Dữ liệu có vẻ mất cân bằng.")

    features = ['Soil Moisture', 'Temperature', 'Air Humidity']
    target = 'Pump Data'
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

    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=features, index=X_train.index)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=features, index=X_test.index)

    print("\n--- Xem 5 dòng đầu của X_train sau khi chuẩn hóa ---")
    print(X_train_scaled_df.head())
    print("\n--- Thống kê mô tả X_train sau khi chuẩn hóa ---")
    print(X_train_scaled_df.describe().round(2))

    print("\n--- Tiền xử lý hoàn tất ---")
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, features

def train_logistic_regression(X_train_scaled, y_train):
    print("\n--- Huấn luyện mô hình Logistic Regression ---")
    model = LogisticRegression(random_state=RANDOM_STATE)
    model.fit(X_train_scaled, y_train)
    print("Huấn luyện Logistic Regression hoàn tất.")
    return model

def train_random_forest(X_train_scaled, y_train):
    print("\n--- Huấn luyện mô hình Random Forest ---")
    model = RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=100)
    model.fit(X_train_scaled, y_train)
    print("Huấn luyện Random Forest hoàn tất.")
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

    X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names = preprocess_data(data_df)

    if X_train_scaled is not None and scaler is not None:

        lr_model = train_logistic_regression(X_train_scaled, y_train)
        evaluate_model(lr_model, "Logistic Regression", X_test_scaled, y_test)
        save_pipeline(lr_model, scaler, LR_MODEL_PATH, SCALER_PATH)

        print("\n" + "="*50 + "\n")

        rf_model = train_random_forest(X_train_scaled, y_train)
        evaluate_model(rf_model, "Random Forest", X_test_scaled, y_test)
        save_pipeline(rf_model, scaler, RF_MODEL_PATH, SCALER_PATH)

        print("\n--- Quá trình huấn luyện và đánh giá hoàn tất ---")
    else:
        print("\n--- Không thể tiếp tục do lỗi ở bước tải hoặc tiền xử lý dữ liệu ---")