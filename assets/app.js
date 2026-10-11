(() => {
  'use strict';
  const config = window.ADVISOR_CONFIG;
  const dialog = document.querySelector('.contact-dialog');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu(restore = false) {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'メニューを開く');
    nav.classList.remove('open');
    if (restore) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (menu.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    const links = [...nav.querySelectorAll('a')];
    if (e.shiftKey && document.activeElement === menu) {e.preventDefault(); links.at(-1).focus();}
    else if (!e.shiftKey && document.activeElement === links.at(-1)) {e.preventDefault(); menu.focus();}
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.site-header')) closeMenu();
  });
  const wide = matchMedia('(min-width: 901px)');
  wide.addEventListener('change', () => closeMenu());
  let opener;
  document.querySelectorAll('[data-contact]').forEach(link => link.addEventListener('click', e => {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    e.preventDefault();
    opener = link;
    closeMenu();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('modal-open');
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {if (e.target === dialog) {
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  }});
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    // Mobile navigation links may now be hidden; restore to menu in that case.
    if (opener?.getClientRects().length) opener.focus();
    else if (opener) menu.focus();
  });
  const normalize = value => value.normalize('NFKC').trim();
  function setError(field, message) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    const error = document.getElementById(field.getAttribute('aria-describedby'));
    if (error) error.textContent = message;
  }
  function validate(field) {
    const value = normalize(field.value);
    if (field.name !== 'message' && !value) return 'この項目を入力・選択してください。';
    if (field.name === 'email') {
      const input = document.createElement('input'); input.type='email'; input.value=value;
      if(!input.validity.valid || !value.includes('@')) return 'メールアドレスの形式を確認してください。';
    }
    if (field.name === 'phone') {
      const digits=value.replace(/[^0-9]/g,'');
      if (!/^\+?[0-9 ()-]+$/.test(value) || digits.length < 7 || digits.length > 15)
        return '電話番号を半角数字・ハイフン等で入力してください（数字7〜15桁）。';
    }
    if(field.name==='category' && !config.categories.includes(value)) return 'カテゴリを選択してください。';
    return '';
  }
  document.querySelectorAll('[data-form]').forEach(form => {
    const category = form.elements.category;
    category.replaceChildren(new Option('選択してください',''), ...config.categories.map(x=>new Option(x,x)));
    const inputs=[...form.querySelectorAll('input,select,textarea')];
    const status=form.querySelector('.form-status');
    const fallback=form.querySelector('.mailto-fallback');
    inputs.forEach(field => field.addEventListener('input', () => {
      if(field.getAttribute('aria-invalid')==='true') setError(field,validate(field));
      status.textContent=''; fallback.hidden=true; fallback.removeAttribute('href');
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first;
      inputs.forEach(field => {const error=validate(field);setError(field,error);if(error&&!first)first=field;});
      if(first){status.textContent='入力内容をご確認ください。';first.focus();return;}
      const values=Object.fromEntries(inputs.map(field=>[field.name,normalize(field.value)]));
      const body=['【提案用デモ／実際の相談受付ではありません】','',`お名前：${values.name}`,`電話番号：${values.phone}`,`メールアドレス：${values.email}`,`カテゴリ：${values.category}`,'', 'お問い合わせ内容：', values.message || '（未入力）'].join('\r\n');
      const href=`mailto:${config.recipient}?subject=${encodeURIComponent(config.subject)}&body=${encodeURIComponent(body)}`;
      fallback.href=href; fallback.hidden=false;
      status.textContent='メールアプリへの引き継ぎを試みました。送信は完了していません。ダミー宛先のため、実際には送信しないでください。起動しない場合は下のリンクからお試しください。';
      // Replace only this adapter when moving to a server-side form service.
      window.location.href=href;
    });
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }),{threshold:0.08});
    document.documentElement.classList.add('js-reveal');
    document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
    reduced.addEventListener('change', e=>{if(e.matches){observer.disconnect();document.documentElement.classList.remove('js-reveal');}});
  }
})();
