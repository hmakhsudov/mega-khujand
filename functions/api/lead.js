/* Приём заявок с сайта (Cloudflare Pages Function, адрес /api/lead).
   Куда отправлять, задаётся переменными окружения проекта в Cloudflare
   (Pages → mega-khujand → Settings → Variables and Secrets), в коде ключей нет:
     TG_BOT_TOKEN + TG_CHAT_ID — сообщение в Telegram (бот от @BotFather,
                                  чат или группа отдела продаж);
     BITRIX_WEBHOOK            — входящий вебхук Bitrix24 с правом crm
                                  (https://….bitrix24.ru/rest/1/…/), заявка — лид.
   Ничего не задано — ответ 501, и форма на сайте отправляет заявку
   сообщением в WhatsApp, как раньше. */

const METHOD = { call: 'звонок', whatsapp: 'WhatsApp', telegram: 'Telegram', visit: 'визит в шоурум' };
const clip = (v, n) => String(v == null ? '' : v).slice(0, n).trim();

export async function onRequestPost({ request, env }) {
  const tg = env.TG_BOT_TOKEN && env.TG_CHAT_ID;
  const bx = env.BITRIX_WEBHOOK;
  if (!tg && !bx) return new Response('lead receiver is not configured', { status: 501 });

  let d;
  try { d = await request.json(); } catch (e) { return new Response('bad json', { status: 400 }); }
  const lead = {
    object: clip(d.object, 60) || 'Сырдарья',
    name: clip(d.name, 80),
    phone: clip(d.phone, 24),
    method: METHOD[d.method] || 'звонок',
    about: clip(d.lotLabel || (d.plan ? 'планировка ' + d.plan : d.interest), 160),
    page: clip(d.page, 80)
  };
  if (!lead.name || !/^\+992 \d{2} \d{3} \d{2} \d{2}$/.test(lead.phone)) return new Response('bad lead', { status: 422 });

  const text = 'Заявка с сайта MEGA KHUJAND\n' +
    'Объект: ' + lead.object + '\nИмя: ' + lead.name + '\nТелефон: ' + lead.phone +
    '\nКак связаться: ' + lead.method + (lead.about ? '\nИнтересует: ' + lead.about : '') + '\nСтраница: ' + lead.page;

  const jobs = [];
  if (tg) {
    jobs.push(fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, disable_web_page_preview: true })
    }));
  }
  if (bx) {
    jobs.push(fetch(bx.replace(/\/?$/, '/') + 'crm.lead.add.json', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        TITLE: 'Сайт: ' + lead.object + ' — ' + lead.name, NAME: lead.name,
        PHONE: [{ VALUE: lead.phone, VALUE_TYPE: 'MOBILE' }], SOURCE_ID: 'WEB',
        COMMENTS: text.replace(/\n/g, '<br>')
      } })
    }));
  }
  const res = await Promise.allSettled(jobs);
  const ok = res.some(r => r.status === 'fulfilled' && r.value.ok);
  return new Response(ok ? 'ok' : 'delivery failed', { status: ok ? 200 : 502 });
}
