(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clean = value => typeof value === 'string' ? value.trim() : (typeof value === 'number' ? String(value) : '');
  const arr = value => Array.isArray(value) ? value : [];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const safeURL = (value, image = false) => {
    const url = clean(value);
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (image && /^data:image\/(png|jpeg|webp);base64,/i.test(url)) return url;
    if (!image && /^mailto:[^\s@]+@[^\s@]+$/i.test(url)) return url;
    if (/^(?:\.\/)?assets\/[\w\u4e00-\u9fff/ .()%-]+$/i.test(url)) return url;
    return '';
  };
  const link = (label, url) => {
    const a = el('a', '', label);
    a.href = url;
    if (/^https?:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const placeholder = (parent, date, title, detail = '') => {
    const list = el('ul', 'entry-list empty-state');
    const li = el('li');
    if (date) li.append(el('em', 'entry-date', date));
    li.append(document.createTextNode(title));
    if (detail) li.append(el('p', 'empty-detail', detail));
    list.append(li); parent.append(list);
  };
  const meaningful = (items, keys) => arr(items).filter(item => item && keys.some(key => clean(item[key])));
  function timeline(parent, items, renderer) {
    const list = el('ul', 'entry-list');
    items.forEach(item => {
      const li = el('li', 'timeline-item');
      const date = clean(item.date || item.period);
      if (date) li.append(el('em', 'entry-date', date + ':'));
      const body = el('div', 'entry-body');
      renderer(body, item);
      li.append(body); list.append(li);
    });
    parent.append(list);
  }
  function render(data = {}) {
    data = data && typeof data === 'object' ? data : {};
    const p = data.profile || {};
    $('profile-name').textContent = clean(p.name) || '[你的姓名]';
    $('profile-english').textContent = clean(p.englishName);
    $('profile-english').hidden = !clean(p.englishName);
    $('profile-role').textContent = clean(p.role) || '[你的身份 / 职位]';
    $('profile-affiliation').textContent = clean(p.affiliation) || '[学校 / 所在机构]';
    const portrait = $('portrait'), photo = safeURL(p.photo, true);
    portrait.hidden = true; $('portrait-placeholder').hidden = false;
    portrait.onload = () => { portrait.hidden = false; $('portrait-placeholder').hidden = true; };
    portrait.onerror = () => { portrait.hidden = true; $('portrait-placeholder').hidden = false; };
    portrait.alt = clean(p.name) ? `${clean(p.name)}的照片` : '个人照片';
    if (photo) portrait.src = photo; else portrait.removeAttribute('src');
    $('profile-location').replaceChildren(el('span', 'contact-icon', '⌖'), document.createTextNode(clean(p.location) || '[所在地]'));
    $('profile-email').replaceChildren(el('span', 'contact-icon', '✉'));
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(p.email))) {
      const email = link('Email', `mailto:${clean(p.email)}`);
      email.setAttribute('aria-label', 'Email: ' + clean(p.email));
      $('profile-email').append(email);
    } else $('profile-email').append(document.createTextNode(clean(p.email) || '[联系邮箱]'));
    $('profile-links').replaceChildren();
    arr(p.links).forEach(item => { const url = safeURL(item?.url); if (url && clean(item.label)) $('profile-links').append(link(clean(item.label), url)); });
    if (!$('profile-links').children.length && !clean(p.name)) $('profile-links').append(el('span', 'empty-links', '[Google Scholar / GitHub 等个人链接]'));
    $('bio').replaceChildren();
    const bios = arr(p.bio).map(clean).filter(Boolean);
    if (bios.length) bios.forEach(text => $('bio').append(el('p', '', text)));
    else $('bio').append(el('p', 'empty-bio', '[在这里填写个人简介：你目前的学校或机构、身份、研究方向，以及希望分享的个人经历。]'), el('p', 'bio-hint', '[可继续补充你的研究目标、合作兴趣或其他介绍；每段简介单独填写一行。]'));
    const interests = arr(p.interests).map(clean).filter(Boolean);
    $('interests').replaceChildren();
    if (interests.length) $('interests').append(document.createTextNode(interests.join('; ') + '.'));
    else $('interests').append(el('span', 'interest-placeholder', '[研究方向 / 关注领域]'));
    ['news','publications','honors','education','experience'].forEach(id => $(id + '-content').replaceChildren());
    const news = meaningful(data.news, ['text']);
    if (news.length) timeline($('news-content'), news, (body, item) => {
      const url = safeURL(item.url);
      body.append(url ? link(clean(item.text), url) : document.createTextNode(clean(item.text)));
    });
    else placeholder($('news-content'), '[日期]', '[最新动态：论文录用、项目进展或学术活动。]');
    const publications = meaningful(data.publications, ['title']);
    if (publications.length) {
      const list = el('ul', 'publication-list');
      publications.forEach(item => {
        const article = el('li', 'publication');
        const image = safeURL(item.image, true);
        if (image) { const img = el('img', 'publication-image'); img.src = image; img.alt = clean(item.title) + '配图'; img.loading = 'lazy'; img.onerror = () => img.hidden = true; article.append(img); }
        const body = el('div', 'publication-body');
        const title = el('h3');
        const firstLink = arr(item.links).map(entry => safeURL(entry?.url)).find(Boolean);
        title.append(firstLink ? link(clean(item.title), firstLink) : document.createTextNode(clean(item.title)));
        body.append(title);
        if (clean(item.authors)) body.append(el('p', 'authors', clean(item.authors)));
        const venue = [clean(item.venue), clean(item.year)].filter(Boolean).join(', ');
        if (venue) body.append(el('p', 'venue', venue));
        if (clean(item.description)) body.append(el('p', '', clean(item.description)));
        const links = el('div', 'publication-links');
        arr(item.links).forEach(entry => { const url = safeURL(entry?.url); if (url && clean(entry.label)) links.append(link('[' + clean(entry.label) + ']', url)); });
        if (links.children.length) body.append(links);
        article.append(body); list.append(article);
      });
      $('publications-content').append(list);
    } else placeholder($('publications-content'), '', '[论文或项目标题]', '[作者 / 合作者] · [期刊、会议或项目类别] · [年份]');
    const honors = meaningful(data.honors, ['title']);
    if (honors.length) timeline($('honors-content'), honors, (body, item) => {
      body.append(document.createTextNode(clean(item.title)));
      if (clean(item.organization)) body.append(document.createTextNode(', ' + clean(item.organization)));
    });
    else placeholder($('honors-content'), '[日期]', '[奖项名称] · [颁发机构]');
    const education = meaningful(data.education, ['school','degree']);
    if (education.length) timeline($('education-content'), education, (body, item) => {
      if (clean(item.school)) body.append(el('h3', '', clean(item.school)));
      if (clean(item.degree)) body.append(document.createTextNode((clean(item.school) ? ', ' : '') + clean(item.degree)));
      if (clean(item.detail)) body.append(el('p', '', clean(item.detail)));
    });
    else placeholder($('education-content'), '[起止时间]', '[学校] · [学位与专业]', '[导师、研究方向或其他补充说明，可选]');
    const experience = meaningful(data.experience, ['organization','role']);
    if (experience.length) timeline($('experience-content'), experience, (body, item) => {
      if (clean(item.organization)) body.append(el('h3', '', clean(item.organization)));
      if (clean(item.role)) body.append(document.createTextNode((clean(item.organization) ? ', ' : '') + clean(item.role)));
      if (clean(item.detail)) body.append(el('p', '', clean(item.detail)));
    });
    else placeholder($('experience-content'), '[起止时间]', '[公司 / 机构] · [职位]', '[实习、工作或研究经历的主要内容]');
    document.title = clean(p.name) ? `${clean(p.name)} · 个人主页` : '个人主页 · Personal Homepage';
    document.querySelector('meta[name="description"]').content = bios[0]?.slice(0, 180) || '个人主页 · 研究兴趣、学术成果与成长经历。';
    $('footer-name').textContent = clean(p.name) ? `${new Date().getFullYear()} · ${clean(p.name)}` : 'Personal Homepage';
  }
  render(window.PROFILE_DATA);
  const menu = document.querySelector('.menu-toggle'), nav = $('main-nav');
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  const navLinks = [...nav.querySelectorAll('a')];
  const active = id => navLinks.forEach(a => { const yes = a.hash === '#' + id; a.classList.toggle('active', yes); if (yes) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  navLinks.forEach(a => a.addEventListener('click', () => { active(a.hash.slice(1)); nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
  let ticking = false;
  function updateSection() {
    const sections = [...document.querySelectorAll('main>section')];
    let id = sections[0].id;
    for (const section of sections) if (section.getBoundingClientRect().top <= 125) id = section.id;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) id = sections.at(-1).id;
    active(id); ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { window.requestAnimationFrame(updateSection); ticking = true; } }, {passive:true});
  // 本地填写工具中的预览；公开网站不接受编辑消息。
  if (location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname)) {
    window.addEventListener('message', event => {
      if (window.parent !== window && event.source === window.parent && event.data?.type === 'profile-preview' && event.data.data && typeof event.data.data === 'object') render(event.data.data);
    });
  }
})();
