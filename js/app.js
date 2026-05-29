/**
 * 天空纪 - 全球飞机选购平台
 * 主应用逻辑
 */

(function () {
  'use strict';

  // ========== 状态管理 ==========
  const state = {
    airplanes: [],
    categories: [],
    brands: [],
    uploadedImages: {}, // { airplaneId: [base64, ...] }
    filters: {
      category: 'all',
      brand: 'all',
      price: 'all',
      engine: 'all',
      seat: 'all',
      range: 'all',
      speed: 'all',
      engineType: 'all',
      country: 'all',
      status: 'all',
      search: ''
    },
    sort: 'default',
    compareList: []
  };

  const COUNTRY_FLAGS = {
    '美国': '🇺🇸', '欧洲': '🇪🇺', '中国': '🇨🇳', '巴西': '🇧🇷',
    '加拿大': '🇨🇦', '法国': '🇫🇷', '俄罗斯': '🇷🇺', '乌克兰': '🇺🇦',
    '意大利': '🇮🇹', '瑞士': '🇨🇭', '荷兰': '🇳🇱', '瑞典': '🇸🇪',
    '德国': '🇩🇪', '英国': '🇬🇧', '日本': '🇯🇵', '韩国': '🇰🇷',
    '西班牙': '🇪🇸', '印度': '🇮🇳', '波兰': '🇵🇱'
  };

  // ========== 数据加载 ==========
  async function loadData() {
    try {
      const resp = await fetch('data/airplanes.json');
      const data = await resp.json();
      state.airplanes = data.airplanes;
      state.categories = data.categories;
      state.brands = data.brands;
      // 加载已上传的图片
      loadUploadedImages();
      initUI();
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  function loadUploadedImages() {
    try {
      const saved = localStorage.getItem('airplane-images');
      if (saved) state.uploadedImages = JSON.parse(saved);
    } catch (e) { /* ignore */ }
  }

  // ========== 获取飞机图片列表 ==========
  function getAirplaneImages(a) {
    const images = [];
    // 1. 先加JSON中image字段的URL（支持字符串或数组）
    if (a.image) {
      if (Array.isArray(a.image)) {
        a.image.forEach(img => { if (img) images.push(img); });
      } else if (a.image) {
        images.push(a.image);
      }
    }
    // 2. 再加用户上传的base64图片
    if (state.uploadedImages[a.id]) {
      state.uploadedImages[a.id].forEach(img => images.push(img));
    }
    return images;
  }

  // ========== UI初始化 ==========
  function initUI() {
    renderCategoryTabs();
    renderBrandFilter();
    renderEngineTypeFilter();
    renderCountryFilter();
    bindEvents();
    applyFilters();
  }

  function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    state.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-tab';
      btn.dataset.category = cat.id;
      btn.innerHTML = `<span class="tab-icon">${cat.icon}</span><span>${cat.name}</span>`;
      container.appendChild(btn);
    });
  }

  function renderBrandFilter() {
    const container = document.getElementById('brandFilter');
    const expandBtn = document.getElementById('brandExpand');
    state.brands.forEach(brand => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.brand = brand.id;
      btn.textContent = brand.name;
      container.appendChild(btn);
    });
    expandBtn.addEventListener('click', () => {
      container.classList.toggle('expanded');
      expandBtn.textContent = container.classList.contains('expanded') ? '收起 ▲' : '展开 ▼';
    });
  }

  function renderEngineTypeFilter() {
    const container = document.getElementById('engineTypeFilter');
    const types = [...new Set(state.airplanes.map(a => a.engineType).filter(Boolean))];
    types.forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.enginetype = type;
      btn.textContent = type;
      container.appendChild(btn);
    });
  }

  function renderCountryFilter() {
    const container = document.getElementById('countryFilter');
    const countries = [...new Set(state.airplanes.map(a => a.country).filter(Boolean))];
    countries.forEach(country => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.country = country;
      btn.textContent = `${COUNTRY_FLAGS[country] || ''} ${country}`;
      container.appendChild(btn);
    });
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    document.getElementById('categoryTabs').addEventListener('click', e => {
      const tab = e.target.closest('.category-tab');
      if (!tab) return;
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filters.category = tab.dataset.category;
      applyFilters();
    });

    document.getElementById('brandFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('brandFilter', e.target);
      state.filters.brand = e.target.dataset.brand;
      applyFilters();
    });

    document.getElementById('priceFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('priceFilter', e.target);
      state.filters.price = e.target.dataset.price;
      applyFilters();
    });

    document.getElementById('engineFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('engineFilter', e.target);
      state.filters.engine = e.target.dataset.engine;
      applyFilters();
    });

    document.getElementById('seatFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('seatFilter', e.target);
      state.filters.seat = e.target.dataset.seat;
      applyFilters();
    });

    document.getElementById('rangeFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('rangeFilter', e.target);
      state.filters.range = e.target.dataset.range;
      applyFilters();
    });

    document.getElementById('speedFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('speedFilter', e.target);
      state.filters.speed = e.target.dataset.speed;
      applyFilters();
    });

    document.getElementById('engineTypeFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('engineTypeFilter', e.target);
      state.filters.engineType = e.target.dataset.enginetype;
      applyFilters();
    });

    document.getElementById('countryFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('countryFilter', e.target);
      state.filters.country = e.target.dataset.country;
      applyFilters();
    });

    document.getElementById('statusFilter').addEventListener('click', e => {
      if (!e.target.classList.contains('filter-btn')) return;
      setActiveFilter('statusFilter', e.target);
      state.filters.status = e.target.dataset.status;
      applyFilters();
    });

    document.getElementById('advancedToggle').addEventListener('click', () => {
      document.getElementById('advancedFilters').classList.toggle('open');
      document.getElementById('advancedToggle').classList.toggle('open');
    });

    document.querySelector('.sort-options').addEventListener('click', e => {
      const btn = e.target.closest('.sort-btn');
      if (!btn) return;
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sort = btn.dataset.sort;
      applyFilters();
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      state.filters.search = e.target.value.trim().toLowerCase();
      applyFilters();
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('detailModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('compareModalClose').addEventListener('click', closeCompareModal);
    document.getElementById('compareModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeCompareModal();
    });

    document.getElementById('compareClear').addEventListener('click', () => {
      state.compareList = [];
      updateComparePanel();
      document.querySelectorAll('.card-compare-btn').forEach(b => b.classList.remove('active'));
    });

    document.getElementById('compareBtn').addEventListener('click', openCompareModal);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
        closeCompareModal();
      }
    });
  }

  function setActiveFilter(containerId, activeBtn) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  // ========== 筛选与排序逻辑 ==========
  function applyFilters() {
    let result = [...state.airplanes];

    if (state.filters.category !== 'all') {
      result = result.filter(a => a.category === state.filters.category);
    }
    if (state.filters.brand !== 'all') {
      result = result.filter(a => a.brand === state.filters.brand);
    }
    if (state.filters.price !== 'all') {
      const [min, max] = state.filters.price.split('-').map(Number);
      result = result.filter(a => {
        const price = a.priceMax || a.priceMin || 0;
        return price >= min && price < max;
      });
    }
    if (state.filters.engine !== 'all') {
      result = result.filter(a => a.engineCount === parseInt(state.filters.engine));
    }
    if (state.filters.seat !== 'all') {
      const [min, max] = state.filters.seat.split('-').map(Number);
      result = result.filter(a => a.maxPassengers >= min && a.maxPassengers <= max);
    }
    if (state.filters.range !== 'all') {
      const [min, max] = state.filters.range.split('-').map(Number);
      result = result.filter(a => a.maxRange >= min && a.maxRange < max);
    }
    if (state.filters.speed !== 'all') {
      const [min, max] = state.filters.speed.split('-').map(Number);
      result = result.filter(a => a.cruiseSpeed >= min && a.cruiseSpeed < max);
    }
    if (state.filters.engineType !== 'all') {
      result = result.filter(a => a.engineType === state.filters.engineType);
    }
    if (state.filters.country !== 'all') {
      result = result.filter(a => a.country === state.filters.country);
    }
    if (state.filters.status !== 'all') {
      result = result.filter(a => a.status === state.filters.status);
    }
    if (state.filters.search) {
      const s = state.filters.search;
      result = result.filter(a =>
        a.name.toLowerCase().includes(s) ||
        a.model.toLowerCase().includes(s) ||
        (a.description || '').toLowerCase().includes(s)
      );
    }

    result = sortAirplanes(result);
    renderAirplaneGrid(result);
    renderActiveFilters();
    document.getElementById('resultCount').textContent = result.length;
    document.getElementById('emptyState').style.display = result.length === 0 ? 'block' : 'none';
  }

  function sortAirplanes(list) {
    const sorted = [...list];
    switch (state.sort) {
      case 'price-asc': sorted.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0)); break;
      case 'price-desc': sorted.sort((a, b) => (b.priceMax || 0) - (a.priceMax || 0)); break;
      case 'range-desc': sorted.sort((a, b) => b.maxRange - a.maxRange); break;
      case 'speed-desc': sorted.sort((a, b) => b.cruiseSpeed - a.cruiseSpeed); break;
      case 'passengers-desc': sorted.sort((a, b) => b.maxPassengers - a.maxPassengers); break;
    }
    return sorted;
  }

  // ========== 渲染飞机卡片 ==========
  function renderAirplaneGrid(airplanes) {
    const grid = document.getElementById('airplaneGrid');
    grid.innerHTML = airplanes.map(a => createAirplaneCard(a)).join('');

    grid.querySelectorAll('.airplane-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.card-compare-btn')) return;
        showDetail(parseInt(card.dataset.id));
      });
    });

    grid.querySelectorAll('.card-compare-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleCompare(parseInt(btn.dataset.id), btn);
      });
    });
  }

  function createAirplaneCard(a) {
    const brand = state.brands.find(b => b.id === a.brand);
    const category = state.categories.find(c => c.id === a.category);
    const flag = COUNTRY_FLAGS[a.country] || '';
    const priceText = formatPrice(a);
    const statusClass = a.status === '在产' ? 'status-active' : (a.status === '损毁' ? 'status-destroyed' : 'status-stopped');
    const isInCompare = state.compareList.includes(a.id);
    const gradientColors = getCategoryGradient(a.category);
    const images = getAirplaneImages(a);
    const hasImage = images.length > 0;

    const imageContent = hasImage
      ? `<img src="${images[0]}" alt="${a.name}" class="card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-brand-logo" style="display:none">${brand ? brand.logo : '?'}</div>`
      : `<div class="card-brand-logo">${brand ? brand.logo : '?'}</div>`;

    const imageCountBadge = images.length > 1
      ? `<span class="card-img-count">📷 ${images.length}</span>`
      : '';

    return `
      <div class="airplane-card" data-id="${a.id}">
        <div class="card-image" style="background: linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})">
          ${imageContent}
          <div class="card-category">${category ? category.name : ''}</div>
          ${imageCountBadge}
          <button class="card-compare-btn ${isInCompare ? 'active' : ''}" data-id="${a.id}" title="加入对比">⚖</button>
        </div>
        <div class="card-body">
          <div class="card-title">
            ${a.name}
            <span class="country-flag">${flag}</span>
          </div>
          <div class="card-subtitle">${a.model} | ${a.engineType} × ${a.engineCount}</div>
          <div class="card-specs">
            <div class="spec-item">
              <div class="spec-value">${a.maxPassengers}<small>座</small></div>
              <div class="spec-label">最大座位</div>
            </div>
            <div class="spec-item">
              <div class="spec-value">${a.maxRange}<small>km</small></div>
              <div class="spec-label">最大航程</div>
            </div>
            <div class="spec-item">
              <div class="spec-value">${a.cruiseSpeed}<small>km/h</small></div>
              <div class="spec-label">巡航速度</div>
            </div>
          </div>
          <div class="card-price">
            <div class="price-text">${priceText}</div>
            <span class="card-status ${statusClass}">${a.status}</span>
          </div>
        </div>
      </div>
    `;
  }

  function getCategoryGradient(category) {
    const gradients = {
      'commercial': ['#1a73e8', '#4fc3f7'],
      'business': ['#6a1b9a', '#ab47bc'],
      'military': ['#37474f', '#78909c'],
      'cargo': ['#e65100', '#ff9800'],
      'helicopter': ['#00695c', '#4db6ac'],
      'general': ['#33691e', '#8bc34a'],
      'regional': ['#ad1457', '#f06292']
    };
    return gradients[category] || ['#455a64', '#90a4ae'];
  }

  function formatPrice(a) {
    if (!a.priceMin && !a.priceMax) return '<small>价格未公开</small>';
    if (a.priceMin === a.priceMax) return `${a.priceMin}<small>${a.priceUnit}</small>`;
    if (!a.priceMin) return `${a.priceMax}<small>${a.priceUnit}</small>`;
    return `${a.priceMin}-${a.priceMax}<small>${a.priceUnit}</small>`;
  }

  // ========== 已选筛选条件 ==========
  function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    const tags = [];

    if (state.filters.category !== 'all') {
      const cat = state.categories.find(c => c.id === state.filters.category);
      tags.push({ label: cat ? cat.name : state.filters.category, type: 'category' });
    }
    if (state.filters.brand !== 'all') {
      const brand = state.brands.find(b => b.id === state.filters.brand);
      tags.push({ label: brand ? brand.name : state.filters.brand, type: 'brand' });
    }
    if (state.filters.price !== 'all') {
      const [min, max] = state.filters.price.split('-').map(Number);
      tags.push({ label: `价格 ${min}-${max}万`, type: 'price' });
    }
    if (state.filters.engine !== 'all') tags.push({ label: `${state.filters.engine}台发动机`, type: 'engine' });
    if (state.filters.seat !== 'all') tags.push({ label: `座位 ${state.filters.seat}`, type: 'seat' });
    if (state.filters.range !== 'all') tags.push({ label: `航程 ${state.filters.range}km`, type: 'range' });
    if (state.filters.speed !== 'all') tags.push({ label: `速度 ${state.filters.speed}km/h`, type: 'speed' });
    if (state.filters.engineType !== 'all') tags.push({ label: state.filters.engineType, type: 'engineType' });
    if (state.filters.country !== 'all') tags.push({ label: state.filters.country, type: 'country' });
    if (state.filters.status !== 'all') tags.push({ label: state.filters.status, type: 'status' });

    container.innerHTML = tags.map(t =>
      `<span class="active-filter-tag">${t.label}<span class="remove" data-type="${t.type}">&times;</span></span>`
    ).join('');

    container.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        resetFilter(btn.dataset.type);
        applyFilters();
      });
    });
  }

  function resetFilter(type) {
    state.filters[type] = 'all';
    const containerMap = {
      category: 'categoryTabs', brand: 'brandFilter', price: 'priceFilter',
      engine: 'engineFilter', seat: 'seatFilter', range: 'rangeFilter',
      speed: 'speedFilter', engineType: 'engineTypeFilter', country: 'countryFilter', status: 'statusFilter'
    };
    const container = document.getElementById(containerMap[type]);
    if (container) {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      container.querySelector('.filter-btn').classList.add('active');
    }
    if (type === 'category') {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.category-tab[data-category="all"]').classList.add('active');
    }
  }

  // ========== 详情弹窗（含图片轮播） ==========
  function showDetail(id) {
    const a = state.airplanes.find(p => p.id === id);
    if (!a) return;
    const brand = state.brands.find(b => b.id === a.brand);
    const flag = COUNTRY_FLAGS[a.country] || '';
    const gradientColors = getCategoryGradient(a.category);
    const images = getAirplaneImages(a);

    // 图片轮播HTML
    let carouselHtml = '';
    if (images.length > 0) {
      carouselHtml = `
        <div class="detail-carousel" id="detailCarousel">
          <div class="carousel-track" id="carouselTrack">
            ${images.map((img, i) => `<div class="carousel-slide"><img src="${img}" alt="${a.name} ${i + 1}" onerror="this.parentElement.innerHTML='<div class=\\'img-fallback\\'>图片加载失败</div>'"></div>`).join('')}
          </div>
          ${images.length > 1 ? `
            <button class="carousel-btn carousel-prev" id="carouselPrev">&#10094;</button>
            <button class="carousel-btn carousel-next" id="carouselNext">&#10095;</button>
            <div class="carousel-dots" id="carouselDots">
              ${images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
            </div>
            <div class="carousel-counter"><span id="carouselIndex">1</span> / ${images.length}</div>
          ` : ''}
        </div>
      `;
    } else {
      carouselHtml = `
        <div class="detail-image" style="background: linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})">
          <div class="brand-logo">${brand ? brand.logo : '?'}</div>
          <div class="no-image-hint">暂无图片</div>
        </div>
      `;
    }

    const html = `
      <div class="detail-header">
        <div class="detail-image-wrapper">
          ${carouselHtml}
        </div>
        <div class="detail-info">
          <h2>${a.name} ${flag}</h2>
          <div class="detail-meta">${brand ? brand.name : ''} | ${a.model} | ${a.firstFlight || ''}首飞</div>
          <div class="detail-desc">${a.description || ''}</div>
          <div class="detail-price">${formatPrice(a)}</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>基本参数</h3>
        <div class="detail-grid">
          <div class="detail-item"><div class="label">飞机类型</div><div class="value">${getCategoryName(a.category)}</div></div>
          <div class="detail-item"><div class="label">生产状态</div><div class="value">${a.status}</div></div>
          <div class="detail-item"><div class="label">产地</div><div class="value">${flag} ${a.country}</div></div>
          <div class="detail-item"><div class="label">首飞时间</div><div class="value">${a.firstFlight || '未知'}</div></div>
        </div>
      </div>

      <div class="detail-section">
        <h3>动力系统</h3>
        <div class="detail-grid">
          <div class="detail-item"><div class="label">发动机数量</div><div class="value">${a.engineCount || '未知'}${a.engineCount ? '台' : ''}</div></div>
          <div class="detail-item"><div class="label">发动机类型</div><div class="value">${a.engineType || '未知'}</div></div>
          <div class="detail-item"><div class="label">发动机型号</div><div class="value">${a.engineModel || '未知'}</div></div>
          <div class="detail-item"><div class="label">燃油容量</div><div class="value">${fmt(a.fuelCapacity, 'L')}</div></div>
        </div>
      </div>

      <div class="detail-section">
        <h3>性能参数</h3>
        <div class="detail-grid">
          <div class="detail-item"><div class="label">最大航程</div><div class="value">${fmt(a.maxRange, 'km')}</div></div>
          <div class="detail-item"><div class="label">巡航速度</div><div class="value">${fmt(a.cruiseSpeed, 'km/h')}</div></div>
          <div class="detail-item"><div class="label">最大速度</div><div class="value">${fmt(a.maxSpeed, 'km/h')}</div></div>
          <div class="detail-item"><div class="label">实用升限</div><div class="value">${fmt(a.serviceCeiling, 'm')}</div></div>
          <div class="detail-item"><div class="label">最大起飞重量</div><div class="value">${formatWeight(a.maxTakeoffWeight)}</div></div>
          <div class="detail-item"><div class="label">空重</div><div class="value">${formatWeight(a.emptyWeight)}</div></div>
          <div class="detail-item"><div class="label">燃油消耗</div><div class="value">${fmt(a.fuelConsumption, 'L/h')}</div></div>
          ${a.cargoCapacity ? `<div class="detail-item"><div class="label">载货量</div><div class="value">${formatWeight(a.cargoCapacity)}</div></div>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h3>尺寸规格</h3>
        <div class="detail-grid">
          <div class="detail-item"><div class="label">翼展</div><div class="value">${fmt(a.wingspan, 'm')}</div></div>
          <div class="detail-item"><div class="label">机身长度</div><div class="value">${fmt(a.length, 'm')}</div></div>
          <div class="detail-item"><div class="label">高度</div><div class="value">${fmt(a.height, 'm')}</div></div>
          <div class="detail-item"><div class="label">机舱宽度</div><div class="value">${fmt(a.cabinWidth, 'm')}</div></div>
          <div class="detail-item"><div class="label">机舱高度</div><div class="value">${fmt(a.cabinHeight, 'm')}</div></div>
          <div class="detail-item"><div class="label">机舱长度</div><div class="value">${fmt(a.cabinLength, 'm')}</div></div>
        </div>
      </div>

      <div class="detail-section">
        <h3>载客信息</h3>
        <div class="detail-grid">
          <div class="detail-item"><div class="label">最大座位数</div><div class="value">${a.maxPassengers || '未知'}${a.maxPassengers ? '座' : ''}</div></div>
          <div class="detail-item"><div class="label">典型座位数</div><div class="value">${a.typicalPassengers || '未知'}${a.typicalPassengers ? '座' : ''}</div></div>
        </div>
      </div>

      <div class="detail-actions">
        <a href="submit.html?supplement=${a.id}" class="btn btn-outline">📝 补全/纠错信息</a>
      </div>
    `;

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('detailModal').classList.add('show');
    document.body.style.overflow = 'hidden';

    // 初始化轮播
    if (images.length > 1) {
      initCarousel(images.length);
    }
  }

  // ========== 轮播逻辑 ==========
  function initCarousel(total) {
    let current = 0;
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    const indexEl = document.getElementById('carouselIndex');

    function goTo(n) {
      current = ((n % total) + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      if (indexEl) indexEl.textContent = current + 1;
    }

    document.getElementById('carouselPrev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('carouselNext').addEventListener('click', () => goTo(current + 1));
    dots.forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.index))));

    // 支持触摸滑动
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    });
  }

  function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
    document.body.style.overflow = '';
  }

  function getCategoryName(id) {
    const cat = state.categories.find(c => c.id === id);
    return cat ? cat.name : id;
  }

  function formatWeight(kg) {
    if (!kg) return '未知';
    if (kg >= 1000) return (kg / 1000).toFixed(1) + ' 吨';
    return kg + ' kg';
  }

  function fmt(val, unit) {
    return val ? val + ' ' + unit : '未知';
  }

  // ========== 对比功能 ==========
  function toggleCompare(id, btn) {
    const idx = state.compareList.indexOf(id);
    if (idx > -1) {
      state.compareList.splice(idx, 1);
      btn.classList.remove('active');
    } else {
      if (state.compareList.length >= 3) {
        alert('最多支持3款飞机同时对比');
        return;
      }
      state.compareList.push(id);
      btn.classList.add('active');
    }
    updateComparePanel();
  }

  function updateComparePanel() {
    const panel = document.getElementById('comparePanel');
    const items = document.getElementById('compareItems');
    const count = document.getElementById('compareCount');
    const btn = document.getElementById('compareBtn');

    count.textContent = state.compareList.length;
    panel.classList.toggle('show', state.compareList.length > 0);

    let html = '';
    for (let i = 0; i < 3; i++) {
      if (i < state.compareList.length) {
        const a = state.airplanes.find(p => p.id === state.compareList[i]);
        html += `<div class="compare-item">${a.name}<span class="remove" data-id="${a.id}">&times;</span></div>`;
      } else {
        html += `<div class="compare-item empty">+ 添加</div>`;
      }
    }
    items.innerHTML = html;
    btn.disabled = state.compareList.length < 2;

    items.querySelectorAll('.remove').forEach(r => {
      r.addEventListener('click', () => {
        const id = parseInt(r.dataset.id);
        state.compareList = state.compareList.filter(x => x !== id);
        document.querySelectorAll(`.card-compare-btn[data-id="${id}"]`).forEach(b => b.classList.remove('active'));
        updateComparePanel();
      });
    });
  }

  function openCompareModal() {
    if (state.compareList.length < 2) return;
    const airplanes = state.compareList.map(id => state.airplanes.find(a => a.id === id));

    const rows = [
      { label: '品牌', key: a => { const b = state.brands.find(x => x.id === a.brand); return b ? b.name : '-'; } },
      { label: '型号', key: a => a.model },
      { label: '类型', key: a => getCategoryName(a.category) },
      { label: '产地', key: a => `${COUNTRY_FLAGS[a.country] || ''} ${a.country}` },
      { label: '参考价格', key: a => formatPrice(a).replace(/<[^>]+>/g, '') },
      { label: '发动机数量', key: a => a.engineCount + '台' },
      { label: '发动机类型', key: a => a.engineType },
      { label: '发动机型号', key: a => a.engineModel || '-' },
      { label: '最大座位数', key: a => a.maxPassengers + '座' },
      { label: '典型座位数', key: a => a.typicalPassengers + '座' },
      { label: '最大航程', key: a => a.maxRange + ' km' },
      { label: '巡航速度', key: a => a.cruiseSpeed + ' km/h' },
      { label: '最大速度', key: a => a.maxSpeed + ' km/h' },
      { label: '实用升限', key: a => a.serviceCeiling + ' m' },
      { label: '最大起飞重量', key: a => formatWeight(a.maxTakeoffWeight) },
      { label: '空重', key: a => formatWeight(a.emptyWeight) },
      { label: '翼展', key: a => a.wingspan ? a.wingspan + ' m' : '-' },
      { label: '机身长度', key: a => a.length + ' m' },
      { label: '高度', key: a => a.height + ' m' },
      { label: '机舱宽度', key: a => a.cabinWidth ? a.cabinWidth + ' m' : '-' },
      { label: '机舱高度', key: a => a.cabinHeight ? a.cabinHeight + ' m' : '-' },
      { label: '机舱长度', key: a => a.cabinLength ? a.cabinLength + ' m' : '-' },
      { label: '燃油容量', key: a => a.fuelCapacity ? a.fuelCapacity + ' L' : '-' },
      { label: '燃油消耗', key: a => a.fuelConsumption ? a.fuelConsumption + ' L/h' : '-' },
      { label: '生产状态', key: a => a.status },
    ];

    let tableHtml = '<table class="compare-table"><thead><tr><th>参数</th>';
    airplanes.forEach(a => { tableHtml += `<th>${a.name}</th>`; });
    tableHtml += '</tr></thead><tbody>';

    rows.forEach(row => {
      tableHtml += `<tr><th>${row.label}</th>`;
      airplanes.forEach(a => { tableHtml += `<td>${row.key(a)}</td>`; });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    document.getElementById('compareTableWrapper').innerHTML = tableHtml;
    document.getElementById('compareModal').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeCompareModal() {
    document.getElementById('compareModal').classList.remove('show');
    document.body.style.overflow = '';
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', loadData);
})();