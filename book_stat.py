import pandas as pd
import requests
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import matplotlib.pyplot as plt
import os
from collections import OrderedDict
import pytz

# 다운로드 폴더 경로 설정
download_folder = 'C:\\Users\\space\\app\\book stat'
csv_file_path = 'C:\\Users\\space\\app\\book stat\\books_data1.csv'

# CSV 파일 읽기
try:
    df = pd.read_csv(csv_file_path)
except pd.errors.ParserError as e:
    print(f"CSV 파일을 읽는 중에 오류가 발생했습니다: {e}")
    raise
except FileNotFoundError as e:
    print(f"CSV 파일이 경로에 없습니다: {csv_file_path}")
    raise
except Exception as e:
    print(f"예상치 못한 오류가 발생했습니다: {e}")
    raise

# 읽기 완료 날짜를 datetime 형식으로 변환하고 시간대 설정
df['end'] = pd.to_datetime(df['end'], utc=True).dt.tz_convert('Asia/Seoul')

# 날짜 범위 설정 (2023년 8월부터 현재까지)
seoul_tz = pytz.timezone('Asia/Seoul')
start_date = pd.Timestamp(year=2023, month=8, day=1, tz=seoul_tz)
end_date = pd.Timestamp.now(tz=seoul_tz)
date_range = pd.date_range(start_date, end_date, freq='M', tz=seoul_tz)

# 월별 데이터 정리 (최신 순으로 정렬)
monthly_data = df[df['end'] >= start_date].sort_values('end', ascending=False).groupby(df['end'].dt.to_period('M'))

# 이미지 리스트 초기화
monthly_images = OrderedDict()

# 각 월별 데이터를 반복하면서 이미지를 다운로드하고 저장
for date in date_range:
    month = date.to_period('M')
    if month in monthly_data.groups:
        images = []
        for _, row in monthly_data.get_group(month).iterrows():
            response = requests.get(row['coverSmallUrl'])
            img = Image.open(BytesIO(response.content))
            images.append(img)
        monthly_images[str(month)] = images
    else:
        monthly_images[str(month)] = []  # 책을 읽지 않은 달은 빈 리스트로 표시

# 이미지 크기 설정
width, height = 200, 300
month_label_height = 50  # 월과 책 권수를 표시하기 위한 높이

# 최대 책 수 찾기
max_books = max(len(images) for images in monthly_images.values())

# 월별 이미지 생성
monthly_combined_images = []
for month, images in monthly_images.items():
    total_height = height * max_books + month_label_height
    combined_image = Image.new('RGB', (width, total_height), color='white')
    
    # 책 표지 이미지 붙이기 (하단부터 상단으로, 가장 최근 책이 위에 오도록)
    y_offset = total_height - month_label_height - height
    for img in reversed(images):
        resized_img = img.resize((width, height))
        combined_image.paste(resized_img, (0, y_offset))
        y_offset -= height
    
    # 월 및 책 권수 표시 (하단에)
    draw = ImageDraw.Draw(combined_image)
    font = ImageFont.load_default()
    month_text = f"{month} - {len(images)} books"
    text_bbox = draw.textbbox((0, 0), month_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    draw.text(((width - text_width) / 2, total_height - month_label_height + (month_label_height - text_height) / 2), 
              month_text, fill='black', font=font)
    
    monthly_combined_images.append(combined_image)

# 전체 이미지 크기 계산
total_width = width * len(monthly_combined_images)
max_height = max(img.size[1] for img in monthly_combined_images)

# 새 이미지를 생성하여 월별 이미지를 수평으로 정렬
final_image = Image.new('RGB', (total_width, max_height), color='white')

x_offset = 0
for img in monthly_combined_images:  # 최신 달이 오른쪽에 오도록 순서 변경
    final_image.paste(img, (x_offset, 0))
    x_offset += width

# 생성된 이미지를 파일로 저장
output_file_path = os.path.join(download_folder, "books_read_since_aug_2023.png")
final_image.save(output_file_path)

# 이미지를 시각화
plt.figure(figsize=(20, 10))
plt.imshow(final_image)
plt.axis('off')
plt.title("Books Read Since August 2023 (Oldest Month at Left, Most Recent Books on Top)")
plt.show()

print(f"이미지가 {output_file_path}에 저장되었습니다.")
