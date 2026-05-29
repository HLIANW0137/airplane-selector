/**
 * 天空纪 - 用户中心
 */

(function () {
  'use strict';

  const STORAGE_KEY_USER = 'skyera-user';
  const STORAGE_KEY_SUBMISSIONS = 'skyera-submissions';
  const STORAGE_KEY_MESSAGES = 'skyera-messages';
  const STORAGE_KEY_DRAFTS = 'skyera-drafts';
  const STORAGE_KEY_SUPPLEMENTS = 'skyera-supplements';

  let user = null;
  let brands = [];
  let categories = [];
  let airplanes = [];
  const DRAFT_MAX = 2;
  const DRAFT_EXPIRE_MS = 3 * 24 * 60 * 60 * 1000; // 3天

  // ========== 用户系统 ==========
  function initUser() {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      user = JSON.parse(saved);
    } else {
      user = {
        id: generateUserId(),
        nickname: '用户' + Math.floor(Math.random() * 9000 + 1000),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
    renderUserInfo();
  }

  function generateUserId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  function renderUserInfo() {
    const nicknameEl = document.getElementById('userNickname');
    const userIdEl = document.getElementById('userId');
    const avatarEl = document.getElementById('userAvatar');
    if (nicknameEl) nicknameEl.textContent = user.nickname;
    if (userIdEl) userIdEl.textContent = user.id;
    if (avatarEl) avatarEl.textContent = user.nickname.charAt(0).toUpperCase();
  }

  // ========== 数据加载 ==========
  async function loadData() {
    try {
      const resp = await fetch('data/airplanes.json');
      const data = await resp.json();
      brands = data.brands;
      categories = data.categories;
      airplanes = data.airplanes;
      populateSelects();
      populateSupplementSelect();
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  function populateSelects() {
    const brandSelect = document.getElementById('s_brand');
    const catSelect = document.getElementById('s_category');
    brandSelect.innerHTML = '<option value="">请选择品牌</option>' +
      brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    catSelect.innerHTML = '<option value="">请选择分类</option>' +
      categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  function populateSupplementSelect() {
    const select = document.getElementById('supplementAirplane');
    select.innerHTML = '<option value="">请选择飞机...</option>' +
      airplanes.map(a => `<option value="${a.id}">${a.name} (${a.model})</option>`).join('');
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    // 标签切换
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'my-submissions') renderMySubmissions();
        if (tab.dataset.tab === 'my-messages') renderMyMessages();
        if (tab.dataset.tab === 'supplement') renderMySupplements();
      });
    });

    // 修改昵称
    const editBtn = document.getElementById('editNicknameBtn');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        const newNick = prompt('请输入新昵称（2-20个字符）：', user.nickname);
        if (newNick === null) return;
        if (newNick.trim().length < 2 || newNick.trim().length > 20) {
          showToast('昵称长度需要2-20个字符', 'error');
          return;
        }
        user.nickname = newNick.trim();
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        document.getElementById('userNickname').textContent = user.nickname;
        document.getElementById('userAvatar').textContent = user.nickname.charAt(0).toUpperCase();
        showToast('昵称已更新为：' + user.nickname);
      });
    }

    // 提交飞机数据
    document.getElementById('submitForm').addEventListener('submit', handleSubmission);

    // 保存草稿
    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);

    // 补全飞机选择
    document.getElementById('supplementAirplane').addEventListener('change', onSupplementSelect);

    // 补全提交
    document.getElementById('supplementForm').addEventListener('submit', handleSupplement);

    // 留言字数统计
    document.getElementById('msgContent').addEventListener('input', e => {
      document.getElementById('charCount').textContent = e.target.value.length;
    });

    // 提交留言
    document.getElementById('messageForm').addEventListener('submit', handleMessage);
  }

  // ========== 草稿管理 ==========
  function getDrafts() {
    try {
      let drafts = JSON.parse(localStorage.getItem(STORAGE_KEY_DRAFTS) || '[]');
      // 清理过期草稿
      const now = Date.now();
      drafts = drafts.filter(d => now - d.savedAt < DRAFT_EXPIRE_MS);
      localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
      return drafts;
    } catch (e) { return []; }
  }

  function saveDrafts(drafts) {
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
  }

  function saveDraft() {
    const drafts = getDrafts();
    const editId = document.getElementById('s_editDraftId').value;

    const draftData = collectFormData();

    if (editId) {
      // 更新现有草稿
      const idx = drafts.findIndex(d => d.id === parseInt(editId));
      if (idx > -1) {
        drafts[idx].data = draftData;
        drafts[idx].savedAt = Date.now();
        saveDrafts(drafts);
        showToast('草稿已更新');
        renderDrafts();
        return;
      }
    }

    // 新建草稿
    if (drafts.length >= DRAFT_MAX) {
      showToast('草稿已满（最多2份），请先删除旧草稿', 'error');
      return;
    }

    drafts.push({
      id: Date.now(),
      data: draftData,
      savedAt: Date.now()
    });
    saveDrafts(drafts);
    showToast('已保存为草稿');
    renderDrafts();
  }

  function renderDrafts() {
    const drafts = getDrafts();
    const section = document.getElementById('draftsSection');
    const list = document.getElementById('draftsList');
    const count = document.getElementById('draftCount');

    if (drafts.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    count.textContent = drafts.length + '/' + DRAFT_MAX;

    list.innerHTML = drafts.map(d => {
      const remain = Math.ceil((DRAFT_EXPIRE_MS - (Date.now() - d.savedAt)) / (24 * 60 * 60 * 1000));
      return `
        <div class="draft-item">
          <div class="draft-info">
            <div class="draft-name">${d.data.name || '未命名飞机'}</div>
            <div class="draft-meta">${d.data.model || ''} | 剩余${remain}天过期</div>
          </div>
          <div class="draft-actions">
            <button class="btn btn-primary btn-sm" onclick="loadDraft(${d.id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="deleteDraft(${d.id})">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.loadDraft = function (id) {
    const drafts = getDrafts();
    const draft = drafts.find(d => d.id === id);
    if (!draft) return;

    fillFormData(draft.data);
    document.getElementById('s_editDraftId').value = id;
    document.getElementById('submitFormTitle').textContent = '编辑草稿';
    showToast('已加载草稿，请修改后提交或保存');
    // 切换到提交标签
    document.querySelector('.tab[data-tab="submit"]').click();
  };

  window.deleteDraft = function (id) {
    let drafts = getDrafts();
    drafts = drafts.filter(d => d.id !== id);
    saveDrafts(drafts);
    renderDrafts();
    showToast('草稿已删除');
  };

  // ========== 提交飞机数据 ==========
  function collectFormData() {
    return {
      name: document.getElementById('s_name').value.trim(),
      brand: document.getElementById('s_brand').value,
      model: document.getElementById('s_model').value.trim(),
      category: document.getElementById('s_category').value,
      country: document.getElementById('s_country').value.trim() || '未知',
      firstFlight: document.getElementById('s_firstFlight').value.trim() || '未知',
      status: document.getElementById('s_status').value,
      engineCount: parseInt(document.getElementById('s_engineCount').value) || 0,
      engineType: document.getElementById('s_engineType').value,
      engineModel: document.getElementById('s_engineModel').value.trim() || '未知',
      maxPassengers: parseInt(document.getElementById('s_maxPassengers').value) || 0,
      typicalPassengers: parseInt(document.getElementById('s_typicalPassengers').value) || 0,
      maxRange: parseInt(document.getElementById('s_maxRange').value) || 0,
      cruiseSpeed: parseInt(document.getElementById('s_cruiseSpeed').value) || 0,
      maxSpeed: parseInt(document.getElementById('s_maxSpeed').value) || 0,
      serviceCeiling: parseInt(document.getElementById('s_serviceCeiling').value) || 0,
      maxTakeoffWeight: parseInt(document.getElementById('s_maxTakeoffWeight').value) || 0,
      emptyWeight: parseInt(document.getElementById('s_emptyWeight').value) || 0,
      wingspan: parseFloat(document.getElementById('s_wingspan').value) || 0,
      length: parseFloat(document.getElementById('s_length').value) || 0,
      height: parseFloat(document.getElementById('s_height').value) || 0,
      cabinWidth: parseFloat(document.getElementById('s_cabinWidth').value) || 0,
      cabinHeight: parseFloat(document.getElementById('s_cabinHeight').value) || 0,
      cabinLength: parseFloat(document.getElementById('s_cabinLength').value) || 0,
      fuelCapacity: parseInt(document.getElementById('s_fuelCapacity').value) || 0,
      fuelConsumption: parseInt(document.getElementById('s_fuelConsumption').value) || 0,
      cargoCapacity: parseInt(document.getElementById('s_cargoCapacity').value) || 0,
      priceMin: parseInt(document.getElementById('s_priceMin').value) || 0,
      priceMax: parseInt(document.getElementById('s_priceMax').value) || 0,
      priceUnit: document.getElementById('s_priceUnit').value,
      description: document.getElementById('s_description').value.trim() || '未知',
      image: ''
    };
  }

  function fillFormData(data) {
    const fields = ['name','model','country','firstFlight','engineModel','description'];
    const numFields = ['engineCount','maxPassengers','typicalPassengers','maxRange','cruiseSpeed','maxSpeed',
      'serviceCeiling','maxTakeoffWeight','emptyWeight','wingspan','length','height',
      'cabinWidth','cabinHeight','cabinLength','fuelCapacity','fuelConsumption','cargoCapacity','priceMin','priceMax'];
    const selectFields = ['brand','category','status','engineType','priceUnit'];

    fields.forEach(f => {
      const el = document.getElementById('s_' + f);
      if (el && data[f] !== undefined) el.value = data[f] === '未知' ? '' : data[f];
    });
    numFields.forEach(f => {
      const el = document.getElementById('s_' + f);
      if (el && data[f] !== undefined) el.value = data[f] || '';
    });
    selectFields.forEach(f => {
      const el = document.getElementById('s_' + f);
      if (el && data[f] !== undefined) el.value = data[f];
    });
  }

  function clearForm() {
    document.getElementById('submitForm').reset();
    document.getElementById('s_editDraftId').value = '';
    document.getElementById('submitFormTitle').textContent = '提交飞机数据';
  }

  function handleSubmission(e) {
    e.preventDefault();

    const data = collectFormData();
    if (!data.name || !data.brand || !data.model || !data.category) {
      showToast('请填写所有必填项', 'error');
      return;
    }

    const submission = {
      id: Date.now(),
      userId: user.id,
      userNickname: user.nickname,
      type: 'new',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: '',
      data: data
    };

    const submissions = getSubmissions();
    submissions.push(submission);
    saveSubmissions(submissions);

    // 删除对应的草稿
    const editId = document.getElementById('s_editDraftId').value;
    if (editId) {
      let drafts = getDrafts();
      drafts = drafts.filter(d => d.id !== parseInt(editId));
      saveDrafts(drafts);
      renderDrafts();
    }

    clearForm();
    showToast('提交成功！等待管理员审核');
  }

  // ========== 补全信息 ==========
  function onSupplementSelect() {
    const id = parseInt(document.getElementById('supplementAirplane').value);
    const area = document.getElementById('supplementFormArea');
    if (!id) {
      area.style.display = 'none';
      return;
    }
    area.style.display = 'block';
    document.getElementById('sup_airplaneId').value = id;
  }

  function handleSupplement(e) {
    e.preventDefault();
    const airplaneId = parseInt(document.getElementById('sup_airplaneId').value);
    if (!airplaneId) {
      showToast('请先选择要补全的飞机', 'error');
      return;
    }

    // 只收集非空字段
    const changes = {};
    const fields = ['name','country','firstFlight','engineModel','description'];
    const numFields = ['engineCount','maxPassengers','typicalPassengers','maxRange','cruiseSpeed','maxSpeed',
      'serviceCeiling','maxTakeoffWeight','emptyWeight','wingspan','length','height',
      'cabinWidth','cabinHeight','cabinLength','fuelCapacity','fuelConsumption','priceMin','priceMax'];

    fields.forEach(f => {
      const el = document.getElementById('sup_' + f);
      if (el && el.value.trim()) changes[f] = el.value.trim();
    });
    numFields.forEach(f => {
      const el = document.getElementById('sup_' + f);
      if (el && el.value !== '' && !isNaN(parseFloat(el.value))) changes[f] = parseFloat(el.value);
    });

    if (Object.keys(changes).length === 0) {
      showToast('请至少填写一个需要补全的字段', 'error');
      return;
    }

    const airplane = airplanes.find(a => a.id === airplaneId);
    const supplement = {
      id: Date.now(),
      userId: user.id,
      userNickname: user.nickname,
      type: 'supplement',
      airplaneId: airplaneId,
      airplaneName: airplane ? airplane.name : '未知',
      changes: changes,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: ''
    };

    const supplements = getSupplements();
    supplements.push(supplement);
    saveSupplements(supplements);

    // 清空表单
    document.getElementById('supplementForm').reset();
    document.getElementById('supplementAirplane').value = '';
    document.getElementById('supplementFormArea').style.display = 'none';

    showToast('补全信息已提交，等待管理员审核');
    renderMySupplements();
  }

  function getSupplements() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SUPPLEMENTS) || '[]'); }
    catch (e) { return []; }
  }

  function saveSupplements(list) {
    localStorage.setItem(STORAGE_KEY_SUPPLEMENTS, JSON.stringify(list));
  }

  function renderMySupplements() {
    const supplements = getSupplements().filter(s => s.userId === user.id);
    const container = document.getElementById('mySupplementsList');

    if (supplements.length === 0) {
      container.innerHTML = '<h3>我的补全记录</h3><div class="empty-hint">暂无补全记录</div>';
      return;
    }

    const statusMap = {
      'pending': { text: '待审核', class: 'status-pending' },
      'approved': { text: '已通过', class: 'status-approved' },
      'rejected': { text: '已拒绝', class: 'status-rejected' }
    };

    container.innerHTML = '<h3>我的补全记录</h3>' + supplements.reverse().map(s => {
      const st = statusMap[s.status] || statusMap.pending;
      const changeKeys = Object.keys(s.changes);
      return `
        <div class="submission-item">
          <div class="submission-header">
            <div class="submission-title">${s.airplaneName}</div>
            <span class="submission-status ${st.class}">${st.text}</span>
          </div>
          <div class="submission-meta">
            提交时间：${new Date(s.submittedAt).toLocaleString()}
            ${s.reviewedAt ? ' | 审核时间：' + new Date(s.reviewedAt).toLocaleString() : ''}
          </div>
          <div class="submission-desc">
            补全字段：${changeKeys.join('、')}
            ${s.reviewNote ? '<br><strong>审核备注：</strong>' + s.reviewNote : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== 我的提交（含撤回） ==========
  function getSubmissions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]'); }
    catch (e) { return []; }
  }

  function saveSubmissions(list) {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(list));
  }

  function renderMySubmissions() {
    const submissions = getSubmissions().filter(s => s.userId === user.id);
    const container = document.getElementById('mySubmissionsList');

    if (submissions.length === 0) {
      container.innerHTML = '<div class="empty-hint">暂无提交记录</div>';
      return;
    }

    const statusMap = {
      'pending': { text: '待审核', class: 'status-pending' },
      'approved': { text: '已通过', class: 'status-approved' },
      'rejected': { text: '已拒绝', class: 'status-rejected' },
      'withdrawn': { text: '已撤回', class: 'status-withdrawn' }
    };

    container.innerHTML = submissions.reverse().map(s => {
      const st = statusMap[s.status] || statusMap.pending;
      return `
        <div class="submission-item">
          <div class="submission-header">
            <div class="submission-title">${s.data.name || s.airplaneName || '未知'}</div>
            <span class="submission-status ${st.class}">${st.text}</span>
          </div>
          <div class="submission-meta">
            提交时间：${new Date(s.submittedAt).toLocaleString()}
            ${s.reviewedAt ? ' | 审核时间：' + new Date(s.reviewedAt).toLocaleString() : ''}
          </div>
          <div class="submission-desc">
            ${s.type === 'supplement' ? '补全信息' : (s.data.model + ' | ' + s.data.engineType + ' × ' + s.data.engineCount)}
            ${s.reviewNote ? '<br><strong>审核备注：</strong>' + s.reviewNote : ''}
          </div>
          ${s.status === 'pending' ? `
            <div class="submission-actions">
              <button class="btn btn-outline btn-sm" onclick="withdrawSubmission(${s.id})">撤回</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  window.withdrawSubmission = function (id) {
    if (!confirm('确定要撤回这条提交吗？撤回后可保存为草稿。')) return;

    const submissions = getSubmissions();
    const idx = submissions.findIndex(s => s.id === id);
    if (idx === -1) return;

    const submission = submissions[idx];

    // 保存为草稿（仅限new类型）
    if (submission.type === 'new') {
      const drafts = getDrafts();
      if (drafts.length < DRAFT_MAX) {
        drafts.push({
          id: Date.now(),
          data: submission.data,
          savedAt: Date.now()
        });
        saveDrafts(drafts);
        showToast('已撤回并保存为草稿');
      } else {
        showToast('已撤回（草稿已满，未保存）');
      }
    } else {
      showToast('已撤回');
    }

    submissions[idx].status = 'withdrawn';
    saveSubmissions(submissions);
    renderMySubmissions();
    renderDrafts();
  };

  // ========== 留言功能 ==========
  function getMessages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '[]'); }
    catch (e) { return []; }
  }

  function handleMessage(e) {
    e.preventDefault();
    const content = document.getElementById('msgContent').value.trim();
    if (!content) { showToast('请输入留言内容', 'error'); return; }
    if (content.length > 1000) { showToast('留言内容不能超过1000字', 'error'); return; }

    const messages = getMessages();
    messages.push({
      id: Date.now(),
      userId: user.id,
      userNickname: user.nickname,
      content: content,
      submittedAt: new Date().toISOString(),
      reply: null,
      repliedAt: null
    });
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    document.getElementById('msgContent').value = '';
    document.getElementById('charCount').textContent = '0';
    showToast('留言已提交，管理员会尽快查看');
  }

  function renderMyMessages() {
    const messages = getMessages().filter(m => m.userId === user.id);
    const container = document.getElementById('myMessagesList');

    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-hint">暂无留言记录</div>';
      return;
    }

    container.innerHTML = messages.reverse().map(m => `
      <div class="message-item">
        <div class="message-header">
          <span class="message-time">${new Date(m.submittedAt).toLocaleString()}</span>
        </div>
        <div class="message-content">${escapeHtml(m.content)}</div>
        ${m.reply ? `
          <div class="message-reply">
            <div class="message-reply-label">管理员回复 (${new Date(m.repliedAt).toLocaleString()})</div>
            <div class="message-reply-content">${escapeHtml(m.reply)}</div>
          </div>
        ` : '<div style="color:#999;font-size:13px;">等待管理员回复...</div>'}
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== Toast ==========
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 2500);
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', async () => {
    // 初始化数据库连接
    if (typeof DB !== 'undefined') {
      const connected = await DB.init();
      if (connected) {
        showToast('已连接云端数据库', 'success');
      }
    }
    
    initUser();
    loadData().then(() => {
      // 检查URL参数，自动跳转到补全
      const params = new URLSearchParams(window.location.search);
      const supplementId = params.get('supplement');
      if (supplementId) {
        document.querySelector('.tab[data-tab="supplement"]').click();
        document.getElementById('supplementAirplane').value = supplementId;
        onSupplementSelect();
      }
    });
    bindEvents();
    renderDrafts();
  });
})();