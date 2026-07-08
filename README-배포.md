# CitedPage 배포·운영 안내서

스택: 정적 HTML + Cloudflare Pages(무료) + Pages Function(문의 폼) + 가비아 도메인.

## 1회성 배포 절차

### ① GitHub (사용자)
1. github.com → New repository → 이름 `citedpage` (Private 권장) → 생성
2. 저장소 주소(https://github.com/아이디/citedpage.git)를 Claude에게 전달 → 푸시는 Claude가

### ② Cloudflare 가입 + 도메인 등록 (사용자)
1. dash.cloudflare.com 가입 (무료 플랜)
2. "도메인 추가" → citedpage.com 입력 → Free 선택
3. 안내 화면에 나오는 **Cloudflare 네임서버 2개**를 메모

### ③ 가비아에서 네임서버 변경 (사용자)
1. 가비아 로그인 → My가비아 → 도메인 관리 → citedpage.com → 네임서버 설정
2. 1차·2차 네임서버를 ②에서 메모한 Cloudflare 것으로 교체 → 저장
3. 반영까지 보통 수분~수시간

### ④ Cloudflare Pages 연결 (사용자, Claude 안내 가능)
1. Cloudflare 대시보드 → Workers & Pages → Create → Pages → "Connect to Git"
2. GitHub 인증 → `citedpage` 저장소 선택
3. 빌드 설정: 프레임워크 None, 빌드 명령 비움, 출력 디렉터리 `/` → Deploy
4. 배포 완료 후 → Custom domains → `citedpage.com` 추가 (+ `www.citedpage.com`도 추가 후 루트로 리다이렉트)

### ⑤ 문의 폼 → Gmail (사용자 + Claude)
1. Cloudflare 대시보드 → citedpage.com 존 → **Email → Email Routing 활성화**
   (MX 레코드 자동 추가 — 이 도메인은 메일함이 없으므로 충돌 없음)
2. Destination addresses에 **받을 Gmail 주소 추가** → Gmail로 온 확인 메일에서 승인
3. Pages 프로젝트 → Settings → **Bindings**:
   - Send Email 바인딩 추가: 변수명 `SEND_EMAIL` (대상: 위에서 검증한 주소)
   - 환경 변수 추가: `CONTACT_TO` = 받을 Gmail 주소
4. 재배포 후 사이트에서 테스트 제출 → Gmail 수신 확인
   ※ Pages 설정에 Send Email 바인딩 항목이 안 보이면(플랫폼 변동 가능):
   같은 코드(functions/api/contact.js)를 Worker로 옮겨 `citedpage.com/api/contact`
   라우트에 붙이면 됨 — Claude에게 "폼을 Worker 방식으로 전환해줘"라고 요청

### ⑥ 배포 직후 (Claude)
- 서치콘솔 등록 + sitemap.xml 제출, GA4 설치
- AI 인용 베이스라인 30콜 측정 → 랜딩 성과 표 첫 숫자 기록

## 평상시 운영

- **콘텐츠·수치 갱신**: Claude가 파일 수정 → git push → 1~2분 내 자동 배포
- 성과 표 갱신 주기: 측정할 때마다 (GSC 수치 + 30콜 인용률)
- 새 글: blog/에 파일 추가 + blog/index.html 목록에 행 추가 + sitemap.xml 갱신

## 파일 구조

```
citedpage-site/
├── index.html            랜딩 (성과 표 데이터는 하단 script의 M 배열)
├── thanks.html           문의 접수 완료 (noindex)
├── blog/
│   ├── index.html        블로그 목록
│   ├── sample-post.html  연구글 샘플 (슬러그 확정 시 개명 예정)
│   └── sample-post-guide.html  가이드글 샘플
├── functions/api/contact.js    문의 폼 수신 (Pages Function)
├── robots.txt / sitemap.xml
└── README-배포.md        이 문서
```

## 미결 정비 목록 (배포 전후 처리)

- [ ] 블로그 글 canonical 추가, 슬러그 규칙 확정(영문 디렉터리형) 및 파일 개명
- [ ] sitemap.xml에 블로그 글 반영
- [ ] 홈 성과 표 정적 HTML 전환 (AI 크롤러는 JS 미실행)
- [ ] Noto Sans KR 자체 호스팅(woff2 서브셋, 400/700/900만)
- [ ] og:image 제작
- [ ] 404 페이지
