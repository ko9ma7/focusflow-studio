# FocusFlow Studio

> **바이브 코딩으로 만들고 GitHub Pages에 1분 만에 올린 무설치 포모도로 & 실시간 사운드 집중 스튜디오**

- **라이브 데모 (GitHub Pages)**: [https://ko9ma7.github.io/focusflow-studio/](https://ko9ma7.github.io/focusflow-studio/)
- **블로그 가이드**: KO9MA LAB 네이버 블로그 (`https://blog.naver.com/ko9ma7`)

---

## 어떤 기술이 들어갔나요?

1. **Zero-Backend 순수 정적 웹 (`HTML5 + CSS3 + Vanilla JS`)**
   - 별도 서버(Node.js, Python 등)나 복잡한 빌드 도구(Webpack, Vite) 없이 파일 3개(`index.html`, `styles.css`, `app.js`)만으로 동작합니다.
   - 덕분에 GitHub Pages 무료 호스팅에 올리면 전 세계 어디서나 0원으로 즉시 접속할 수 있습니다.
2. **Web Audio API 실시간 절차적 사운드 합성**
   - MP3 음원 파일을 서버에 올리지 않고, 브라우저 내장 오디오 엔진(`AudioContext`, `AudioBuffer`, `BiquadFilterNode`)으로 **빗소리·브라운 노이즈·백색소음**을 실시간 생성합니다.
3. **SVG 원형 프로그레스 링 & LocalStorage 영속성**
   - `stroke-dashoffset` 애니메이션으로 부드러운 타이머 링을 구현했고, 오늘의 할 일과 완료 세션 통계는 내 브라우저(`localStorage`)에만 안전하게 저장됩니다.
4. **GitHub Actions 자동 배포 파이프라인**
   - `.github/workflows/deploy-pages.yml`이 포함되어 있어, 코드를 수정하고 `git push`만 하면 GitHub Pages가 자동으로 새 버전을 배포합니다.

---

## 내 GitHub에 그대로 복제해서 올리는 법

```bash
# 1. 저장소 복제 또는 내 저장소로 Fork
git clone https://github.com/ko9ma7/focusflow-studio.git
cd focusflow-studio

# 2. 수정 후 내 GitHub 저장소에 Push
git add .
git commit -m "Customize FocusFlow Studio"
git push origin main
```

GitHub 저장소의 **Settings → Pages → Source**에서 `GitHub Actions`를 선택하면 즉시 나만의 URL(`https://<내아이디>.github.io/focusflow-studio/`)이 열립니다.
