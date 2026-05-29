/**
 * 天空纪 - 数据管理后台
 */

(function () {
  'use strict';

  let data = { categories: [], brands: [], airplanes: [] };
  let nextId = 1;
  let uploadedImages = {}; // { airplaneId: [base64, ...] }
  let currentEditImages = []; // 当前编辑的飞机图片列表

  // ========== 数据加载 ==========
  async function loadData() {
    try {
      const resp = await fetch('data/airplanes.json');
      data = await resp.json();
      nextId = Math.max(...data.airplanes.map(a => a.id), 0) + 1;
      loadUploadedImages();
      initUI();
    } catch (e) {
      console.error('加载数据失败:', e);
      showToast('加载数据失败，请检查 airplanes.json 文件', 'error');
    }
  }

  function loadUploadedImages() {
    try {
      const saved = localStorage.getItem('airplane-images');
      if (saved) uploadedImages = JSON.parse(saved);
    } catch (e) { /* ignore */ }
  }

  function saveUploadedImages() {
    try {
      localStorage.setItem('airplane-images', JSON.stringify(uploadedImages));
    } catch (e) {
      showToast('图片存储空间已满，请删除部分图片', 'error');
    }
  }

  function initUI() {
    renderStats();
    renderTable();
    populateSelects();
    bindEvents();
  }

  // ========== 统计 ==========
  function renderStats() {
    const statsRow = document.getElementById('statsRow');
    const cats = {};
    data.categories.forEach(c => { cats[c.id] = 0; });
    data.airplanes.forEach(a => { cats[a.category] = (cats[a.category] || 0) + 1; });

    let html = `
      <div class="stat-card">
        <div class="label">飞机总数</div>
        <div class="value">${data.airplanes.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">品牌数量</div>
        <div class="value">${data.brands.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">分类数量</div>
        <div class="value">${data.categories.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">已上传图片</div>
        <div class="value">${Object.values(uploadedImages).flat().length}</div>
      </div>
    `;

    data.categories.forEach(cat => {
      html += `
        <div class="stat-card">
          <div class="label">${cat.icon} ${cat.name}</div>
          <div class="value">${cats[cat.id] || 0}</div>
        </div>
      `;
    });

    statsRow.innerHTML = html;
  }

  // ========== 获取飞机图片 ==========
  function getAirplaneImages(a) {
    const images = [];
    if (a.image) {
      if (Array.isArray(a.image)) {
        a.image.forEach(img => { if (img) images.push(img); });
      } else if (a.image) {
        images.push(a.image);
      }
    }
    if (uploadedImages[a.id]) {
      uploadedImages[a.id].forEach(img => images.push(img));
    }
    return images;
  }

  // ========== 表格渲染 ==========
  function renderTable(filter = {}) {
    const tbody = document.getElementById('airplaneTableBody');
    let list = [...data.airplanes];

    if (filter.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(s) || a.model.toLowerCase().includes(s));
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter(a => a.category === filter.category);
    }

    tbody.innerHTML = list.map(a => {
      const brand = data.brands.find(b => b.id === a.brand);
      const cat = data.categories.find(c => c.id === a.category);
      const priceText = (a.priceMin || a.priceMax) ?
        (a.priceMin === a.priceMax ? `${a.priceMin}` : `${a.priceMin || 0}-${a.priceMax || 0}`) : '-';
      const statusClass = `status-${a.status}`;
      const images = getAirplaneImages(a);
      const thumbHtml = images.length > 0
        ? `<img src="${images[0]}" class="table-thumb" onerror="this.style.display='none'">`
        : '';

      return `
        <tr>
          <td>${a.id}</td>
          <td>${thumbHtml} <strong>${a.name}</strong></td>
          <td>${brand ? brand.name : a.brand}</td>
          <td>${cat ? cat.icon + ' ' + cat.name : a.category}</td>
          <td>${a.engineCount} × ${a.engineType}</td>
          <td>${a.maxPassengers}座</td>
          <td>${a.maxRange} km</td>
          <td>${priceText}</td>
          <td><span class="status-badge ${statusClass}">${a.status}</span></td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-primary btn-sm edit-btn" data-id="${a.id}">编辑</button>
              <button class="btn btn-outline btn-sm img-btn" data-id="${a.id}">📷</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${a.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
    });
    tbody.querySelectorAll('.img-btn').forEach(btn => {
      btn.addEventListener('click', () => openImageManager(parseInt(btn.dataset.id)));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteAirplane(parseInt(btn.dataset.id)));
    });
  }

  // ========== 下拉选项 ==========
  function populateSelects() {
    const brandSelect = document.getElementById('f_brand');
    const catSelect = document.getElementById('f_category');
    const tableCatSelect = document.getElementById('tableCategoryFilter');

    brandSelect.innerHTML = data.brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    catSelect.innerHTML = data.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    tableCatSelect.innerHTML = '<option value="all">全部分类</option>' +
      data.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    document.getElementById('addAirplaneBtn').addEventListener('click', () => openAddModal());
    document.getElementById('addBrandBtn').addEventListener('click', () => {
      document.getElementById('brandModal').classList.add('show');
    });
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
      document.getElementById('categoryModal').classList.add('show');
    });

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);

    document.getElementById('airplaneModalClose').addEventListener('click', closeAirplaneModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAirplaneModal);
    document.getElementById('brandModalClose').addEventListener('click', () => {
      document.getElementById('brandModal').classList.remove('show');
    });
    document.getElementById('cancelBrandBtn').addEventListener('click', () => {
      document.getElementById('brandModal').classList.remove('show');
    });
    document.getElementById('categoryModalClose').addEventListener('click', () => {
      document.getElementById('categoryModal').classList.remove('show');
    });
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
      document.getElementById('categoryModal').classList.remove('show');
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
      });
    });

    document.getElementById('airplaneForm').addEventListener('submit', saveAirplane);
    document.getElementById('brandForm').addEventListener('submit', saveBrand);
    document.getElementById('categoryForm').addEventListener('submit', saveCategory);

    document.getElementById('tableSearch').addEventListener('input', applyTableFilter);
    document.getElementById('tableCategoryFilter').addEventListener('change', applyTableFilter);

    // 图片上传
    document.getElementById('imageFileInput').addEventListener('change', handleFileUpload);
    document.getElementById('addUrlBtn').addEventListener('click', handleUrlAdd);
    document.getElementById('imageUrlInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); handleUrlAdd(); }
    });
  }

  function applyTableFilter() {
    renderTable({
      search: document.getElementById('tableSearch').value,
      category: document.getElementById('tableCategoryFilter').value
    });
  }

  // ========== 图片管理 ==========
  function openImageManager(id) {
    const a = data.airplanes.find(p => p.id === id);
    if (!a) return;
    // 打开编辑弹窗并跳到图片部分
    openEditModal(id);
    // 滚动到图片区域
    setTimeout(() => {
      const imgSection = document.querySelector('.image-upload-area');
      if (imgSection) imgSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function renderImagePreview() {
    const container = document.getElementById('imagePreviewList');
    if (currentEditImages.length === 0) {
      container.innerHTML = '<div style="color:#999;font-size:13px;padding:8px;">暂无图片</div>';
      return;
    }

    container.innerHTML = currentEditImages.map((img, i) => `
      <div class="image-preview-item">
        <img src="${img}" alt="图片 ${i + 1}">
        <button class="remove-img" data-index="${i}" title="删除">&times;</button>
        <span class="img-index">${i + 1}</span>
      </div>
    `).join('');

    container.querySelectorAll('.remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        currentEditImages.splice(idx, 1);
        renderImagePreview();
      });
    });
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      if (file.size > 3 * 1024 * 1024) {
        showToast(`图片 ${file.name} 超过3MB，已跳过`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (evt) {
        currentEditImages.push(evt.target.result);
        renderImagePreview();
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }

  function handleUrlAdd() {
    const input = document.getElementById('imageUrlInput');
    const url = input.value.trim();
    if (!url) return;

    if (!url.match(/^https?:\/\/.+/) && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      showToast('请输入有效的图片URL', 'error');
      return;
    }

    currentEditImages.push(url);
    renderImagePreview();
    input.value = '';
  }

  // ========== 飞机增删改 ==========
  function openAddModal() {
    document.getElementById('airplaneModalTitle').textContent = '添加飞机';
    document.getElementById('editId').value = '';
    document.getElementById('airplaneForm').reset();
    document.getElementById('f_priceUnit').value = '万美元';
    document.getElementById('f_status').value = '在产';
    document.getElementById('f_engineType').value = '涡轮风扇';
    currentEditImages = [];
    renderImagePreview();
    document.getElementById('airplaneModal').classList.add('show');
  }

  function openEditModal(id) {
    const a = data.airplanes.find(p => p.id === id);
    if (!a) return;

    document.getElementById('airplaneModalTitle').textContent = '编辑飞机';
    document.getElementById('editId').value = id;

    document.getElementById('f_name').value = a.name || '';
    document.getElementById('f_brand').value = a.brand || '';
    document.getElementById('f_model').value = a.model || '';
    document.getElementById('f_category').value = a.category || '';
    document.getElementById('f_country').value = a.country || '';
    document.getElementById('f_firstFlight').value = a.firstFlight || '';
    document.getElementById('f_status').value = a.status || '在产';
    document.getElementById('f_description').value = a.description || '';
    document.getElementById('f_engineCount').value = a.engineCount || '';
    document.getElementById('f_engineType').value = a.engineType || '涡轮风扇';
    document.getElementById('f_engineModel').value = a.engineModel || '';
    document.getElementById('f_fuelCapacity').value = a.fuelCapacity || '';
    document.getElementById('f_fuelConsumption').value = a.fuelConsumption || '';
    document.getElementById('f_maxPassengers').value = a.maxPassengers || '';
    document.getElementById('f_typicalPassengers').value = a.typicalPassengers || '';
    document.getElementById('f_cargoCapacity').value = a.cargoCapacity || '';
    document.getElementById('f_maxRange').value = a.maxRange || '';
    document.getElementById('f_cruiseSpeed').value = a.cruiseSpeed || '';
    document.getElementById('f_maxSpeed').value = a.maxSpeed || '';
    document.getElementById('f_serviceCeiling').value = a.serviceCeiling || '';
    document.getElementById('f_maxTakeoffWeight').value = a.maxTakeoffWeight || '';
    document.getElementById('f_emptyWeight').value = a.emptyWeight || '';
    document.getElementById('f_wingspan').value = a.wingspan || '';
    document.getElementById('f_length').value = a.length || '';
    document.getElementById('f_height').value = a.height || '';
    document.getElementById('f_cabinWidth').value = a.cabinWidth || '';
    document.getElementById('f_cabinHeight').value = a.cabinHeight || '';
    document.getElementById('f_cabinLength').value = a.cabinLength || '';
    document.getElementById('f_priceMin').value = a.priceMin || '';
    document.getElementById('f_priceMax').value = a.priceMax || '';
    document.getElementById('f_priceUnit').value = a.priceUnit || '万美元';

    // 加载已上传的图片
    currentEditImages = uploadedImages[id] ? [...uploadedImages[id]] : [];
    renderImagePreview();

    document.getElementById('airplaneModal').classList.add('show');
  }

  function closeAirplaneModal() {
    document.getElementById('airplaneModal').classList.remove('show');
  }

  function saveAirplane(e) {
    e.preventDefault();

    const editId = document.getElementById('editId').value;
    const airplane = {
      id: editId ? parseInt(editId) : nextId++,
      name: document.getElementById('f_name').value.trim(),
      brand: document.getElementById('f_brand').value,
      model: document.getElementById('f_model').value.trim(),
      category: document.getElementById('f_category').value,
      country: document.getElementById('f_country').value.trim(),
      firstFlight: document.getElementById('f_firstFlight').value.trim(),
      status: document.getElementById('f_status').value,
      description: document.getElementById('f_description').value.trim(),
      engineCount: parseInt(document.getElementById('f_engineCount').value) || 0,
      engineType: document.getElementById('f_engineType').value,
      engineModel: document.getElementById('f_engineModel').value.trim(),
      fuelCapacity: parseInt(document.getElementById('f_fuelCapacity').value) || 0,
      fuelConsumption: parseInt(document.getElementById('f_fuelConsumption').value) || 0,
      maxPassengers: parseInt(document.getElementById('f_maxPassengers').value) || 0,
      typicalPassengers: parseInt(document.getElementById('f_typicalPassengers').value) || 0,
      cargoCapacity: parseInt(document.getElementById('f_cargoCapacity').value) || 0,
      maxRange: parseInt(document.getElementById('f_maxRange').value) || 0,
      cruiseSpeed: parseInt(document.getElementById('f_cruiseSpeed').value) || 0,
      maxSpeed: parseInt(document.getElementById('f_maxSpeed').value) || 0,
      serviceCeiling: parseInt(document.getElementById('f_serviceCeiling').value) || 0,
      maxTakeoffWeight: parseInt(document.getElementById('f_maxTakeoffWeight').value) || 0,
      emptyWeight: parseInt(document.getElementById('f_emptyWeight').value) || 0,
      wingspan: parseFloat(document.getElementById('f_wingspan').value) || 0,
      length: parseFloat(document.getElementById('f_length').value) || 0,
      height: parseFloat(document.getElementById('f_height').value) || 0,
      cabinWidth: parseFloat(document.getElementById('f_cabinWidth').value) || 0,
      cabinHeight: parseFloat(document.getElementById('f_cabinHeight').value) || 0,
      cabinLength: parseFloat(document.getElementById('f_cabinLength').value) || 0,
      priceMin: parseInt(document.getElementById('f_priceMin').value) || 0,
      priceMax: parseInt(document.getElementById('f_priceMax').value) || 0,
      priceUnit: document.getElementById('f_priceUnit').value,
      image: ''
    };

    // 保存图片到uploadedImages
    const id = airplane.id;
    if (currentEditImages.length > 0) {
      uploadedImages[id] = [...currentEditImages];
    } else {
      delete uploadedImages[id];
    }

    if (editId) {
      const idx = data.airplanes.findIndex(a => a.id === parseInt(editId));
      if (idx > -1) data.airplanes[idx] = airplane;
      showToast('飞机信息已更新');
    } else {
      data.airplanes.push(airplane);
      showToast('飞机添加成功');
    }

    saveToLocalStorage();
    saveUploadedImages();
    renderStats();
    renderTable();
    closeAirplaneModal();
  }

  function deleteAirplane(id) {
    if (!confirm('确定要删除这架飞机吗？此操作不可撤销。')) return;
    data.airplanes = data.airplanes.filter(a => a.id !== id);
    delete uploadedImages[id];
    saveToLocalStorage();
    saveUploadedImages();
    renderStats();
    renderTable();
    showToast('已删除');
  }

  // ========== 品牌管理 ==========
  function saveBrand(e) {
    e.preventDefault();
    const brand = {
      id: document.getElementById('b_id').value.trim(),
      name: document.getElementById('b_name').value.trim(),
      country: document.getElementById('b_country').value.trim(),
      logo: document.getElementById('b_logo').value.trim() || document.getElementById('b_name').value.trim().charAt(0)
    };

    if (data.brands.find(b => b.id === brand.id)) {
      showToast('品牌ID已存在', 'error');
      return;
    }

    data.brands.push(brand);
    saveToLocalStorage();
    populateSelects();
    renderStats();
    document.getElementById('brandForm').reset();
    document.getElementById('brandModal').classList.remove('show');
    showToast('品牌添加成功');
  }

  // ========== 分类管理 ==========
  function saveCategory(e) {
    e.preventDefault();
    const cat = {
      id: document.getElementById('c_id').value.trim(),
      name: document.getElementById('c_name').value.trim(),
      icon: document.getElementById('c_icon').value.trim() || '✈️'
    };

    if (data.categories.find(c => c.id === cat.id)) {
      showToast('分类ID已存在', 'error');
      return;
    }

    data.categories.push(cat);
    saveToLocalStorage();
    populateSelects();
    renderStats();
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').classList.remove('show');
    showToast('分类添加成功');
  }

  // ========== 导入导出 ==========
  function exportData() {
    const exportObj = { ...data };
    // 把uploadedImages合并到airplanes的image字段
    exportObj.airplanes = data.airplanes.map(a => {
      const imgs = [];
      if (a.image) {
        if (Array.isArray(a.image)) a.image.forEach(i => { if (i) imgs.push(i); });
        else imgs.push(a.image);
      }
      if (uploadedImages[a.id]) uploadedImages[a.id].forEach(i => imgs.push(i));
      return { ...a, image: imgs.length > 0 ? imgs : '' };
    });

    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airplanes.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出（含图片）');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.airplanes && imported.brands && imported.categories) {
          data = imported;
          nextId = Math.max(...data.airplanes.map(a => a.id), 0) + 1;
          saveToLocalStorage();
          initUI();
          showToast('数据导入成功');
        } else {
          showToast('JSON格式不正确', 'error');
        }
      } catch (err) {
        showToast('文件解析失败', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ========== 本地存储 ==========
  function saveToLocalStorage() {
    try {
      localStorage.setItem('airplane-selector-data', JSON.stringify(data));
    } catch (e) { /* silent */ }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('airplane-selector-data');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* silent */ }
    return null;
  }

  // ========== Toast提示 ==========
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 2500);
  }

  // ========== 提交审核 ==========
  const STORAGE_KEY_SUBMISSIONS = 'skyera-submissions';
  const STORAGE_KEY_MESSAGES = 'skyera-messages';

  function getSubmissions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]'); }
    catch (e) { return []; }
  }

  function saveSubmissions(list) {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(list));
  }

  function getMessages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '[]'); }
    catch (e) { return []; }
  }

  function saveMessages(list) {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
  }

  function renderSubmissions() {
    const filter = document.getElementById('submissionStatusFilter').value;
    const all = getSubmissions();
    const list = filter === 'all' ? all : all.filter(s => s.status === filter);
    const container = document.getElementById('submissionsList');

    // 更新待审核数量
    const pendingCount = all.filter(s => s.status === 'pending').length;
    document.getElementById('pendingCount').textContent = pendingCount;

    if (list.length === 0) {
      container.innerHTML = '<div class="empty-message">暂无提交记录</div>';
      return;
    }

    container.innerHTML = list.reverse().map(s => {
      const statusMap = {
        'pending': { text: '待审核', class: 'status-pending' },
        'approved': { text: '已通过', class: 'status-approved' },
        'rejected': { text: '已拒绝', class: 'status-rejected' }
      };
      const st = statusMap[s.status] || statusMap.pending;
      const brand = data.brands.find(b => b.id === s.data.brand);
      const cat = data.categories.find(c => c.id === s.data.category);

      return `
        <div class="submission-review-item">
          <div class="submission-review-header">
            <div>
              <div class="submission-review-title">${s.data.name}</div>
              <div class="submission-review-meta">
                提交者: ${s.userNickname} (${s.userId}) | 
                提交时间: ${new Date(s.submittedAt).toLocaleString()}
              </div>
            </div>
            <span class="submission-status ${st.class}">${st.text}</span>
          </div>
          <div class="submission-review-body">
            <div class="submission-review-field"><span class="label">品牌: </span><span class="value">${brand ? brand.name : s.data.brand}</span></div>
            <div class="submission-review-field"><span class="label">型号: </span><span class="value">${s.data.model}</span></div>
            <div class="submission-review-field"><span class="label">分类: </span><span class="value">${cat ? cat.name : s.data.category}</span></div>
            <div class="submission-review-field"><span class="label">产地: </span><span class="value">${s.data.country}</span></div>
            <div class="submission-review-field"><span class="label">发动机: </span><span class="value">${s.data.engineCount} × ${s.data.engineType}</span></div>
            <div class="submission-review-field"><span class="label">座位: </span><span class="value">${s.data.maxPassengers}座</span></div>
            <div class="submission-review-field"><span class="label">航程: </span><span class="value">${s.data.maxRange}km</span></div>
            <div class="submission-review-field"><span class="label">速度: </span><span class="value">${s.data.cruiseSpeed}km/h</span></div>
            <div class="submission-review-field"><span class="label">描述: </span><span class="value">${s.data.description || '无'}</span></div>
          </div>
          ${s.status === 'pending' ? `
            <div class="submission-review-actions">
              <input type="text" id="reviewNote_${s.id}" placeholder="审核备注（可选）">
              <button class="btn btn-primary btn-sm" onclick="reviewSubmission(${s.id}, 'approved')">通过</button>
              <button class="btn btn-danger btn-sm" onclick="reviewSubmission(${s.id}, 'rejected')">拒绝</button>
            </div>
          ` : `
            ${s.reviewNote ? `<div style="margin-top:12px;font-size:13px;color:#666;">审核备注: ${s.reviewNote}</div>` : ''}
          `}
        </div>
      `;
    }).join('');
  }

  // 全局函数供HTML调用
  window.reviewSubmission = function(id, status) {
    const submissions = getSubmissions();
    const idx = submissions.findIndex(s => s.id === id);
    if (idx === -1) return;

    const noteInput = document.getElementById('reviewNote_' + id);
    submissions[idx].status = status;
    submissions[idx].reviewedAt = new Date().toISOString();
    submissions[idx].reviewNote = noteInput ? noteInput.value.trim() : '';

    // 如果通过，添加到飞机数据
    if (status === 'approved') {
      const newData = submissions[idx].data;
      newData.id = nextId++;
      data.airplanes.push(newData);
      saveToLocalStorage();
      renderStats();
      renderTable();
    }

    saveSubmissions(submissions);
    renderSubmissions();
    showToast(status === 'approved' ? '已通过并添加到数据库' : '已拒绝');
  };

  // ========== 补全信息审核 ==========
  const STORAGE_KEY_SUPPLEMENTS = 'skyera-supplements';

  function getSupplements() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SUPPLEMENTS) || '[]'); }
    catch (e) { return []; }
  }

  function saveSupplements(list) {
    localStorage.setItem(STORAGE_KEY_SUPPLEMENTS, JSON.stringify(list));
  }

  function renderSupplements() {
    const filter = document.getElementById('supplementStatusFilter').value;
    const all = getSupplements();
    const list = filter === 'all' ? all : all.filter(s => s.status === filter);
    const container = document.getElementById('supplementsList');

    const pendingCount = all.filter(s => s.status === 'pending').length;
    document.getElementById('pendingSupplementCount').textContent = pendingCount;

    if (list.length === 0) {
      container.innerHTML = '<div class="empty-message">暂无补全记录</div>';
      return;
    }

    container.innerHTML = list.reverse().map(s => {
      const statusMap = {
        'pending': { text: '待审核', class: 'status-pending' },
        'approved': { text: '已通过', class: 'status-approved' },
        'rejected': { text: '已拒绝', class: 'status-rejected' }
      };
      const st = statusMap[s.status] || statusMap.pending;
      const changeEntries = Object.entries(s.changes);

      return `
        <div class="submission-review-item">
          <div class="submission-review-header">
            <div>
              <div class="submission-review-title">${s.airplaneName} (ID: ${s.airplaneId})</div>
              <div class="submission-review-meta">
                提交者: ${s.userNickname} (${s.userId}) | 
                提交时间: ${new Date(s.submittedAt).toLocaleString()}
              </div>
            </div>
            <span class="submission-status ${st.class}">${st.text}</span>
          </div>
          <div class="submission-review-body">
            ${changeEntries.map(([k, v]) => `
              <div class="submission-review-field">
                <span class="label">${k}: </span>
                <span class="value" style="color:var(--primary)">${v}</span>
              </div>
            `).join('')}
          </div>
          ${s.status === 'pending' ? `
            <div class="submission-review-actions">
              <input type="text" id="supReviewNote_${s.id}" placeholder="审核备注（可选）">
              <button class="btn btn-primary btn-sm" onclick="reviewSupplement(${s.id}, 'approved')">通过</button>
              <button class="btn btn-danger btn-sm" onclick="reviewSupplement(${s.id}, 'rejected')">拒绝</button>
            </div>
          ` : `
            ${s.reviewNote ? `<div style="margin-top:12px;font-size:13px;color:#666;">审核备注: ${s.reviewNote}</div>` : ''}
          `}
        </div>
      `;
    }).join('');
  }

  window.reviewSupplement = function(id, status) {
    const supplements = getSupplements();
    const idx = supplements.findIndex(s => s.id === id);
    if (idx === -1) return;

    const noteInput = document.getElementById('supReviewNote_' + id);
    supplements[idx].status = status;
    supplements[idx].reviewedAt = new Date().toISOString();
    supplements[idx].reviewNote = noteInput ? noteInput.value.trim() : '';

    // 如果通过，合并数据到对应的飞机
    if (status === 'approved') {
      const airplaneId = supplements[idx].airplaneId;
      const changes = supplements[idx].changes;
      const airplaneIdx = data.airplanes.findIndex(a => a.id === airplaneId);

      if (airplaneIdx > -1) {
        // 合并changes到现有飞机数据
        Object.entries(changes).forEach(([key, value]) => {
          data.airplanes[airplaneIdx][key] = value;
        });
        saveToLocalStorage();
        renderTable();
        showToast('补全信息已合并到飞机数据');
      } else {
        showToast('未找到对应的飞机数据', 'error');
      }
    } else {
      showToast('已拒绝');
    }

    saveSupplements(supplements);
    renderSupplements();
  };

  // ========== 留言管理 ==========
  function renderMessages() {
    const messages = getMessages();
    const container = document.getElementById('adminMessagesList');

    // 更新未回复数量
    const unreadCount = messages.filter(m => !m.reply).length;
    document.getElementById('unreadCount').textContent = unreadCount;

    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-message">暂无留言</div>';
      return;
    }

    container.innerHTML = messages.reverse().map(m => `
      <div class="admin-message-item">
        <div class="admin-message-header">
          <div class="admin-message-user">${m.userNickname} (${m.userId})</div>
          <div class="admin-message-time">${new Date(m.submittedAt).toLocaleString()}</div>
        </div>
        <div class="admin-message-content">${escapeHtml(m.content)}</div>
        ${m.reply ? `
          <div class="admin-message-reply">
            <div class="admin-message-reply-label">管理员回复 (${new Date(m.repliedAt).toLocaleString()})</div>
            <div>${escapeHtml(m.reply)}</div>
          </div>
        ` : `
          <div class="admin-message-reply-area">
            <input type="text" id="reply_${m.id}" placeholder="输入回复内容...">
            <button class="btn btn-primary btn-sm" onclick="replyMessage(${m.id})">回复</button>
          </div>
        `}
      </div>
    `).join('');
  }

  window.replyMessage = function(id) {
    const messages = getMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return;

    const input = document.getElementById('reply_' + id);
    const reply = input.value.trim();
    if (!reply) {
      showToast('请输入回复内容', 'error');
      return;
    }

    messages[idx].reply = reply;
    messages[idx].repliedAt = new Date().toISOString();
    saveMessages(messages);
    renderMessages();
    showToast('回复成功');
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', async () => {
    // 初始化数据库连接
    if (typeof DB !== 'undefined') {
      const connected = await DB.init();
      if (connected) {
        showToast('已连接云端数据库');
      }
    }

    const saved = loadFromLocalStorage();
    if (saved && saved.airplanes && saved.airplanes.length > 0) {
      data = saved;
      nextId = Math.max(...data.airplanes.map(a => a.id), 0) + 1;
      loadUploadedImages();
      initUI();
      renderSubmissions();
      renderSupplements();
      renderMessages();
    } else {
      loadData().then(() => {
        renderSubmissions();
        renderSupplements();
        renderMessages();
      });
    }

    // 审核状态筛选
    document.getElementById('submissionStatusFilter').addEventListener('change', renderSubmissions);
    document.getElementById('supplementStatusFilter').addEventListener('change', renderSupplements);
  });
})();