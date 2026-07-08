/**
 * CitedPage 문의 폼 수신 Worker
 * 경로: citedpage.com/api/contact (POST)
 * 수신: CONTACT_TO에 지정된 주소 전체(쉼표 구분)로 각각 발송
 * 조건: 존에 Email Routing 활성화 + 수신 주소들이 '대상 주소'로 검증돼 있어야 함
 */
import { EmailMessage } from "cloudflare:email";

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

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const url = new URL(request.url);

    let form;
    try {
      form = await request.formData();
    } catch {
      return new Response("잘못된 요청입니다.", { status: 400 });
    }

    // 허니팟: 봇이 채우는 숨은 필드
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

    const recipients = (env.CONTACT_TO || "").split(",").map(s => s.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return new Response("수신자 설정이 없습니다.", { status: 500 });
    }

    const subject = `[문의] ${name} — ${company || site || email}`;
    const results = [];
    for (const to of recipients) {
      try {
        const raw = buildRawEmail("contact@citedpage.com", to, subject, bodyText);
        await env.SEND_EMAIL.send(new EmailMessage("contact@citedpage.com", to, raw));
        results.push(true);
      } catch (e) {
        results.push(false);
      }
    }

    // 한 곳이라도 도착했으면 접수 성공으로 처리
    if (results.some(Boolean)) {
      return Response.redirect(new URL("/thanks.html", url).toString(), 303);
    }
    return new Response("전송에 실패했습니다. 잠시 후 다시 시도해주세요.", { status: 500 });
  },
};
