/**
 * 天空纪 - 数据存储层
 * 支持 Supabase 和 localStorage 双模式
 */

const DB = (function () {
  'use strict';

  let supabase = null;
  let useSupabase = false;
  let initialized = false;

  // ========== 初始化 ==========
  async function init() {
    if (initialized) return useSupabase;
    
    const config = window.SUPABASE_CONFIG || {};
    useSupabase = config.enabled && config.url && config.anonKey;

    if (useSupabase) {
      try {
        // 动态加载 Supabase 客户端
        if (!window.supabase) {
          console.log('正在加载 Supabase SDK...');
          await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        }
        supabase = window.supabase.createClient(config.url, config.anonKey);
        
        // 测试连接
        const { data, error } = await supabase.from('messages').select('count').limit(1);
        if (error) throw error;
        
        console.log('✅ Supabase 已连接');
        useSupabase = true;
      } catch (e) {
        console.warn('❌ Supabase 连接失败，回退到 localStorage:', e.message || e);
        useSupabase = false;
      }
    } else {
      console.log('ℹ️ 使用 localStorage 存储（未配置 Supabase）');
    }

    initialized = true;
    return useSupabase;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log('Supabase SDK 加载完成');
        resolve();
      };
      script.onerror = () => reject(new Error('无法加载 Supabase SDK'));
      document.head.appendChild(script);
    });
  }

  // 检查是否使用 Supabase
  function isUsingSupabase() {
    return useSupabase;
  }

  // ========== 用户管理 ==========
  const USER_KEY = 'skyera-user';

  async function getUser() {
    const local = localStorage.getItem(USER_KEY);
    if (local) return JSON.parse(local);
    return null;
  }

  async function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // ========== 提交管理 ==========
  const SUBMISSIONS_KEY = 'skyera-submissions';

  async function getSubmissions() {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    }
    try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  async function addSubmission(submission) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('submissions')
        .insert([{
          id: submission.id,
          user_id: submission.userId,
          user_nickname: submission.userNickname,
          type: submission.type,
          status: submission.status,
          data: submission.data,
          airplane_id: submission.airplaneId,
          airplane_name: submission.airplaneName,
          changes: submission.changes,
          submitted_at: submission.submittedAt
        }])
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getSubmissions();
    list.push(submission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
    return submission;
  }

  async function updateSubmission(id, updates) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status: updates.status,
          reviewed_at: updates.reviewedAt,
          review_note: updates.reviewNote
        })
        .eq('id', id)
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getSubmissions();
    const idx = list.findIndex(s => s.id === id);
    if (idx > -1) {
      Object.assign(list[idx], updates);
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
      return list[idx];
    }
    return null;
  }

  async function deleteSubmission(id) {
    if (useSupabase) {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);
      if (error) { console.error(error); return false; }
      return true;
    }
    const list = await getSubmissions();
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
    return true;
  }

  // ========== 留言管理 ==========
  const MESSAGES_KEY = 'skyera-messages';

  async function getMessages() {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    }
    try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]'); }
    catch (e) { return []; }
  }

  async function addMessage(message) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          id: message.id,
          user_id: message.userId,
          user_nickname: message.userNickname,
          content: message.content,
          submitted_at: message.submittedAt
        }])
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getMessages();
    list.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
    return message;
  }

  async function updateMessage(id, updates) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('messages')
        .update({
          reply: updates.reply,
          replied_at: updates.repliedAt
        })
        .eq('id', id)
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getMessages();
    const idx = list.findIndex(m => m.id === id);
    if (idx > -1) {
      Object.assign(list[idx], updates);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
      return list[idx];
    }
    return null;
  }

  // ========== 草稿管理 ==========
  const DRAFTS_KEY = 'skyera-drafts';
  const DRAFT_MAX = 2;
  const DRAFT_EXPIRE_MS = 3 * 24 * 60 * 60 * 1000;

  async function getDrafts(userId) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });
      if (error) { console.error(error); return []; }
      // 过滤过期草稿
      const now = Date.now();
      return (data || []).filter(d => now - new Date(d.saved_at).getTime() < DRAFT_EXPIRE_MS);
    }
    try {
      let drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
      const now = Date.now();
      drafts = drafts.filter(d => now - d.savedAt < DRAFT_EXPIRE_MS);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return drafts;
    } catch (e) { return []; }
  }

  async function addDraft(draft) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('drafts')
        .insert([{
          id: draft.id,
          user_id: draft.userId,
          data: draft.data,
          saved_at: new Date(draft.savedAt).toISOString()
        }])
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getDrafts();
    if (list.length >= DRAFT_MAX) return null;
    list.push(draft);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list));
    return draft;
  }

  async function deleteDraft(id) {
    if (useSupabase) {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id);
      if (error) { console.error(error); return false; }
      return true;
    }
    let list = await getDrafts();
    list = list.filter(d => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list));
    return true;
  }

  // ========== 补全管理 ==========
  const SUPPLEMENTS_KEY = 'skyera-supplements';

  async function getSupplements() {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    }
    try { return JSON.parse(localStorage.getItem(SUPPLEMENTS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  async function addSupplement(supplement) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('supplements')
        .insert([{
          id: supplement.id,
          user_id: supplement.userId,
          user_nickname: supplement.userNickname,
          airplane_id: supplement.airplaneId,
          airplane_name: supplement.airplaneName,
          changes: supplement.changes,
          status: supplement.status,
          submitted_at: supplement.submittedAt
        }])
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getSupplements();
    list.push(supplement);
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(list));
    return supplement;
  }

  async function updateSupplement(id, updates) {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('supplements')
        .update({
          status: updates.status,
          reviewed_at: updates.reviewedAt,
          review_note: updates.reviewNote
        })
        .eq('id', id)
        .select();
      if (error) { console.error(error); return null; }
      return data?.[0];
    }
    const list = await getSupplements();
    const idx = list.findIndex(s => s.id === id);
    if (idx > -1) {
      Object.assign(list[idx], updates);
      localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(list));
      return list[idx];
    }
    return null;
  }

  // ========== 公开接口 ==========
  return {
    init,
    isUsingSupabase,
    getUser,
    saveUser,
    getSubmissions,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    getMessages,
    addMessage,
    updateMessage,
    getDrafts,
    addDraft,
    deleteDraft,
    getSupplements,
    addSupplement,
    updateSupplement,
    DRAFT_MAX,
    DRAFT_EXPIRE_MS
  };
})();