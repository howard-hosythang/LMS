cd "/Users/hosythang/Desktop/Rốt lập trình/LMS/LMS_FE"
npm run dev -- --host 127.0.0.1 --port 5174



cd "/Users/hosythang/Desktop/Rốt lập trình/LMS"

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --force-device-scale-factor=3 \
  --screenshot=LMS_FE/public/Poster2_HK252-DATN-330_2213188.png \
  --window-size=1080,1350 \
  "http://127.0.0.1:5174/Poster2_HK252-DATN-330_2213188.html?export=1"
