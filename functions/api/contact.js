/**
 * 문의 폼 수신 — Cloudflare Pages Function
 * POST /api/contact → Email Routing(send_email 바인딩)으로 Gmail 발송
 *
 * 필요 설정 (README-배포.md 참조):
 *  - Cloudflare Email Routing 활성화 + Gmail을 대상 주소로 검증
 *  - Pages 설정에서 send_email 바인딩: 변수명 SEND_EMAIL
 *  - 환경 변수 CONTACT_TO = 수신 Gmail 주소
 */

function b64utf8(s) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

function buildRawEmail(from, to, subjectUtf8, bodyUtf8) {
  const subject = `=?UTF-8?B?${b64utf8(subjectUtf8)}?=`;
  const body = b64utf8(bodyUtf8);
  return [
    `From: CitedPage <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    body,
  ].join("\r\n");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }

  // 허니팟: 봇이 채우는 숨은 필드 — 채워져 있으면 조용히 통과시킨 척
  if ((form.get("website") || "").toString().trim() !== "") {
    return Response.redirect(new URL("/thanks.html", url).toString(), 303);
  }

  const name = (form.get("name") || "").toString().trim().slice(0, 100);
  const company = (form.get("company") || "").toString().trim().slice(0, 100);
  const email = (form.get("email") || "").toString().trim().slice(0, 200);
  const site = (form.get("site") || "").toString().trim().slice(0, 300);
  const message = (form.get("message") || "").toString().trim().slice(0, 5000);

  if (!name || !email || !message) {
    return new Response("필수 항목이 비어 있습니다.", { status: 400 });
  }

  const bodyText = [
    `CitedPage 문의 폼 접수`,
    ``,
    `이름: ${name}`,
    `회사: ${company}`,
    `이메일: ${email}`,
    `사이트: ${site}`,
    ``,
    `문의 내용:`,
    message,
    ``,
    `--`,
    `접수 시각: ${new Date().toISOString()}`,
  ].join("\n");

  try {
    const { EmailMessage } = await import("cloudflare:email");
    const raw = buildRawEmail(
      "contact@citedpage.com",
      env.CONTACT_TO,
      `[문의] ${name} — ${company || site || email}`,
      bodyText
    );
    const msg = new EmailMessage("contact@citedpage.com", env.CONTACT_TO, raw);
    await env.SEND_EMAIL.send(msg);
  } catch (e) {
    return new Response("전송에 실패했습니다. 잠시 후 다시 시도해주세요.", { status: 500 });
  }

  return Response.redirect(new URL("/thanks.html", url).toString(), 303);
}
